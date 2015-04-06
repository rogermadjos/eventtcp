/*jshint node: true */
/*global describe, it, before, beforeEach, after, afterEach */
'use strict';

var net = require('net');
var expect = require('chai').expect;

var EventTCP = require('../index').EventTCP;

describe('Event TCP', function() {
  it('should send event over tcp', function(done) {
    var server = net.createServer(function(conn) {
      var socket = new EventTCP(conn);

      socket.on('magic', function(msg) {
        expect(msg).to.equal('Hermione Granger');
        socket.removeAllListeners('magic');
        setTimeout(function() {
          done();
        }, 500);
      });
      setTimeout(function() {
        socket.emit('magic', 'Harry Potter');
      }, 500);
    });
    server.listen(8080, function() {
      var emitter = new EventTCP({
        port: 8080,
        host: 'localhost'
      });
      var handler = function(msg) {
        expect(msg).to.equal('Harry Potter');
        emitter.removeListener('magic', handler);
      };
      emitter.on('magic', handler);

      setTimeout(function() {
        emitter.emit('magic', 'Hermione Granger');
      }, 1000);
    });
  });
});
