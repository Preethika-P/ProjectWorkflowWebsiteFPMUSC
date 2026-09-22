# USC FPM Project Workflow Portal

A browser-based project workflow guide for USC Facilities Planning and Management (FPM). The portal organizes the project lifecycle into navigable phases, checklists, utilities and reference documents so project teams can track work from initiation through post-closeout.

## Overview

Users begin by selecting a project budget range:

- Up to $10 million
- $10 million and above

The selected roadmap presents seven project phases:

1. Project Initiation
2. Feasibility
3. Design and Permit
4. Bid and Award
5. Construction
6. Closeout
7. Post-Closeout

The current workflow dataset contains 373 tasks across these phases. Each budget selection maintains its own progress and notes.

## Features

- Budget-specific project roadmaps
- Phase, group and subsection navigation
- Interactive task checklists with progress indicators
- Overall, phase-level and subsection-level completion tracking
- Mark-all and reset actions with confirmation prompts
- Filters for completion status, documents and notes
- Search across sections, groups, subsections, tasks, utilities and documents
- Notes for each subsection and utility
- Bundled reference documents for applicable workflow items
- A consolidated document index
- Full workflow, phase and subsection PDF exports
- Workflow and phase Excel exports
- Previous and next subsection navigation, including keyboard arrow support
- Responsive USC FPM-themed interface with animated transitions
- Browser-local persistence using Zustand and `localStorage`

> Progress and notes are stored only in the current browser under the key `usc-workflow-session`. The application does not currently use a backend, authentication or cloud synchronization.

## Technology Stack

| Area | Technology |
| --- | --- |
| UI | React 18, TypeScript |
| Build tool | Vite 5 |
| Routing | React Router |
| Styling | Tailwind CSS, PostCSS |
| State management | Zustand |
| Animation | Framer Motion |
| Icons | Lucide React |

## Getting Started

### Prerequisites

Install Node.js and npm.

### Installation

```bash
git clone https://github.com/Preethika-P/ProjectWorkflowWebsiteFPMUSC.git
cd ProjectWorkflowWebsiteFPMUSC
npm install
```

### Run locally

```bash
npm run dev
```

Open the local URL displayed by Vite in the terminal.

### Create a production build

```bash
npm run build
```

The generated site is written to `dist/`.

### Preview the production build

```bash
npm run preview
```

## Available Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check the project and create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run parse` | Regenerate `public/workflow.json` from `workflow.txt` |

## Project Structure

```text
.
├── public/
│   ├── documents/          # Downloadable workflow reference documents
│   ├── workflow.json       # Workflow data loaded by the application
│   ├── _redirects          # Single-page application route fallback
│   └── ...                 # Logos, animations and other static assets
├── src/
│   ├── components/         # Shared workflow and UI components
│   ├── lib/                # Budget, export, keyboard and display helpers
│   ├── pages/              # Budget, roadmap, phase and checklist pages
│   ├── store/              # Persisted Zustand application state
│   ├── types/              # Workflow TypeScript interfaces
│   ├── App.tsx             # Routes and workflow-data loading
│   └── main.tsx            # React entry point
├── parse-workflow.js       # Text-to-JSON workflow parser
├── workflow.txt            # Editable text representation of the workflow
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

## Application Routes

| Route | Page |
| --- | --- |
| `/` | Budget selection |
| `/budget/:budgetKey/workflow` | Complete project roadmap |
| `/budget/:budgetKey/category/:categoryId` | Project phase details |
| `/budget/:budgetKey/category/:categoryId/subcategory/:subcategoryId` | Task checklist and notes |

Unknown routes return users to the budget-selection page.

## Workflow Data

The application loads its content from `public/workflow.json`. Its main hierarchy is:

```text
Workflow
└── Categories
    ├── Groups
    └── Subcategories
        ├── Tasks
        └── Reference documents
```

Each subcategory can also be marked as a utility. Budget-specific logic is applied at runtime, including the additional design peer-review workflow used for projects of $10 million and above.

### Updating workflow content

1. Edit `workflow.txt` while preserving its existing heading and indentation format.
2. Run:

   ```bash
   npm run parse
   ```

3. Review the regenerated `public/workflow.json`.
4. Restore or add any required `documents` metadata because the parser currently generates categories, groups, subcategories and tasks only.
5. Run `npm run build` to verify the updated project.

Reference files should be placed in `public/documents/` and linked from the appropriate category or subcategory in `public/workflow.json`.

## Export Behavior

PDF exports open a print-ready page where the browser's print dialog can save the output as a PDF. The export includes task status, notes, project details and approval information.

Excel exports download an `.xls` file containing the workflow hierarchy, individual tasks, completion status and notes.

If a PDF export does not open, allow pop-ups for the site and try again.

## Deployment

Run `npm run build` and deploy the generated `dist/` directory to a static hosting service. The included `public/_redirects` file provides a single-page application fallback on hosts that support Netlify-style redirect rules.
