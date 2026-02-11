const fs = require('fs');
const path = require('path');
const MCR = require('monocart-coverage-reports');

const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, 'coverage/output');
const reportDir = path.join(projectRoot, 'coverage/report');

function readCoverageFiles() {
  if (!fs.existsSync(outputDir)) {
    return [];
  }

  return fs
    .readdirSync(outputDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(outputDir, f));
}

async function generateReport() {
  const files = readCoverageFiles();
  if (!files.length) {
    console.error(`No V8 coverage files found in ${outputDir}`);
    process.exit(1);
  }

  const mcr = MCR({
    outputDir: reportDir,
    cleanCache: true,
    entryFilter: '**/dist/zjax.coverage.js',
    sourceFilter: '**/src/**',
    reports: ['v8', 'text', 'text-summary'],
  });

  for (const file of files) {
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (Array.isArray(json) && json.length) {
      await mcr.add(json);
    }
  }
  await mcr.generate();
  console.log(`For full breakdown: open coverage/report/index.html`);
}

generateReport().catch((err) => {
  console.error(err);
  process.exit(1);
});

