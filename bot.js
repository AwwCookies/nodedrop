const irc = require('irc')
const path = require('path')
const fs = require('fs')
const bodyParser = require('body-parser')
const expect = require('expect')
const express = require('express')
const mongojs = require('mongojs')
const bcrypt = require('bcryptjs')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const EventEmitter = require('events')
const config = require('./config')

const events = new EventEmitter()

let client = new irc.Client(config.irc.server, 'nodedrop', config.irc)
client.ignoreThisMessage = false

const web = express()
web.use(bodyParser.json())
web.use(bodyParser.urlencoded({ extended: false }))
web.use(cookieParser())
web.use('/public', express.static('./web/public'))

// Connect to local mongodb and select 'nodedrop' database
const db = mongojs('nodedrop-mongo/nodedrop')
// Create owner user
const usersDB = db.collection('users')
const ignorelistDB = db.collection('ignorelist')

/* Database functions */
// Create new user
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
/* End Database Functions */

createIgnore('user/PrincessAww', 'spammer', (err, created) => {
  if (err) { console.log(err) }
  console.log('IGNORE: ', created)
})

// Create owner user
createUser(config.ownerNick, config.web.adminPass, 'OWNER')

/* Plugin stuff */
const plugins = []

function loadPlugin (folder) {
  console.log(`Loading ./plugins/${folder} 📂`)
  // Verfiy the folder contains "settings.json" && "index.js"
  let files = fs.readdirSync(path.join(__dirname, `plugins/${folder}`))
  if (!files.includes('index.js', 'settings.json')) {
    console.log(`Plugin: '${folder}' does not have index.js or info.js`)
    return
  }
  // Load 'settings.json' from the plugins folder
  const pluginInfo = JSON.parse(fs.readFileSync('./plugins/' + folder + '/settings.json'))
  expect(pluginInfo).toEqual({
    'name': expect.any(String),
    'description': expect.any(String),
    'author': expect.any(String),
    'version': expect.any(String),
    'database': { dbs: expect.any(Array) },
    'webPrefix': expect.any(String),
    'webSettings': expect.any(Boolean)
  })
  // Check if plugin already loaded
  if (plugins.find((plugin) => {
    // TODO: Change to hashes??
    let comp1 = plugin.name + plugin.author + plugin.version
    let comp2 = pluginInfo.name + pluginInfo.author + pluginInfo.version
    return comp1 === comp2
  })) {
    console.log('Mod already loaded 😡')
    return
  }

  console.log(
    `\t📕 Name: ${pluginInfo.name}`,
    `\n\t📝 Description: ${pluginInfo.description}`,
    `\n\t👱 Author: ${pluginInfo.author}`,
    `\n\t🤖 Version: ${pluginInfo.version}`
  )
  plugins.push(pluginInfo)
  // build plugin params
  try {
    const router = express.Router()
    // scope web routes to /plugin/<webprefix>/
    web.use(`/plugin/${pluginInfo.webPrefix}/`, router)
    // setup plugin web public folder
    web.use(`/plugin/${folder}/public`, express.static(`./plugins/${folder}/web/public`))
    // setup databases if any request
    const dbs = {}
    pluginInfo.database.dbs.forEach((dbName) => {
      dbs[dbName] = db.collection(`plugin-${pluginInfo.name}-${dbName}`)
    })
    // actual load the plugin
    require('./plugins/' + folder)(client, events, dbs, router)
    console.log(`${folder} loaded! ✅`)
  } catch (e) {
    console.log(`Error loading '${folder}: ${e}' ❌`)
  }
}

// Load plugins from plugins folder
fs.readdir(path.join(__dirname, 'plugins'), function (err, items) {
  if (err) {
    return console.log('Unable to scan directory: ' + err)
  }
  let folders = items.filter((item) => {
    return fs.statSync(path.join(__dirname, `plugins/${item}`)).isDirectory()
  })
  folders.forEach(function (folder) {
    // if disabled don't load
    if (config.plugins.disabled.includes(folder)) { return }
    loadPlugin(folder)
  })
})
/* End plugin stuff */

/* Map client events to `events` */
function getUser (nick, cb) {
  client.whois(nick, (whois) => {
    if (whois.account) {
      usersDB.findOne({ username: whois.account }, (err, doc) => {
        if (err) { console.log(err) }
        if (doc) {
          cb(doc)
        }
      })
    }
  })
}

client.addListener('raw', (message) => {
  client.ignoreThisMessage = false
  ignorelistDB.findOne({ host: message.host }, (err, doc) => {
    if (err) { console.log(err) }
    if (doc) {
      client.ignoreThisMessage = true
    }
  })
})

client.addListener('message', (from, to, message) => {
  console.log('ignoring?', client.ignoreThisMessage)
  if (client.ignoreThisMessage) { return true }
  events.emit('message', from, to, message)
  // COMMAND: !status
  if (message.match(/^(!status)$/)) {
    let status = {
      irc: 'Online ✅',
      web: 'Online ✅',
      mongodb: 'Online ✅'
    }
    client.say(to, `IRC: ${status.irc} | Web Server: ${status.web} | MongoDB: ${status.mongodb}`)
  }
  // COMMAND: !restart
  if (message.match(/^(!restart)$/)) {
    getUser(from, (user) => {
      if (user.role === 'OWNER') {
        client.say(to, 'Restarting...')
        setTimeout(() => {
          events.emit('restart')
          process.exit()
        }, config.restartDelay)
      }
    })
  }
})

