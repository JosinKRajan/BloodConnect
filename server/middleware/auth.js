const jwt = require('jsonwebtoken')

module.exports = function auth(req, res, next) {
  const authHeader = req.header('Authorization')
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization token, access denied' })
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : authHeader

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret')
    req.user = decoded
    next()
  } catch (err) {
    res.status(401).json({ message: 'Token is invalid or expired' })
  }
}
