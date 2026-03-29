import fs from 'fs';
import path from 'path';

const TRAINING_DIR = path.join(process.cwd(), 'training');

// Map client slugs to training directory names
const CLIENT_DIR_MAP: Record<string, string> = {
  govplus: 'govplus',
  bactrack: 'bactrack',
  smarttools: 'smarttools',
  'hotel-collection': 'hotel-collection',
  aroma360: 'aroma360',
};

// Priority files to load per client (in order of importance for angle generation)
// These contain the richest data for generating quality angles
const CLIENT_PRIORITY_FILES: Record<string, string[]> = {
  bactrack: [
    'messaging-blueprint.md',
    'segment-plan.md',
    'review-scrape-research.md',
    'reddit-scrape-research.md',
    'customer-research-exercise.md',
    'angle-bank.md',
    'creative-guardrails.md',
    'bactrack-comprehensive-briefing.md',
    'deep-research.md',
    'brand-guidelines.md',
    'bactrack-view-briefing-info.md',
  ],
  smarttools: [
    'messaging-blueprint.md',
    'segment-plan.md',
    'review-scrape-research.md',
    'reddit-scrape-research.md',
    'customer-research-exercise.md',
    'angle-bank.md',
    'deep-research.md',
    'brand-guidelines.md',
  ],
  govplus: [
    'messaging-blueprint.md',
    'segment-plan.md',
    'review-scrape-research.md',
    'reddit-scrape-research.md',
    'customer-research-exercise.md',
    'angle-bank.md',
    'deep-research.md',
    'products.md',
    'hooks-guide.md',
    'compliance.md',
  ],
  'hotel-collection': [
    'messaging-blueprint.md',
    'brand-guidelines.md',
    'products.md',
    'segments.md',
    'review-scrape-research.md',
    'reddit-scrape-research.md',
    'customer-research-exercise.md',
    'angle-bank.md',
    'winning-ads.md',
    'compliance.md',
    'refillable-relaunch-2026.md',
    'dr-encyclopedia.md',
  ],
  aroma360: [
    'messaging-blueprint.md',
    'segment-plan.md',
    'review-scrape-research.md',
    'reddit-scrape-research.md',
    'customer-research-exercise.md',
    'angle-bank.md',
    'brand-training-context.md',
    'refillable-diffuser-relaunch-2026.md',
  ],
};

const SHARED_PLAYBOOK_FILES = [
  'performance-creative-copy-training.md',
  'box-scaling.md',
  'hooks-guide.md',
  'interesting-ads-playbook.md',
];

// Max chars per file to keep within context window limits
const MAX_CHARS_PER_FILE = 15000;
// Max total training context chars (~100k tokens budget for training data)
const MAX_TOTAL_CHARS = 120000;

function readTrainingFile(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (content.length > MAX_CHARS_PER_FILE) {
      return content.slice(0, MAX_CHARS_PER_FILE) + '\n\n[... truncated for context window ...]';
    }
    return content;
  } catch {
    return null;
  }
}

export function loadClientTraining(clientSlug: string): string {
  const dirName = CLIENT_DIR_MAP[clientSlug];
  if (!dirName) return '';

  const clientDir = path.join(TRAINING_DIR, dirName);
  const priorityFiles = CLIENT_PRIORITY_FILES[clientSlug] || [];

  const sections: string[] = [];
  let totalChars = 0;

  for (const fileName of priorityFiles) {
    if (totalChars >= MAX_TOTAL_CHARS) break;

    const filePath = path.join(clientDir, fileName);
    const content = readTrainingFile(filePath);
    if (content) {
      const section = `\n\n## === ${fileName.replace(/\.(md|txt|csv)$/, '').replace(/-/g, ' ').toUpperCase()} ===\n\n${content}`;
      totalChars += section.length;
      sections.push(section);
    }
  }

  return sections.join('');
}

export function loadSharedPlaybooks(): string {
  const playbookDir = path.join(TRAINING_DIR, 'shared-playbooks');
  const sections: string[] = [];

  for (const fileName of SHARED_PLAYBOOK_FILES) {
    const filePath = path.join(playbookDir, fileName);
    const content = readTrainingFile(filePath);
    if (content) {
      sections.push(`\n\n## === PLAYBOOK: ${fileName.replace(/\.md$/, '').replace(/-/g, ' ').toUpperCase()} ===\n\n${content}`);
    }
  }

  return sections.join('');
}

export function loadAllTrainingForClient(clientSlug: string): string {
  const shared = loadSharedPlaybooks();
  const client = loadClientTraining(clientSlug);

  return `# TRAINING DATA — SHARED PLAYBOOKS\n${shared}\n\n# TRAINING DATA — CLIENT-SPECIFIC (${clientSlug.toUpperCase()})\n${client}`;
}

// For the brief prompt: load a lighter version of context
export function loadBriefContext(clientSlug: string): string {
  const dirName = CLIENT_DIR_MAP[clientSlug];
  if (!dirName) return '';

  const clientDir = path.join(TRAINING_DIR, dirName);

  // For briefs, we mainly need: messaging blueprint, brand guidelines, segment plan
  const briefFiles = ['messaging-blueprint.md', 'brand-guidelines.md', 'segment-plan.md', 'creative-guardrails.md', 'compliance.md'];
  const sections: string[] = [];

  for (const fileName of briefFiles) {
    const filePath = path.join(clientDir, fileName);
    const content = readTrainingFile(filePath);
    if (content) {
      sections.push(`### ${fileName.replace(/\.(md|txt)$/, '').replace(/-/g, ' ')}\n${content}`);
    }
  }

  return sections.join('\n\n');
}
