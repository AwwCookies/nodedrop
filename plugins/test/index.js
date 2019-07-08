const path = require('path')

module.exports = function ({ bot, servue, router, registerCommand, loginRequired }) {
  registerCommand('!test', 'message', /^(!test)$/, 'ALL',
    'Test command | !test',
    (event) => {
      bot.say(event.target, 'Hello from test')
    })
  router.get('/', [loginRequired], (req, res) => {
    res.send('It works!')
  })
  router.get('/vue', async (req, res) => {
    res.send(await servue.render('index'))
  })
  router.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'web/settings.html'))
  })
}
