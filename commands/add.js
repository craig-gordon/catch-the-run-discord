const db = require('../db/index.js');
const getMessager = require('../modules/getMessager.js');
const getLogger = require('../modules/getLogger.js');
const CommandExecutionContext = require('../modules/commandExecutionContext.js');

exports.run = async (client, message, args, level) => {
  const ctx = new CommandExecutionContext(Date.now(), args, message, this.help.name);
  const [producer, ...allowlistItems] = args;
  const consumerDiscordId = ctx.getConsumerDiscordId();
  const messager = getMessager(message, ctx.cmdType, ctx.cmdName, producer);
  const logger = getLogger(client.logger, message, ctx.cmdType, ctx.cmdName, producer);
  const itemsSpecified = allowlistItems.length > 0;

  if (producer === undefined) return messager.noProducerSpecified();

  let dbClient;
  try {
    dbClient = await db.getDbClient();
  } catch (err) {
    return ctx.endCommandExecution(dbClient, logger.logContext, () => logger.getDbClientError(err), message.dbError);
  }

  let feedCategoriesRes;
  if (itemsSpecified) feedCategoriesRes = db.getFeedCategories(producer, dbClient);
  const consumerRes = db.getConsumer(consumerDiscordId, dbClient);
  const producerRes = db.getProducer(producer, dbClient);

  let consumerRecord;
  let producerRecord;
  let feedCategoryRecords;

  try {
    consumerRecord = (await consumerRes).rows[0];
  } catch (err) {
    return ctx.endCommandExecution(dbClient, logger.logContext, () => logger.getConsumerError(err), messager.dbError);
  }

  try {
    producerRecord = (await producerRes).rows[0];
  } catch (err) {
    return ctx.endCommandExecution(dbClient, logger.logContext, () => logger.getProducerError(err), messager.dbError);
  }
  
  if (producerRecord === undefined) return ctx.endCommandExecution(dbClient, logger.logContext, null, messager.producerDoesNotExist);
  
  if (itemsSpecified) {
    try {
      feedCategoryRecords = (await feedCategoriesRes).rows;
    } catch (err) {
      return ctx.endCommandExecution(dbClient, logger.logContext, () => logger.getFeedCategoriesError(err), messager.dbError);
    }


  }

  try {
    await db.addSub(consumerRecord.id, producerRecord.id, null, 'discord', ctx.cmdType, consumerDiscordId, {}, dbClient);
  } catch (err) {
    if (err.code === db.UNIQUE_VIOLATION_CODE) return ctx.endCommandExecution(dbClient, logger.logContext, null, messager.subAlreadyExists);
    else return ctx.endCommandExecution(dbClient, logger.logContext, () => logger.addSubError(err), messager.dbError);
  }

  return ctx.endCommandExecution(dbClient, logger.logContext, null, messager.addSubSuccess);
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
  usage: '!add [streamer twitch username] smb1 Super_Mario_World sm64|120_Star Super_Mario_Sunshine|96_Shines'
};