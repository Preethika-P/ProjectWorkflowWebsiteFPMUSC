import type { Category, Subcategory, WorkflowData } from '@/types';
import { makeScopedCategoryId } from '@/lib/budgets';
import {
  DisplayGroup,
  getDisplayGroups,
  getGroupDisplayName,
  getGroupedSubcategoryDisplayName,
  getProgressSubcategoryId,
} from '@/lib/workflowDisplay';

type ProgressState = Record<string, Record<string, Record<string, boolean>>>;
type NotesState = Record<string, Record<string, string>>;

interface ExportBaseOptions {
  workflowData: WorkflowData;
  budgetKey: string;
  budgetLabel: string;
  progress: ProgressState;
  notes: NotesState;
}

interface ExportCategoryOptions extends ExportBaseOptions {
  category: Category;
  categoryNumber: number;
}

interface ExportItem {
  sectionNumber: number;
  sectionName: string;
  groupName: string;
  type: 'Subsection' | 'Utility';
  itemName: string;
  taskName: string;
  status: 'Done' | 'Not done';
  notes: string;
}

interface PrintableSection {
  sectionNumber: number;
  sectionName: string;
  groups: PrintableGroup[];
  utilities: PrintableItem[];
}

interface PrintableGroup {
  groupName: string;
  items: PrintableItem[];
}

interface PrintableItem {
  type: 'Subsection' | 'Utility';
  name: string;
  notes: string;
  tasks: Array<{
    name: string;
    done: boolean;
  }>;
}

function getNote(notes: NotesState, scopedCategoryId: string, progressSubcategoryId: string) {
  return notes[scopedCategoryId]?.[progressSubcategoryId]?.trim() || '';
}

function isTaskDone(
  progress: ProgressState,
  scopedCategoryId: string,
  progressSubcategoryId: string,
  taskId: string
) {
  return progress[scopedCategoryId]?.[progressSubcategoryId]?.[taskId] === true;
}

function getStatus(done: boolean): ExportItem['status'] {
  return done ? 'Done' : 'Not done';
}

function toPrintableItem(
  subcategory: Subcategory,
  type: 'Subsection' | 'Utility',
  itemName: string,
  scopedCategoryId: string,
  progressSubcategoryId: string,
  progress: ProgressState,
  notes: NotesState
): PrintableItem {
  return {
    type,
    name: itemName,
    notes: getNote(notes, scopedCategoryId, progressSubcategoryId),
    tasks: subcategory.tasks.map((task) => ({
      name: task.name,
      done: isTaskDone(progress, scopedCategoryId, progressSubcategoryId, task.id),
    })),
  };
}

function buildPrintableSection({
  budgetKey,
  category,
  categoryNumber,
  progress,
  notes,
}: ExportCategoryOptions): PrintableSection {
  const scopedCategoryId = makeScopedCategoryId(budgetKey, category.id);
  const groupedSourceIndices = new Set<number>();
  const groups: PrintableGroup[] = [];

  getDisplayGroups(category).forEach((group: DisplayGroup) => {
    const items = group.subcategoryIndices
      .map((index) => {
        groupedSourceIndices.add(index);
        const subcategory = category.subcategories[index];
        if (!subcategory || subcategory.isUtility) return undefined;

        const progressSubcategoryId = getProgressSubcategoryId(category.id, group, subcategory);
        return toPrintableItem(
          subcategory,
          'Subsection',
          getGroupedSubcategoryDisplayName(category.id, group, subcategory),
          scopedCategoryId,
          progressSubcategoryId,
          progress,
          notes
        );
      })
      .filter((item): item is PrintableItem => Boolean(item));

    if (items.length > 0) {
      groups.push({
        groupName: getGroupDisplayName(category.id, group),
        items,
      });
    }
  });

  const ungroupedItems = category.subcategories
    .map((subcategory, index) => ({ subcategory, index }))
    .filter(({ subcategory, index }) => !subcategory.isUtility && !groupedSourceIndices.has(index))
    .map(({ subcategory }) =>
      toPrintableItem(
        subcategory,
        'Subsection',
        subcategory.name,
        scopedCategoryId,
        subcategory.id,
        progress,
        notes
      )
    );

  if (ungroupedItems.length > 0) {
    groups.push({
      groupName: 'Subsections',
      items: ungroupedItems,
    });
  }

  const utilities = category.subcategories
    .filter((subcategory) => subcategory.isUtility)
    .map((subcategory) =>
      toPrintableItem(
        subcategory,
        'Utility',
        subcategory.name,
        scopedCategoryId,
        subcategory.id,
        progress,
        notes
      )
    );

  return {
    sectionNumber: categoryNumber,
    sectionName: category.name,
    groups,
    utilities,
  };
}

