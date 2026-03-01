import fs from 'node:fs';

const RED = '\x1b[31m';
const RESET = '\x1b[0m';

const data = fs.readFileSync(0, 'utf8');
const lines = data.split('\n');

let filename = '';
for (const line of lines) {
  if (line.startsWith('SF:')) filename = line.slice(3).trim();
  if (line.endsWith(',0')) {
    const lineNumber = line.slice(3).split(',')[0];
    console.log(`Change in ${RED}${filename} (line ${lineNumber})${RESET} is not covered by the tests.`);
    console.log(`${RED}Please add/update tests to cover this change.`);
    process.exit(1);
  }
  if (line.endsWith('empty diff')) {
    console.log('OK no changes in src/ -- no new test needed')
    process.exit(0);
  }
}
console.log('OK patch is covered');
