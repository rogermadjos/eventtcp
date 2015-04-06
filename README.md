# eventtcp

[![Build Status](https://travis-ci.org/rogermadjos/eventtcp.svg?branch=master)](https://travis-ci.org/rogermadjos/eventtcp)
[![npm version](https://badge.fury.io/js/eventtcp.svg)](http://badge.fury.io/js/eventtcp)

## How to install

```
npm install eventtcp --save
```

`eventtcp` allows you to send events over the TCP socket.

## How to use
```js
var EventTCP = require('eventtcp').EventTCP;

//client side
var emitter = new EventTCP({
	port: 8080,
	host: 'localhost'
});

//server side
var server = net.createServer(function(socket) {
	var emitter = new EventTCP(socket);
});

```

## License

MIT
