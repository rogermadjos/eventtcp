/*jshint node: true */
'use strict';

var net = require('net');
var util = require('util');
var events = require('events');
var debug = require('debug');
var _ = require('lodash');

var loggers = {
  connection: debug('jsontcp:connection'),
  data: debug('jsontcp:data'),
  subscription: debug('jsontcp:subscription')
};

function EventTCP() {
  var self = this;
  var json = '';
  self.subscriptions = [];

  if(arguments[0] instanceof net.Socket) {
    self.socket = arguments[0];
  }
  else {
    self.socket = net.connect.apply(net, arguments);
  }

  var emit = self.emit;
  var on = self.on;
  var removeListener = self.removeListener;
  var removeAllListeners = self.removeAllListeners;

  self.socket.on('data', function (data) {
    var parts = data.toString().split('\0');
    json += parts.shift();
    while (parts.length > 0) {
        loggers.data('receive %s', json);
        try {
          var obj = JSON.parse(json);
          if(obj.subscribe) {
            loggers.subscription('subscribe request %s', obj.subscribe);
            self.subscriptions = _.union(self.subscriptions, [obj.subscribe]);
            self.emit('subscribe', obj.subscribe);
          }
          else if(obj.unsubscribe) {
            loggers.subscription('unsubscribe request %s', obj.unsubscribe);
            self.subscriptions = _.difference(self.subscriptions, [obj.unsubscribe]);
            self.emit('subscribe', obj.unsubscribe);
          }
          else {
            emit.call(self, obj.name, obj.payload);
          }
        }
        catch(err) {
          loggers.data(err);
        }
        json = parts.shift();
    }
  });

  self.socket.on('connect', function () {
    loggers.connection('connect');
    emit.call(self, 'connect');
  });

  self.socket.on('end', function () {
    loggers.connection('disconnect');
    emit.call(self, 'disconnect');
    self.destroy();
  });

  self.socket.on('error', function (err) {
    loggers.connection(err);
    emit.call(self, 'error', err);
  });

  self.destroy = function() {
    removeAllListeners.call(self);
    self.socket.destroy();
  };

  self.emit = function(event, payload) {
    if(_.contains(self.subscriptions, event)) {
      var data = JSON.stringify({
        name: event,
        payload: payload
      });
      loggers.data('send %s', data);
      self.socket.write(data+'\0');
    }
  };

  self.on = function(event, callback) {
    if(!self._events || !self._events[event]) {
      var data = JSON.stringify({
        subscribe: event
      });
      loggers.subscription('subscribe %s', event);
      self.socket.write(data+'\0');
    }
    on.call(self,event,callback);
  };

  self.removeListener = function(event, func) {
    removeListener.call(self, event, func);
    if(_.isArray(self._events[event]) && self._events[event].length === 0) {
      var data = JSON.stringify({
        unsubscribe: event
      });
      loggers.subscription('unsubscribe %s', event);
      self.socket.write(data+'\0');
    }
  };

  self.removeAllListeners = function(event) {
    var events = [];
    if(_.isArray(event)) {
      events.push(event);
    }
    else {
      events = _.keys(self._events);
    }
    removeAllListeners.call(self, event);
    _.each(events, function(event) {
      var data = JSON.stringify({
        unsubscribe: event
      });
      loggers.subscription('unsubscribe %s', event);
      self.socket.write(data+'\0');
    });
  };
}

util.inherits(EventTCP, events.EventEmitter);

module.exports.EventTCP = EventTCP;
