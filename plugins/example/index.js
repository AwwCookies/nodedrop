const path = require('path')
const lodash = require('lodash')

module.exports = function ({ bot, servue, router, registerCommand, loginRequired }) {
  registerCommand('!example', 'message', /^(!example)$/, 'ALL',
    'Example command | !example',
    (event) => {
      bot.say(event.target, 'Hello from example')
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
