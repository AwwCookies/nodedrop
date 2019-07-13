require('dotenv').config()

module.exports = {
  irc: {
    nick: 'nodedrop',
    username: 'nodedrop',
    host: 'irc.snoonet.org',
    port: 6667,
    version: 'Nodedrop (https://git.io/fjikz)'
  },
  autoJoin: [{ name: '#Aww' }, { name: '##Aww', key: 'password' }],
  nickServPass: process.env.NODEDROP_NICKSERV,
  ownerNick: 'PrincessAww',
  web: {
    adminPass: 'cookies',
    port: 3000
  },
  plugins: {
    disabled: []
  },
  cmdPrefix: '!',
  secert: 'cookies',
  restartDelay: 20000 // 20 seconds
}
