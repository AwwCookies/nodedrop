const path = require('path')
const bodyParser = require('body-parser')
const express = require('express')
const mongojs = require('mongojs')
const bcrypt = require('bcryptjs')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const Servue = require('servue')
const config = require('./config')
const db = mongojs(config.mongodb)
const { loginRequired, ownerRequired } = require('./middleware.js')
const usersDB = db.collection('users')

const web = express()
web.use(bodyParser.json())
web.use(bodyParser.urlencoded({ extended: false }))
web.use(cookieParser())
web.use('/public', express.static('./web/public'))
const servue = new Servue()

servue.resources = path.resolve(__dirname, 'web/views')

servue.precompile(path.resolve(__dirname, 'web/views')).then(() => {
  console.log('--> web/views vue pages precompiled <--')
})

web.get('/', loginRequired, async (req, res) => {
  res.send(await servue.render('index'))
  // res.sendFile(path.join(__dirname, 'web/index.html'))
})

web.get('/admin/users', [loginRequired, ownerRequired], (req, res) => {
  res.sendFile(path.join(__dirname, 'web/admin/users.html'))
})

web.get('/auth', (req, res) => {
  res.sendFile(path.join(__dirname, 'web/login.html'))
})

web.post('/auth', (req, res) => {
  usersDB.findOne({ username: req.body.username }, (err, doc) => {
    if (err) { console.log(err) } else {
      if (!doc) {
        res.status(401).send('Invalid Login')
      } else {
        console.log(doc)
        if (bcrypt.compareSync(req.body.password, doc.password)) {
          res.cookie('token', jwt.sign({ username: req.body.username }, config.secert))
          res.status(200).send('done!')
        } else {
          console.log('wrong password?')
        }
      }
    }
  })
})

module.exports = {
  web
}
