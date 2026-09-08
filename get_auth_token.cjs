const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_ZARNTASTIC_KEY_12345";
const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
console.log(token);
