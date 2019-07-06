const path = require('path')

module.exports = function (client, events, dbs, router) {
  events.on('message', (from, to, message) => {
    if (message.match(/^(!test)$/)) {
      client.say(to, 'Hello from test')
    }
  })
  router.get('/', (req, res) => {
    res.send('It works!')
  })
  router.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'web/settings.html'))
  })
}