function buildPrintableWorkflow(options: ExportBaseOptions) {
  return options.workflowData.categories.map((category, index) =>
    buildPrintableSection({
      ...options,
      category,
      categoryNumber: index + 1,
    })
  );
}

function buildExportRows(sections: PrintableSection[]): ExportItem[] {
  return sections.flatMap((section) => {
    const subsectionRows = section.groups.flatMap((group) =>
      group.items.flatMap((item) =>
        item.tasks.map((task) => ({
          sectionNumber: section.sectionNumber,
          sectionName: section.sectionName,
          groupName: group.groupName,
          type: item.type,
          itemName: item.name,
          taskName: task.name,
          status: getStatus(task.done),
          notes: item.notes,
        }))
      )
    );

    const utilityRows = section.utilities.flatMap((item) =>
      item.tasks.map((task) => ({
        sectionNumber: section.sectionNumber,
        sectionName: section.sectionName,
        groupName: 'Utilities',
        type: item.type,
        itemName: item.name,
        taskName: task.name,
        status: getStatus(task.done),
        notes: item.notes,
      }))
    );

    return [...subsectionRows, ...utilityRows];
  });
}

function escapeHtml(value: string | number) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function makeFileName(title: string) {
  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildPrintDocument(title: string, budgetLabel: string, sections: PrintableSection[]) {
  const generatedAt = new Date().toLocaleString();

  const sectionMarkup = sections
    .map((section) => {
      const groupsMarkup = section.groups
        .map((group) => {
          const itemMarkup = group.items
            .map((item) => buildPrintableItemMarkup(item))
            .join('');

          return `
            <section class="group-block">
              <h3>${escapeHtml(group.groupName)}</h3>
              ${itemMarkup}
            </section>
          `;
        })
        .join('');

      const utilitiesMarkup =
        section.utilities.length > 0
          ? `
            <section class="group-block utilities-block">
              <h3>Utilities</h3>
              ${section.utilities.map((utility) => buildPrintableItemMarkup(utility)).join('')}
            </section>
          `
          : '';

      return `
        <section class="section-block">
          <h2>${section.sectionNumber}. ${escapeHtml(section.sectionName)}</h2>
          ${groupsMarkup}
          ${utilitiesMarkup}
        </section>
      `;
    })
    .join('');

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          @page { margin: 0.55in; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #ffffff;
            color: #1f2937;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
            line-height: 1.45;
          }
          .document-header {
            border-bottom: 3px solid #991b1b;
            margin-bottom: 22px;
            padding-bottom: 14px;
          }
          h1 {
            color: #991b1b;
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 26px;
            margin: 0 0 8px;
          }
          .meta {
            color: #64748b;
            display: flex;
            gap: 18px;
            flex-wrap: wrap;
            font-size: 11px;
          }
          .section-block {
            margin: 0 0 22px;
          }
          h2 {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-left: 5px solid #991b1b;
            break-after: avoid;
            color: #7f1d1d;
            font-size: 18px;
            margin: 0 0 12px;
            padding: 9px 12px;
          }
          h3 {
            color: #334155;
            break-after: avoid;
            font-size: 14px;
            margin: 12px 0 8px;
            padding-bottom: 5px;
            border-bottom: 1px solid #e2e8f0;
          }
          .item {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin: 0 0 10px;
            overflow: hidden;
            break-inside: avoid;
          }
          .item-title {
            background: #f8fafc;
            display: flex;
            justify-content: space-between;
            gap: 12px;
            padding: 8px 10px;
          }
          .item-name {
            color: #111827;
            font-weight: 700;
          }
          .item-type {
            color: #64748b;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .notes {
            border-top: 1px solid #e2e8f0;
            color: #475569;
            padding: 7px 10px;
            white-space: pre-wrap;
          }
          .notes strong {
            color: #334155;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          td {
            border-top: 1px solid #e2e8f0;
            padding: 7px 10px;
            vertical-align: top;
          }
          .status {
            width: 80px;
            font-weight: 700;
            white-space: nowrap;
          }
          .done { color: #166534; }
          .not-done { color: #991b1b; }
        </style>
      </head>
      <body>
        <header class="document-header">
          <h1>${escapeHtml(title)}</h1>
          <div class="meta">
            <span><strong>Budget:</strong> ${escapeHtml(budgetLabel)}</span>
            <span><strong>Generated:</strong> ${escapeHtml(generatedAt)}</span>
          </div>
        </header>
        ${sectionMarkup}
        <script>
          window.addEventListener('load', () => {
            window.focus();
            setTimeout(() => window.print(), 250);
          });
        </script>
      </body>
    </html>
  `;
}

function buildPrintableItemMarkup(item: PrintableItem) {
  const notesMarkup = item.notes
    ? `<div class="notes"><strong>Notes:</strong><br />${escapeHtml(item.notes)}</div>`
    : '<div class="notes"><strong>Notes:</strong> No notes added.</div>';

  const tasksMarkup =
    item.tasks.length > 0
      ? item.tasks
          .map(
            (task) => `
              <tr>
                <td class="status ${task.done ? 'done' : 'not-done'}">
                  ${task.done ? 'Done' : 'Not done'}
                </td>
                <td>${escapeHtml(task.name)}</td>
              </tr>
            `
          )
          .join('')
      : `
        <tr>
          <td class="status not-done">No tasks</td>
          <td>No tasks listed.</td>
        </tr>
      `;

  return `
    <article class="item">
      <div class="item-title">
        <div class="item-name">${escapeHtml(item.name)}</div>
        <div class="item-type">${escapeHtml(item.type)}</div>
      </div>
      <table>
        <tbody>${tasksMarkup}</tbody>
      </table>
      ${notesMarkup}
    </article>
  `;
}

function openPrintDocument(title: string, budgetLabel: string, sections: PrintableSection[]) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.alert('Please allow pop-ups to save this export as a PDF.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(buildPrintDocument(title, budgetLabel, sections));
  printWindow.document.close();
}

function downloadExcel(title: string, budgetLabel: string, sections: PrintableSection[]) {
  const generatedAt = new Date().toLocaleString();
  const rows = buildExportRows(sections);
  const tableRows = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.sectionNumber)}</td>
          <td>${escapeHtml(row.sectionName)}</td>
          <td>${escapeHtml(row.groupName)}</td>
          <td>${escapeHtml(row.type)}</td>
          <td>${escapeHtml(row.itemName)}</td>
          <td>${escapeHtml(row.taskName)}</td>
          <td>${escapeHtml(row.status)}</td>
          <td>${escapeHtml(row.notes || 'No notes added.')}</td>
        </tr>
      `
    )
    .join('');

  const workbook = `
    <!doctype html>
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; }
          th { background: #fef2f2; color: #7f1d1d; font-weight: 700; }
          th, td { border: 1px solid #d7dee8; padding: 8px; vertical-align: top; }
        </style>
      </head>
      <body>
        <table>
          <tr><th colspan="8">${escapeHtml(title)}</th></tr>
          <tr><td colspan="8">Budget: ${escapeHtml(budgetLabel)}</td></tr>
          <tr><td colspan="8">Generated: ${escapeHtml(generatedAt)}</td></tr>
          <tr>
            <th>Section #</th>
            <th>Section</th>
            <th>Group</th>
            <th>Type</th>
            <th>Subsection / Utility</th>
            <th>Task</th>
            <th>Status</th>
            <th>Notes</th>
          </tr>
          ${tableRows}
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([workbook], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${makeFileName(title)}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function saveCategoryAsPdf(options: ExportCategoryOptions) {
  const section = buildPrintableSection(options);
  openPrintDocument(
    `${options.categoryNumber}. ${options.category.name} Full Detail Export`,
    options.budgetLabel,
    [section]
  );
}

export function saveCategoryToExcel(options: ExportCategoryOptions) {
  const section = buildPrintableSection(options);
  downloadExcel(
    `${options.categoryNumber}. ${options.category.name} Full Detail Export`,
    options.budgetLabel,
    [section]
  );
}

export function saveWorkflowAsPdf(options: ExportBaseOptions) {
  const sections = buildPrintableWorkflow(options);
  openPrintDocument('Project Roadmap Full Detail Export', options.budgetLabel, sections);
}

export function saveWorkflowToExcel(options: ExportBaseOptions) {
  const sections = buildPrintableWorkflow(options);
  downloadExcel('Project Roadmap Full Detail Export', options.budgetLabel, sections);
}
