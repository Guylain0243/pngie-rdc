const fs = require('fs');
const target = 'C:\\pngie-rdc\\pngie-backend\\public\\index.html';
const text = fs.readFileSync(target, 'utf8');

const regex = /ð[\s\S]{1,6}?["\x27]/g;
let match;
const seen = new Set();
while ((match = regex.exec(text)) !== null) {
  seen.add(JSON.stringify(match[0]));
}
console.log([...seen].join('\n'));
