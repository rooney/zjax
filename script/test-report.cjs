const fs = require('fs');
const path = require('path');
const MCR = require('monocart-coverage-reports');

const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, 'coverage/output');
const reportDir = path.join(projectRoot, 'coverage/report');
const COVERAGE_THRESHOLD_PCT = 50;

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
    console.error('No V8 coverage files found in coverage/output');
    process.exit(1);
  }

  const mcr = MCR({
    outputDir: reportDir,
    cleanCache: true,
    entryFilter: '**/dist/zjax.coverage.js',
    sourceFilter: '**/src/**',
    reports: ['v8', 'text', 'text-summary', 'lcovonly', 'json-summary'],
    onEnd(coverageResults) {
      if (!coverageResults || !coverageResults.summary) return;
      const summary = coverageResults.summary;
      const linesPct = summary.lines && typeof summary.lines.pct === 'number' ? summary.lines.pct : 0;
      const passed = linesPct >= COVERAGE_THRESHOLD_PCT;
      const summaryPath = path.join(projectRoot, 'coverage', 'coverage-summary.json');
      fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
      fs.writeFileSync(
        summaryPath,
        JSON.stringify(
          {
            lines: linesPct,
            statements: summary.statements?.pct,
            branches: summary.branches?.pct,
            functions: summary.functions?.pct,
            passed,
            threshold: COVERAGE_THRESHOLD_PCT,
          },
          null,
          2
        ),
        'utf-8'
      );
      if (!passed) {
        console.error(
          `Coverage ${linesPct.toFixed(1)}% is below threshold ${COVERAGE_THRESHOLD_PCT}%. Merge is disabled until coverage is at least ${COVERAGE_THRESHOLD_PCT}%.`
        );
        process.exit(1);
      }
      console.log(`Coverage ${linesPct.toFixed(1)}% meets threshold ${COVERAGE_THRESHOLD_PCT}%.`);
    },
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

