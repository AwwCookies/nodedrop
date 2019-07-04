module.exports = function (client, events, dbs, router) {
  events.on('message', (from, to, message) => {
    if (message.match(/^(!test)$/)) {
      client.say(to, 'Hello from test')
    }
  })
  router.get('/', (req, res) => {
    res.send('It works!')
  })
}
