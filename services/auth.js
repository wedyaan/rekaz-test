require("dotenv").config( );

const jwt = require("jsonwebtoken");
const secretKey = process.env.ACCESS_TOKEN_SECRET;
 
function generateToken(payload) {
  const accessToken = jwt.sign(payload, secretKey);
  return accessToken;
}
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
console.log(authHeader)
  if (token == null) return res.sendStatus(401);  

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.sendStatus(403);  
    req.user = user;
    next();
  });
}

module.exports = { generateToken, authenticateToken };