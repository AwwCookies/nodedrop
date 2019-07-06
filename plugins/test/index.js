const path = require('path')

module.exports = function (bot, events, dbs, router) {
  bot.registerCommand('!test', 'message', /^(!test)$/, 'ALL',
    'Test command | !test',
    (event) => {
      bot.say(event.target, 'Hello from test')
    })
  router.get('/', (req, res) => {
    res.send('It works!')
  })
  router.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'web/settings.html'))
  })
}
