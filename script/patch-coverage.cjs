/**
 * Patch coverage check: fail if any line changed in src/ (vs base ref) is not covered.
 * Run in CI on PRs after tests; requires coverage/report/lcov.info and git.
 *
 * Usage: node script/patch-coverage.cjs [baseRef]
 *   baseRef defaults to origin/main or GITHUB_BASE_REF.
 *   Set SKIP_PATCH_COVERAGE=1 to skip (e.g. on non-PR runs).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = process.cwd();
const lcovPath = path.join(projectRoot, 'coverage', 'report', 'lcov.info');
const srcPrefix = 'src/';

function getBaseRef() {
  if (process.env.GITHUB_BASE_REF) {
    return `origin/${process.env.GITHUB_BASE_REF}`;
  }
  return process.argv[2] || 'origin/main';
}

function parseLcov(lcovContent) {
  const files = new Map();
  let currentFile = null;
  for (const line of lcovContent.split('\n')) {
    if (line.startsWith('SF:')) {
      const raw = line.slice(3).trim();
      const abs = path.isAbsolute(raw) ? raw : path.resolve(projectRoot, raw);
      currentFile = path.relative(projectRoot, abs).replace(/\\/g, '/');
      if (!files.has(currentFile)) {
        files.set(currentFile, new Set());
      }
      continue;
    }
    if (currentFile && line.startsWith('DA:')) {
      const parts = line.slice(3).split(',');
      const num = parseInt(parts[0], 10);
      const count = parseInt(parts[1], 10);
      if (!isNaN(num) && count > 0) {
        files.get(currentFile).add(num);
      }
    }
  }
  return files;
}

function getChangedLines(baseRef) {
  const out = execSync(`git diff ${baseRef}...HEAD -- "src/"`, {
    cwd: projectRoot,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  });
  const addedLinesByFile = new Map();
  let currentPath = null;
  let newLineCur = 0;
  for (const line of out.split('\n')) {
    if (line.startsWith('+++ b/')) {
      currentPath = line.slice(6).trim();
      if (!currentPath.startsWith(srcPrefix)) currentPath = null;
      continue;
    }
    if (line.startsWith('@@')) {
      const m = line.match(/@@ -\d+,?\d* \+(\d+),?(\d*)/);
      if (m && currentPath) {
        newLineCur = parseInt(m[1], 10);
      }
      continue;
    }
    if (line.startsWith('+') && !line.startsWith('+++') && currentPath) {
      if (!addedLinesByFile.has(currentPath)) {
        addedLinesByFile.set(currentPath, new Set());
      }
      addedLinesByFile.get(currentPath).add(newLineCur);
      newLineCur += 1;
    } else if (!line.startsWith('-') && currentPath) {
      newLineCur += 1;
    }
  }
  return addedLinesByFile;
}

function findCoveredSet(coveredByFile, filePath) {
  const candidates = [
    filePath,
    path.relative(projectRoot, path.join(projectRoot, filePath)).replace(/\\/g, '/'),
    path.join(projectRoot, filePath),
  ];
  for (const c of candidates) {
    if (coveredByFile.has(c)) return coveredByFile.get(c);
  }
  for (const [k, v] of coveredByFile) {
    if (path.normalize(k) === path.normalize(filePath)) return v;
  }
  return new Set();
}

function main() {
  if (process.env.SKIP_PATCH_COVERAGE === '1') {
    console.log('Patch coverage check skipped (SKIP_PATCH_COVERAGE=1).');
    return;
  }
  if (!fs.existsSync(lcovPath)) {
    console.error('lcov.info not found at', lcovPath);
    process.exit(1);
  }
  const baseRef = getBaseRef();
  let changedLines;
  try {
    changedLines = getChangedLines(baseRef);
  } catch (e) {
    console.error('Failed to get diff:', e.message);
    process.exit(1);
  }
  if (changedLines.size === 0) {
    console.log('No changed files in src/ — patch coverage check passed.');
    return;
  }
  const lcovContent = fs.readFileSync(lcovPath, 'utf-8');
  const coveredByFile = parseLcov(lcovContent);
  const uncovered = [];
  for (const [file, addedLines] of changedLines) {
    const covSet = findCoveredSet(coveredByFile, file);
    for (const lineNum of addedLines) {
      if (!covSet.has(lineNum)) {
        uncovered.push({ file, line: lineNum });
      }
    }
  }
  if (uncovered.length > 0) {
    console.error('Patch coverage failed: the following changed lines are not covered:');
    uncovered.forEach(({ file, line }) => console.error(`  ${file}:${line}`));
    console.error('Add tests covering these lines or run with SKIP_PATCH_COVERAGE=1 to skip.');
    process.exit(1);
  }
  console.log('Patch coverage check passed: all changed lines are covered.');
}

main();
