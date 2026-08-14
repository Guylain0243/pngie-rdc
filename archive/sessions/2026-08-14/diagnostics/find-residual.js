const fs = require('fs');
const target = 'C:\\pngie-rdc\\pngie-backend\\public\\index.html';
const text = fs.readFileSync(target, 'utf8');

const regex = /ð[ŸÂ]|Â·|Â /g;
let match;
const seen = new Set();
while ((match = regex.exec(text)) !== null) {
  const start = Math.max(0, match.index - 20);
  const end = Math.min(text.length, match.index + 20);
  const context = text.slice(start, end).replace(/\n/g, ' ');
  seen.add(context);
}
console.log([...seen].join('\n---\n'));
console.log('Total contextes uniques:', seen.size);
