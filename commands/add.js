const db = require('../db/index.js');
const getCommandMessager = require('../modules/getCommandMessager.js');
const getCommandLogger = require('../modules/getCommandLogger.js');

exports.run = async (client, message, args, level) => {
  const [producer, ...allowlistItems] = args;
  const cmdName = this.help.name;
  const cmdType = client.getCommandType(message);
  const consumerDiscordId = cmdType === 'dm' ? message.author.id : message.guild.id;
  const messager = getCommandMessager(message, cmdType, cmdName, producer);
  const logger = getCommandLogger(client.logger, message, cmdType, cmdName, producer);

  if (producer === undefined) return messager.noProducerSpecified();

  // use a dbClient

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
    consumerRecord = (await db.getConsumer(consumerDiscordId)).rows[0];
  } catch (err) {
    logger.getConsumerError(err);
    return messager.dbError();
  }

  try {
    await db.addSub(producerRecord.id, consumerRecord.id, null, 'discord', cmdType, consumerDiscordId, {});
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
  guildOnly: false,
  aliases: ['add-player', 'addplayer', 'add-streamer', 'addstreamer', 'subscribe'],
  permLevel: 'Administrator'
};

exports.help = {
  name: 'add',
  category: 'Subscription Management',
  description: `[Server] Adds a streamer to a server's notifications feed. The streamer must have a feed registered with ${global.PRODUCT_NAME}.\n
  [DM] Adds a streamer to your Discord DM subscriptions. The streamer must have a feed registered with ${global.PRODUCT_NAME}.`,
  usage: '!add streamer_twitch_username [smb1] [Super_Mario_World] [sm64|120_Star] [Super_Mario_Sunshine|Any%]'
};