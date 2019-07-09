const jwt = require('jsonwebtoken')
const config = require('./config')
const mongojs = require('mongojs')

const db = mongojs(config.mongodb)
const usersDB = db.collection('users')

async function loginRequired (req, res, next) {
  const token = req.cookies.token
  if (typeof token !== 'undefined') {
    jwt.verify(token, config.secert, async (err, authData) => {
      if (err) {
        res.status(401).json({
          statusText: "You're not authed"
        })
      } else {
        usersDB.findOne({ username: authData.username }, (err, doc) => {
          if (err) { console.log(err) } else {
            if (!doc) {
              res.status(401).json({
                statusText: 'Invalid auth data'
              })
            } else {
              req.token = authData
              req.user = doc
              next()
            }
          }
        })
      }
    })
  } else {
    res.status(401).json({
      statusText: 'Not logged in'
    })
  }
}

function ownerRequired (req, res, next) {
  if (req.user.role === 'OWNER') {
    next()
  } else {
    res.send({ statusText: 'Invalid user' })
  }
}

function adminRequired (req, res, next) {
  if (req.user.role === 'OWNER' || req.user.role === 'ADMIN') {
    next()
  } else {
    res.send({ statusText: 'Invalid user' })
  }
}

module.exports = {
  loginRequired,
  ownerRequired,
  adminRequired
}
