'use strict'


class ResponseQueue {
  constructor (channel) {
    this.channel = channel
    this.callbacks = []
    this.channel.assertQueue('', {exclusive: true}, this._init.bind(this))
  }

  _init(err, q) {
    this.queue = q.queue
    this.channel.consume(this.queue, this._trigger.bind(this), {noAck: true})
  }

  _trigger (msg){
    msg.content = JSON.parse(msg.content)
    this.callbacks.forEach( (callback) => {
      callback(content, msg)
    })
  }

  onUpdate(callback) {
    this.callbacks.push(callback)
    return () => {
      this.callbacks.slice(this.callbacks.indexOf(callback), 1)
    }
  }
}

module.exports = ResponseQueue