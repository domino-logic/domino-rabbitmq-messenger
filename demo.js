const DRM = require('./index')

const messenger = new DRM.Messenger();

messenger.start( (messenger) => {
  const eventQueue = messenger.eventQueue()

  eventQueue.subscribe('foo.*.b')
  eventQueue.subscribe('foo.*.a')
  eventQueue.onUpdate(onUpdate);

  function onUpdate (body) {
    console.log(body);
  }


  setInterval( () => {
      var channels = ['a', 'b', 'c'];
      var channel = Math.floor(Math.random() * channels.length);
      console.log(`Emit on foo.bar.${channels[channel]}`);
      messenger.broadcast(`foo.bar.${channels[channel]}`, {value: Math.random()})
    },
    1000
  );
})