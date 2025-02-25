const db = require('../modules/db.js');
const getMessenger = require('../modules/getMessenger.js');
const getLogger = require('../modules/getLogger.js');

exports.run = async (client, message, args, level) => {
  const [producer, ...allowlistItems] = args;
  const cmdName = this.help.name;
  const cmdType = client.getCommandType(message);
  const messager = getMessenger(message, cmdType, cmdName, producer);
  const logger = getLogger(client.logger, message, cmdType, cmdName, producer);

  if (producer === undefined) return messager.noProducerSpecified();

  let producerRecord;
  try {
    producerRecord = (await db.getProducer(producer)).rows[0];
  } catch (err) {
    logger.getProducerError(err);
    return messager.dbError();
  }

  if (producerRecord === undefined) return messager.producerDoesNotExist();

  let consumerRecord;
  try {
    consumerRecord = (await db.getConsumer(message.author.id)).rows[0];
  } catch (err) {
    logger.getConsumerError(err);
    return messager.dbError();
  }

  // get discord mention server record
  // check if discord server itself has an existing subscription to producer
  // check if discord server's allowlist includes the specified allowlist items

  try {
    await db.addSub(producerRecord.id, consumerRecord.id, null, 'discord', cmdType, message.author.id, {});
  } catch (err) {
    if (err.code === '23505') return messager.subAlreadyExists();

    logger.addSubError(err);
    return messager.dbError();
  }

  return messager.addSubSuccess();
};

// validate all items
// add each valid item to an object
// serialize the object
// add invalid items to container to be included in return message

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: ['add-player@me', 'addplayer@me', 'add-streamer@me', 'addstreamer@me', 'subscribe@me'],
  permLevel: 'User'
};

exports.help = {
  name: 'add@me',
  category: 'Subscription Management',
  description: `[@] Adds a streamer to a server's notifications feed. The streamer must have a feed registered with ${global.PRODUCT_NAME}.`,
  usage: '!add@me [streamer]'
};