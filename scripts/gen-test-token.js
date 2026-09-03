const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { sub: '2d9b9b94-60fb-4c46-a972-3692598061c7', roles: ['MI'] },
  process.env.JWT_SECRET || 'zwcF4UHOIanMvPGgZkRA3q9lTmQ1pKtN286Dd50r7sBeWVxf',
  { expiresIn: '1h' }
);
console.log(token);