const path = require('path')

module.exports = function (bot, events, dbs, router) {
  events.on('message', (event) => {
    if (event.message.match(/^(!test)$/)) {
      bot.say(event.target, 'Hello from test')
    }
  })
  router.get('/', (req, res) => {
    res.send('It works!')
  })
  router.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'web/settings.html'))
  })
}
