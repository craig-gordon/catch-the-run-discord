const db = require('../modules/db.js');
const getMessager = require('../modules/getMessager.js');
const getLogger = require('../modules/getLogger.js');
const CommandExecutionContext = require('../modules/commandExecutionContext.js');

exports.run = async (client, message, args, level) => {
  const ctx = new CommandExecutionContext(Date.now(), args, message, this.help.name);
  const [producer, ...allowlistItems] = args;
  const consumerDiscordId = ctx.getConsumerDiscordId();
  const messager = getMessager(message, ctx.cmdType, ctx.cmdName, producer);
  const logger = getLogger(client.logger, message, ctx.cmdType, ctx.cmdName, producer);
  const wereItemsSpecified = allowlistItems.length > 0;

  if (producer === undefined) return messager.noProducerSpecified();

  let dbClient;
  try {
    dbClient = await db.getDbClient();
  } catch (err) {
    return ctx.endCommandExecution(dbClient, logger.logContext, () => logger.getDbClientError(err), () => message.dbError(producer));
  }

  let feedCategoriesRes;
  if (wereItemsSpecified) feedCategoriesRes = db.getFeedCategories(producer, dbClient);
  const consumerRes = db.getConsumer(consumerDiscordId, dbClient);
  const producerRes = db.getProducer(producer, dbClient);

  let consumerRecord;
  let producerRecord;
  let feedCategoryRecords;
  let validItems = {};
  let invalidItems;

  try {
    consumerRecord = (await consumerRes).rows[0];
  } catch (err) {
    return ctx.endCommandExecution(dbClient, logger.logContext, () => logger.getConsumerError(err), () => messager.dbError(producer));
  }

  try {
    producerRecord = (await producerRes).rows[0];
  } catch (err) {
    return ctx.endCommandExecution(dbClient, logger.logContext, () => logger.getProducerError(err), () => messager.dbError(producer));
  }
  
  if (producerRecord === undefined) return ctx.endCommandExecution(dbClient, logger.logContext, null, messager.producerDoesNotExist(producer));
  
  if (wereItemsSpecified) {
    try {
      feedCategoryRecords = (await feedCategoriesRes).rows;
    } catch (err) {
      return ctx.endCommandExecution(dbClient, logger.logContext, () => logger.getFeedCategoriesError(err), () => messager.dbError(producer));
    }

    const { valid, invalid } = handleAllowlistItemsToAdd(allowlistItems, feedCategoryRecords);
    validItems = valid;
    invalidItems = invalid;
  }

  try {
    await db.addSub(consumerRecord.id, producerRecord.id, null, 'discord', ctx.cmdType, consumerDiscordId, dbClient);
  } catch (err) {
    if (err.code === db.UNIQUE_VIOLATION_CODE) return ctx.endCommandExecution(dbClient, logger.logContext, null, () => messager.subAlreadyExists(producer));
    else return ctx.endCommandExecution(dbClient, logger.logContext, () => logger.addSubError(err), () => messager.dbError(producer));
  }

  return ctx.endCommandExecution(dbClient, logger.logContext, null, () => messager.addSubSuccess(producer, Object.keys(validItems).length, invalidItems));
};

const handleAllowlistItemsToAdd = (itemsToAdd, feedCategories) => {
  let valid = {};
  const invalid = {};

  for (let i = 0; i < itemsToAdd.length; i++) {
    const item = itemsToAdd[i].replace(/[_]/g, ' ');
    if (item === '$all') {
      valid = {'$all': true};
      break;
    } else if (item.includes('|')) {
      const [game, category] = item.split('|');
      let isValid = false;
      for (let j = 0; j < feedCategories.length; j++) {
        const fc = feedCategories[j];
        if ((fc.game_title === game || fc.game_abbreviation === game) && fc.category_name === category) {
          valid[`${fc.game_title}|${fc.category_name}`] = true;
          isValid = true;
          break;
        }
      }
      if (!isValid) invalid[`${game}|${category}`] = true;
    } else {
      const game = item;
      for (let j = 0; j < feedCategories.length; j++) {
        const fc = feedCategories[j];
        if (fc.game_title === game || fc.game_abbreviation === game) {
          valid[fc.game_title] = true;
        }
      }
      invalid[game] = true;
    }
  }

  return { valid, invalid };
}

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