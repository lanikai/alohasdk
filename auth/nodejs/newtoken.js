const deviceId = process.env.DEVICE_ID;
const jwtIssuer = process.env.JWT_ISSUER;
const jwtSubject = process.env.JWT_SUBJECT || '';
const jwtSecret = process.env.JWT_SECRET;

var jwt = require('jsonwebtoken');

var payload = {
  grants: ['connect:device:' + deviceId],
};
var options = {
  algorithm: 'HS256',
  issuer: jwtIssuer,
  subject: jwtSubject,
  expiresIn: '30m',
};

var token = jwt.sign(payload, jwtSecret, options);

console.log(token);
