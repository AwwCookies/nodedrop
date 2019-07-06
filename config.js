module.exports = {
  irc: {
    server: 'irc.snoonet.orgx',
    userName: 'nodedrop',
    realName: 'nodedrop',
    port: 6667,
    localAddress: null,
    debug: true,
    showErrors: true,
    autoRejoin: false,
    autoConnect: true,
    channels: ['#Aww'],
    secure: false,
    selfSigned: false,
    certExpired: false,
    floodProtection: true,
    floodProtectionDelay: 1000,
    sasl: false,
    retryCount: 0,
    retryDelay: 2000,
    stripColors: true,
    channelPrefixes: '#',
    messageSplit: 512,
    encoding: ''
  },
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
