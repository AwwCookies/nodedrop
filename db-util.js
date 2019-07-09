const mongojs = require('mongojs')
const bcrypt = require('bcryptjs')
const config = require('./config')

// Connect to local mongodb and select 'nodedrop' database
const db = mongojs(config.mongodb)

const usersDB = db.collection('users')
const ignorelistDB = db.collection('ignorelist')

function createUser (username, password, role, flags = [], pluginOptions = {}, cb) {
  usersDB.findOne({ username: username }, (err, doc) => {
    if (err) { console.log(err) } else {
      if (!doc) {
        usersDB.insert({
          username,
          password: bcrypt.hashSync(password, bcrypt.genSaltSync(12)),
          role,
          flags,
          pluginOptions
        })
        if (cb) { cb(err, true) }
      } else {
        if (cb) { cb(err, false) }
      }
    }
  })
}

function updateUser (id, params = {}, cb) {
  function callUpdate () {
    usersDB.update({ _id: mongojs.ObjectId(id) }, {
      $set: params },
    (err, doc) => {
      if (err) { console.log(err) }
      if (cb) {
        if (doc.n > 0) {
          if (doc.nModified > 0) {
            cb(err, { status: 'success' })
          } else {
            cb(err, { status: 'failed', text: 'no changes' })
          }
        } else {
          cb(err, { status: 'failed', text: 'invalid id' })
        }
      }
    })
  }
  if (params.password) {
    params.password = bcrypt.hash(params.password, bcrypt.genSaltSync(10))
  }
  if (params.username) {
    usersDB.findOne({ username: params.username }, (err, doc) => {
      if (err) { console.log(err) }
      if (doc) {
        if (doc._id.toString() === id) {
          callUpdate()
        } else {
          if (cb) { cb(err, { status: 'failed', text: 'username in use' }) }
        }
      } else {
        callUpdate()
      }
    })
  } else {
    callUpdate()
  }
}

// Create new ignore entry
function createIgnore (host, reason, cb) {
  ignorelistDB.insert({
    host,
    reason,
    time: new Date()
  }, (err, doc) => {
    if (err) { console.log(err) }
    if (cb) {
      cb(err, Boolean(doc))
    }
  })
}

module.exports = {
  createUser,
  updateUser,
  createIgnore
}
