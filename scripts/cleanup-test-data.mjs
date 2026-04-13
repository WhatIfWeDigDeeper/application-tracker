#!/usr/bin/env node

/**
 * Deletes applications matching keywords via the API.
 * All e2e tests now create applications with "E2E" in the company name,
 * so that is the default keyword.
 * You can specify additional keywords or override them entirely via command-line arguments.
 *
 * Usage:
 *   node scripts/cleanup-test-data.mjs [--port <port>] [--dry-run] [keyword ...]
 *
 * Examples:
 *   node scripts/cleanup-test-data.mjs                          # default keywords, port 5040
 *   node scripts/cleanup-test-data.mjs --port 3001 "My Test"    # custom keyword against express API
 *   node scripts/cleanup-test-data.mjs --dry-run                # preview what would be deleted
 *
 * Default keywords (case-insensitive, matched against companyName and positionTitle):
 *   "E2E"
 */

const DEFAULT_PORT = 5040;
// Express (3001) serves at /applications; all others use /api/applications
const PORTS_WITHOUT_API_PREFIX = [3001, 5050];

const DEFAULT_KEYWORDS = ['E2E', 'API'];

function parseArgs(argv) {
  const args = argv.slice(2);
  let port = DEFAULT_PORT;
  let dryRun = false;
  const keywords = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) {
      port = Number(args[++i]);
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (!args[i].startsWith('--')) {
      keywords.push(args[i]);
    }
  }

  return { port, dryRun, keywords: keywords.length ? keywords : DEFAULT_KEYWORDS };
}

function matches(app, keywords) {
  const haystack = `${app.companyName} ${app.positionTitle}`.toLowerCase();
  return keywords.some((kw) => haystack.includes(kw.toLowerCase()));
}

function getApiPath(port) {
  return PORTS_WITHOUT_API_PREFIX.includes(port) ? '/applications' : '/api/applications';
}

async function fetchAllApplications(baseUrl, apiPath) {
  const apps = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${baseUrl}${apiPath}?limit=100&page=${page}&includeArchived=true`);
    if (!res.ok) throw new Error(`GET ${apiPath} failed: ${res.status} ${res.statusText}`);
    const data = await res.json();
    apps.push(...data.items);
    if (apps.length >= data.total) break;
    page++;
  }
  return apps;
}

async function main() {
  const { port, dryRun, keywords } = parseArgs(process.argv);
  const baseUrl = `http://localhost:${port}`;
  const apiPath = getApiPath(port);

  console.log(`Connecting to ${baseUrl}`);
  console.log(`Keywords: ${keywords.join(', ')}${dryRun ? ' (dry run)' : ''}\n`);

  const apps = await fetchAllApplications(baseUrl, apiPath);
  const toDelete = apps.filter((app) => matches(app, keywords));

  if (toDelete.length === 0) {
    console.log(`No matching applications found (${apps.length} total).`);
    return;
  }

  console.log(`Found ${toDelete.length} matching application(s) out of ${apps.length} total:\n`);
  for (const app of toDelete) {
    console.log(`  ${app.companyName} — ${app.positionTitle} (${app.id})`);
  }
  console.log();

  if (dryRun) {
    console.log('Dry run — no deletions performed.');
    return;
  }

  let deleted = 0;
  for (const app of toDelete) {
    const res = await fetch(`${baseUrl}${apiPath}/${app.id}`, { method: 'DELETE' });
    if (res.status === 204 || res.ok) {
      deleted++;
    } else {
      console.error(`  Failed to delete ${app.id}: ${res.status} ${res.statusText}`);
    }
  }

  console.log(`Deleted ${deleted}/${toDelete.length} application(s).`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
