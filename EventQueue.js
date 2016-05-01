'use strict';


class EventQueue {
  constructor (channel, eventQueue) {
    this.channel = channel;
    this.eventQueue = eventQueue;
    this.callbacks = []
    this.keys = []
    this.channel.assertQueue('', {exclusive: true}, this._init.bind(this));
  }

  _init(err, q) {
    this.queue = q.queue
    this.keys.forEach(this._subscribe.bind(this));
    this.channel.consume(this.queue, this._trigger.bind(this), {noAck: true});
  }

  _trigger (msg){
    this.callbacks.forEach( (callback) => {
      callback({
        key: msg.fields.routingKey,
        content: JSON.parse(msg.content)
      });
    })
  }

  _subscribe (key) {
    this.channel.bindQueue(
      this.queue,
      this.eventQueue,
      key
    );
  }

  _unsubscribe (key) {
    this.channel.unbindQueue(
      this.queue,
      this.eventQueue,
      key
    );
  }

  onUpdate(callback) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks.slice(this.callbacks.indexOf(callback), 1);
    }
  }

  subscribe (key) {
    if(this.queue)
      this._subscribe(key)
    else
      this.keys.push(key)
  }

  unsubscribe(key) {
    if(this.queue)
      this._unsubscribe(key)
    else
      this.keys.slice(this.keys.indexOf(key), 1);
  }
}

module.exports = EventQueue