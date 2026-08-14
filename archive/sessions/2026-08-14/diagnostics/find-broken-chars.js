const fs = require('fs');
const path = 'C:\\pngie-rdc\\pngie-backend\\public\\index.html';
const text = fs.readFileSync(path, 'utf8');

const regex = /�/g;
let match;
let count = 0;
const seen = new Set();
while ((match = regex.exec(text)) !== null) {
  count++;
  const start = Math.max(0, match.index - 25);
  const end = Math.min(text.length, match.index + 25);
  const context = text.slice(start, end).replace(/\n/g, ' ');
  if (!seen.has(context)) {
    seen.add(context);
    console.log(context);
    console.log('---');
  }
}
console.log('Total occurrences:', count, '| Contextes uniques:', seen.size);
