module.exports = {
  irc: {
    server: 'chat.freenode.net',
    userName: 'nodedrop',
    realName: 'nodedrop',
    port: 6667,
    localAddress: null,
    debug: true,
    showErrors: true,
    autoRejoin: false,
    autoConnect: true,
    channels: ['##Aww'],
    secure: false,
    selfSigned: false,
    certExpired: false,
    floodProtection: false,
    floodProtectionDelay: 1000,
    sasl: false,
    retryCount: 0,
    retryDelay: 2000,
    stripColors: false,
    channelPrefixes: '#',
    messageSplit: 512,
    encoding: ''
  },
  ownerNick: 'Aww',
  web: {
    adminPass: 'cookies',
    port: 3000
  },
  plugins: {
    disabled: []
  },
  cmdPrefix: '!'
}
