const irc = require('irc')
const path = require('path')
const fs = require('fs')
const bodyParser = require('body-parser')
const expect = require('expect')
const express = require('express')
const mongojs = require('mongojs')
const bcrypt = require('bcryptjs')
const EventEmitter = require('events')
const config = require('./config')

const events = new EventEmitter()

let client = new irc.Client(config.irc.server, 'nodedrop', config.irc)

const web = express()
web.use(bodyParser.json())
web.use(bodyParser.urlencoded({ extended: false }))
// web.use(cookieParser())
web.use(express.static('./html/public'))

// Connect to local mongodb and select 'pepe-discord-bot' database
const db = mongojs('nodedrop-mongo/nodedrop')
// Create owner user
const usersDB = db.collection('users')
usersDB.findOne({ username: config.ownerNick }, (err, doc) => {
  if (err) { console.log(err) } else {
    if (!doc) {
      usersDB.insert({
        username: config.ownerNick,
        password: bcrypt.hashSync(config.web.adminPass, bcrypt.genSaltSync(12)),
        role: 'OWNER'
      })
    }
  }
})

/* Plugin stuff */
const plugins = []

function loadPlugin (folder) {
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
    'webPrefix': expect.any(String)
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

  console.log(`Loading ./plugins/${folder} 📂`)
  console.log(
    `\t📕 Name: ${pluginInfo.name}`,
    `\n\t📝 Description: ${pluginInfo.description}`,
    `\n\t👱 Author: ${pluginInfo.author}`,
    `\n\t🤖 Version: ${pluginInfo.version}`
  )
  plugins.push(pluginInfo)
  // actually load the plugin
  try {
    const router = express.Router()
    web.use(`/plugin/${pluginInfo.webPrefix}/`, router)
    const dbs = {}
    pluginInfo.database.dbs.forEach((dbName) => {
      dbs[dbName] = db.collection(`plugin-${pluginInfo.name}-${dbName}`)
    })
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
client.addListener('message', (from, to, message) => {
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
})

client.addListener('pm', (from, message) => {
  events.emit('pm', from, message)
  // COMMAND: Register !reg <username> <password>
  if (message.match(/(!reg)\s([^\s]*)\s(.+)/)) {
    const [,, username, password] = message.match(/(!reg)\s([^\s]*)\s(.+)/)
    usersDB.findOne({ username: username }, (err, doc) => {
      if (err) { console.log(err) } else {
        if (doc) { // username taken
          client.say(from, 'Please choose another username')
        } else {
          usersDB.insert({
            username: username,
            password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
            role: 'USER'
          })
          client.say(from, 'Thank you for registering!')
        }
      }
    })
  }
  // COMMAND:
})

client.addListener('error', function (message) {
  events.emit('error', message)
  console.log('error: ', message)
})
/* End Map client events to `events` */

/* Start Express Server */
web.listen(config.web.port, () => console.log(`Express server started on port ${config.web.port}`))
