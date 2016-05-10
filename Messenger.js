'use strict'

const amqp = require('amqplib/callback_api')
const EventQueue = require('./EventQueue')
const ResponseQueue = require('./ResponseQueue')


class Messenger {
  constructor (options) {
    this.options = options || {}
    this.changeExchange = this.options.changeExchange || 'domino_change'
    this.amqpURL = this.options.amqp || 'amqp://localhost'
    this.assertedQueues = {}
  }

  start (callback) {
    amqp.connect(this.amqpURL, (err, conn) => {
      if(err) return callback(err)

      conn.createChannel( (err, channel) => {
        if(err) return callback(err)

        this.channel = channel
        this.channel.assertExchange(
          this.changeExchange,
          'topic',
          {durable: false}
        )

        if (this.options.rpcQueue == true)
          this.initRpcQueue(callback)
        else
          callback(null, this)
      })
    })
  }

  ack (msg) {
    this.channel.ack(msg)
  }

  consume (queue, callback) {
    this.assertQueue(queue)
    this.channel.consume(queue, (msg) => {
      msg.content = JSON.parse(msg.content)
      callback(msg)
      this.ack(msg)
    })
  }

  broadcast (topic, json) {
    const body = new Buffer(JSON.stringify(json))
    this.channel.publish(this.changeExchange, topic, body)

    console.log(`Broadcast message to ${topic}: `, json)
  }

  responseQueue () {
    return new ResponseQueue(this.channel)
  }

  eventQueue () {
    return new EventQueue(this.channel, this.changeExchange)
  }

  publish (queue, json, responseQueue) {
    const isReserved = /^amq\./.test(queue)
    const message = new Buffer(JSON.stringify(json))
    const options = {persistent: true}

    if(!isReserved) this.assertQueue(queue)

    if(responseQueue) options['replyTo'] = responseQueue.queue

    this.channel.sendToQueue(queue, message, options)

    console.log(`Published message to ${queue}: `, json.payload)
  }

  assertQueue (queue) {
    if (queue in this.assertedQueues)
      return

    this.channel.assertQueue(queue, {durable: true})
    this.assertedQueues[queue] = true
  }
}



module.exports = Messenger