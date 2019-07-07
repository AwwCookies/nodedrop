const path = require('path')

module.exports = function (bot, events, dbs, router, { registerCommand, loginRequired }) {
  registerCommand('!test', 'message', /^(!test)$/, 'ALL',
    'Test command | !test',
    (event) => {
      bot.say(event.target, 'Hello from test')
    })
  router.get('/', [loginRequired], (req, res) => {
    res.send('It works!')
  })
  router.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'web/settings.html'))
  })
}
