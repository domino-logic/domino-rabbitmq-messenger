'use strict';

const amqp = require('amqplib/callback_api')
const EventQueue = require('./EventQueue')


class Messenger {
  constructor (options) {
    this.options = options || {}
    this.changeExchange = this.changeExchange || 'domino_change'
    this.assertedQueues = {}
  }

  config (options) {
    Object.assign(this.options, options)
  }

  start (callback) {
    const amqp_url = this.options.amqp || 'amqp://localhost';
    amqp.connect(amqp_url, (err, conn) => {
      this.AssertNoError(err);

      conn.createChannel( (err, channel) => {
        this.AssertNoError(err);
        this.channel = channel;
        this.channel.assertExchange(
          this.changeExchange,
          'topic',
          {durable: false}
        )

        callback(this)
      });
    });
  }

  AssertNoError (err) {
    if (err){
      console.error(err);
      process.exit(1);
    }
  }

  ack (msg) {
    this.channel.ack(msg);
  }

  consume (queue, callback) {
    this.assertQueue(queue);
    this.channel.consume(queue, (msg) => {
      msg.content = JSON.parse(msg.content)
      callback(msg.content);
      this.ack(msg);
    })
  }

  broadcast (topic, json) {
    const body = new Buffer(JSON.stringify(json));
    this.channel.publish(this.changeExchange, topic, body)
  }

  eventQueue (callback) {
    return new EventQueue(this.channel, this.changeExchange);
  }

  publish (queue, json) {
    this.assertQueue(queue);

    const message = new Buffer(JSON.stringify(json));

    this.channel.sendToQueue(
      queue,
      message,
      {persistent: true}
    );

    console.log(`Published message to ${queue}: `, json.payload);
  }

  assertQueue (queue) {
    if (queue in this.assertedQueues)
      return

    this.channel.assertQueue(queue, {durable: true});
    this.assertedQueues[queue] = true;
  }
}



module.exports = Messenger