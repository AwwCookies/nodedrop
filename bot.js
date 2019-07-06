const IRC = require('irc-framework')
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

const bot = new IRC.Client()

bot.connect(config.irc)
bot.on('registered', () => bot.join('#Aww'))
bot.cmdHelp = {}

bot.registerCommand = function (name, type, match, access, help, func) {
  const types = ['message', 'pm']
  // check if invaild type
  if (!types.includes(type)) { console.error('ERROR: Invalid type passed to bot.registerCommand') }
  expect(func).toEqual(expect.any(Function))
  bot.cmdHelp[name] = help
  events.on(type, (event) => {
    if (event.message.match(match)) {
      if (access === 'ALL') {
        func(event)
      } else if (access === 'ADMIN') {
        getUser(event.nick, (user) => {
          if (user.role === 'ADMIN' || user.role === 'OWNER') {
            func(event)
          }
        })
      } else if (access === 'OWNER') {
        getUser(event.nick, (user) => {
          if (user.role === 'OWNER') {
            func(event)
          }
        })
      } // end owner else if
    } // end if match
  }) // end events.on
}

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

createIgnore('snoonet.org/user/Awwx', 'spammer', (err, created) => {
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
    require('./plugins/' + folder)(bot, events, dbs, router)
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
  bot.whois(nick, (whois) => {
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

function checkIgnoreList (host) {
  return new Promise((resolve, reject) => {
    ignorelistDB.findOne({ host: host }, (err, doc) => {
      if (err) { reject(err) }
      resolve(Boolean(doc))
    })
  })
}

// COMMAND: !status
bot.registerCommand('!status', 'message', /^(!status)$/, 'ALL', '', (event) => {
  let status = {
    irc: 'Online ✅',
    web: 'Online ✅',
    mongodb: 'Online ✅'
  }
  bot.say(event.target, `IRC: ${status.irc} | Web Server: ${status.web} | MongoDB: ${status.mongodb}`)
})
// COMMAND: !restart
bot.registerCommand('!restart', 'message', /^(!restart)$/, 'OWNER', '', (event) => {
  bot.say(event.target, 'Restarting...')
  setTimeout(() => {
    events.emit('restart')
    process.exit()
  }, config.restartDelay)
})
// COMMAND: !ignore <host> <reason>
bot.registerCommand('!ignore', 'message', /^(!ignore)\s([^\s]*)\s(.+)$/, 'OWNER', '', (event) => {
  const [,, host, reason] = event.message.match(/^(!ignore)\s([^\s]*)\s(.+)$/)
  createIgnore(host, reason, (err, created) => {
    if (err) { console.log(err) }
    if (created) {
      bot.say(event.target, `${host} added to ignore list.`)
    } else {
      bot.say(event.target, 'monkaHmm')
    }
  })
})
// COMMAND: !help <command>
bot.registerCommand('!help', 'message', /^(!help)\s(.+)$/, 'OWNER', '!help <command>', (event) => {
  const [,, cmd] = event.message.match(/^(!help)\s(.+)$/)
  if (bot.cmdHelp[cmd]) {
    bot.say(event.target, `${cmd}: something`)
  } else {
    bot.say(event.target, `No help for ${cmd}`)
  }
})
// COMMAND: !rmignore <host>
bot.registerCommand('!rmignore', 'message', /^(!rmignore)\s(.+)$/, 'OWNER', '', (event) => {
  const [,, host] = event.message.match(/^(!rmignore)\s(.+)$/)
  ignorelistDB.remove({ host: host }, (err, doc) => {
    if (err) { console.log(err) }
    if (doc.deletedCount > 0) {
      bot.say(event.target, `${host} was deleted.`)
    } else {
      bot.say(event.target, `Couldn't delete ${host}`)
    }
  })
})
// COMMAND: !reg <password>
bot.registerCommand('!reg', 'pm', /^(!reg)\s(.+)$/, 'ALL', '', (event) => {
  const [,, password] = event.message.match(/^(!reg)\s(.+)$/)
  bot.say(event.nick, 'Waiting for whois data')
  bot.whois(event.nick, (whois) => {
    if (whois.account) {
      const username = whois.account
      createUser(username, password, 'USER', [], [], (err, created) => {
        if (err) { console.log(err) }
        if (created) {
          bot.say(event.nick, `Thank you for registering! Username: ${username}`)
        } else {
          bot.say(event.nick, 'You already have an account!')
        }
      })
    } else {
      bot.say(event.nick, "You're not logged into an IRC account")
    }
  })
})
// COMMAND: !deluser <account>
bot.registerCommand('!deluser', 'pm', /^(!deluser)\s(.+)$/, 'OWNER', '', (event) => {
  const [,, username] = event.message.match(/^(!deluser)\s(.+)$/)
  usersDB.remove({ username: username }, (err, doc) => {
    if (err) { console.log(err) }
    if (doc.deletedCount > 0) {
      bot.say(event.nick, `${username} was deleted.`)
    } else {
      bot.say(event.nick, `Couldn't delete ${username}`)
    }
  })
})
// COMMAND: !listusers
bot.registerCommand('!listusers', 'pm', /^(!listusers)$/, 'OWNER', '', (event) => {
  usersDB.find({}, (err, docs) => {
    if (err) { console.log(err) }
    bot.say(event.nick, 'User list')
    // [test|user, test2|user]
    bot.say(event.nick, docs.map(doc => [doc.username, doc.role].join('|')).join(', '))
    bot.say(event.nick, 'End user list')
  })
})
// COMMAND: !admin <account>
bot.registerCommand('!admin', 'pm', /^(!admin)\s(.+)$/, 'OWNER', '', (event) => {
  const [,, username] = event.message.match(/^(!admin)\s(.+)$/)
  usersDB.update({ username }, { $set: { role: 'ADMIN' } }, (err, doc) => {
    if (err) { console.log(err) }
    if (doc.n > 0) {
      if (doc.nModified > 0) {
        bot.say(event.nick, `${username} is now an admin`)
      } else {
        bot.say(event.nick, `${username} is already an admin`)
      }
    } else {
      bot.say(event.nick, `${username} is invalid`)
    }
  })
})
// COMMAND: !rmadmin <account>
bot.registerCommand('!rmadmin', 'pm', /^(!rmadmin)\s(.+)$/, 'OWNER', '', (event) => {
  const [,, username] = event.message.match(/^(!rmadmin)\s(.+)$/)
  usersDB.update({ username }, { $set: { role: 'USER' } }, (err, doc) => {
    if (err) { console.log(err) }
    if (doc.n > 0) {
      if (doc.nModified > 0) {
        bot.say(event.nick, `${username} is no longer an admin`)
      } else {
        bot.say(event.nick, `${username} is not an admin`)
      }
    } else {
      bot.say(event.nick, `${username} is invalid`)
    }
  })
})

bot.on('privmsg', (event) => {
  checkIgnoreList(event.hostname).then((ignored) => {
    if (ignored) {
      events.emit('ignoredMessage', event)
    } else {
      events.emit('message', event)
      /* message sent to bot */
      if (event.target === config.irc.nick) {
        events.emit('pm', event)
      }
    }
  })
})

// client.addListener('error', function (message) {
//   events.emit('error', message)
//   console.log('error: ', message)
// })
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

api.get('/admin/ignorelist', [loginRequired, ownerRequired], (req, res) => {
  ignorelistDB.find({}, (err, docs) => {
    if (err) { console.log(err) }
    res.send({ 'ignorelist': docs })
  })
})

api.delete('/admin/ignorelist/:id', [loginRequired, ownerRequired], (req, res) => {
  ignorelistDB.remove({ _id: mongojs.ObjectId(req.params.id) }, (err, doc) => {
    if (err) { console.log(err) }
    console.log(doc)
    res.send({ statusText: 'ok' })
  })
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
