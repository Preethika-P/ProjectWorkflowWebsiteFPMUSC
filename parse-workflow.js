import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workflowText = fs.readFileSync('workflow.txt', 'utf-8');

const lines = workflowText.split('\n');
const workflow = {
  budgetRange: '',
  categories: []
};

let currentCategory = null;
let currentSubcategory = null;
let currentGroup = null;
const groups = {};

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

lines.forEach((line, index) => {
  const originalLine = line;
  line = line.trim();
  
  // Budget Range
  if (line.startsWith('### ')) {
    workflow.budgetRange = line.replace('### ', '').trim();
  }
  
  // Category
  else if (line.startsWith('#### Category: ')) {
    const categoryName = line.replace('#### Category: ', '').trim();
    currentCategory = {
      id: slugify(categoryName),
      name: categoryName,
      subcategories: [],
      groups: []
    };
    workflow.categories.push(currentCategory);
    groups[currentCategory.id] = {};
  }
  
  // Sub-category
  else if (line.startsWith('*   **Sub-category: ')) {
    const match = line.match(/\*\s+\*\*Sub-category:\s+(.+?)\*\*(?:\s+\((.+?)\))?/);
    if (match && currentCategory) {
      const subcategoryName = match[1].trim();
      let subgroup = match[2] ? match[2].trim() : null;
      // Extract just the letter from "subgroup A" or "subgroup B", etc.
      if (subgroup && subgroup.toLowerCase().startsWith('subgroup ')) {
        subgroup = subgroup.substring(9).trim(); // Remove "subgroup " prefix
      }
      const isUtility = subgroup === 'utility';
      
      currentSubcategory = {
        id: slugify(subcategoryName),
        name: subcategoryName,
        tasks: [],
        subgroup: subgroup,
        isUtility: isUtility
      };
      
      currentCategory.subcategories.push(currentSubcategory);
      
      // Handle groups
      if (subgroup && !isUtility) {
        const groupKey = `${currentCategory.id}-${subgroup}`;
        if (!groups[currentCategory.id][groupKey]) {
          groups[currentCategory.id][groupKey] = {
            id: groupKey,
            subgroup: subgroup,
            subcategoryIndices: []
          };
        }
        const subcategoryIndex = currentCategory.subcategories.length - 1;
        groups[currentCategory.id][groupKey].subcategoryIndices.push(subcategoryIndex);
      }
    }
  }
  
  // Task - check original line for indentation (4 spaces + *   )
  else if (originalLine.startsWith('    *   ') && currentSubcategory) {
    const taskName = originalLine.replace('    *   ', '').trim();
    if (taskName && taskName !== '*No tasks listed*') {
      currentSubcategory.tasks.push({
        id: slugify(taskName),
        name: taskName
      });
    }
  }
});

// Convert groups object to arrays
workflow.categories.forEach(category => {
  category.groups = Object.values(groups[category.id] || {});
});

// Write to JSON
const outputPath = path.join(__dirname, 'public', 'workflow.json');
fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 2));
console.log(`✅ Parsed workflow and saved to ${outputPath}`);