client.addListener('pm', (from, message) => {
  console.log('ignoring?', client.ignoreThisMessage)
  if (client.ignoreThisMessage) { return true }
  events.emit('pm', from, message)
  // COMMAND: Register !reg <password>
  if (message.match(/(!reg)\s(.+)/)) {
    const [,, password] = message.match(/(!reg)\s(.+)/)
    client.say(from, 'Waiting for whois data')
    client.whois(from, (whois) => {
      if (whois.account) {
        const username = whois.account
        createUser(username, password, 'USER', [], [], (err, created) => {
          if (err) { console.log(err) }
          if (created) {
            client.say(from, `Thank you for registering! Username: ${username}`)
          } else {
            client.say(from, 'You already have an account!')
          }
        })
      } else {
        client.say(from, "You're not logged into an IRC account")
      }
    })
  }

  // Owner commands
  // COMMAND: !deluser <username>
  // remove user from database
  if (message.match(/^(!deluser)\s(.+)$/)) {
    getUser(from, (user) => {
      if (user.role === 'OWNER') {
        const [,, username] = message.match(/^(!deluser)\s(.+)$/)
        usersDB.remove({ username: username }, (err, doc) => {
          if (err) { console.log(err) }
          if (doc.deletedCount > 0) {
            client.say(from, `${username} was deleted.`)
          } else {
            client.say(from, `Couldn't delete ${username}`)
          }
        })
      }
    })
  }
  // COMMAND: !listusers
  // list all users
  if (message.match(/^(!listusers)$/)) {
    getUser(from, (doc) => {
      if (doc.role === 'OWNER' || doc.role === 'ADMIN') {
        usersDB.find({}, (err, docs) => {
          if (err) { console.log(err) }
          client.say(from, 'User list')
          // [test|user, test2|user]
          client.say(from, docs.map(doc => [doc.username, doc.role].join('|')).join(', '))
          client.say(from, 'End user list')
        })
      }
    })
  }
  // COMMAND: !admin <username>
  // sets <username> role to ADMIN
  if (message.match(/^(!admin)\s(.+)$/)) {
    const [,, username] = message.match(/^(!admin)\s(.+)$/)
    getUser(from, (user) => {
      console.log(user)
      if (user.role === 'OWNER') {
        usersDB.update({ username }, { $set: { role: 'ADMIN' } }, (err, doc) => {
          if (err) { console.log(err) }
          if (doc.n > 0) {
            if (doc.nModified > 0) {
              client.say(from, `${username} is now an admin`)
            } else {
              client.say(from, `${username} is already an admin`)
            }
          } else {
            client.say(from, `${username} is invalid`)
          }
        })
      }
    })
  }
  // COMMAND: !rmadmin <username>
  // set <username> role to USER
  if (message.match(/^(!rmadmin)\s(.+)$/)) {
    getUser(from, (user) => {
      if (user.role === 'OWNER') {
        const [,, username] = message.match(/^(!rmadmin)\s(.+)$/)
        usersDB.update({ username }, { $set: { role: 'USER' } }, (err, doc) => {
          if (err) { console.log(err) }
          if (doc.n > 0) {
            if (doc.nModified > 0) {
              client.say(from, `${username} is no longer an admin`)
            } else {
              client.say(from, `${username} is not an admin`)
            }
          } else {
            client.say(from, `${username} is invalid`)
          }
        })
      }
    })
  }
})

client.addListener('error', function (message) {
  events.emit('error', message)
  console.log('error: ', message)
})
/* End Map client events to `events` */

/* Web Stuff */
// json web token middleware
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

web.get('/', loginRequired, (req, res) => {
  res.sendFile(path.join(__dirname, 'web/index.html'))
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

/* API v1 Server */
const api = express.Router()
web.use('/api/v1/', api)

api.get('/admin/info/plugins', [loginRequired, ownerRequired], (req, res) => {
  res.send({ plugins: plugins })
})

api.get('/admin/users', [loginRequired, ownerRequired], (req, res) => {
  usersDB.find({}, (err, docs) => {
    if (err) { console.log(err) }
    res.send({ users: docs })
  })
})

api.get('/admin/user/:username', [loginRequired, ownerRequired], (req, res) => {
  usersDB.findOne({ username: req.params.username }, (err, doc) => {
    if (err) { console.log(err) }
    res.send({ user: doc })
  })
})

api.delete('/admin/user/:username', [loginRequired, ownerRequired], (req, res) => {
  usersDB.remove({ username: req.params.username }, (err, doc) => {
    if (err) { console.log(err) }
    if (doc.deletedCount > 0) {
      res.send({ statusText: 'success' })
    } else {
      res.send({ statusText: 'not deleted' })
    }
  })
})

/* End API v1 Server */

/* Start Express Server */
web.listen(config.web.port, () => console.log(`Express server started on port ${config.web.port}`))
