const db = require('../modules/db.js');
const getMessenger = require('../modules/getMessenger.js');
const getLogger = require('../modules/getLogger.js');

exports.run = async (client, message, args, level) => {
  const [producer, ...allowlistItemsToAdd] = args;
  const cmdName = this.help.name;
  const cmdType = client.getCommandType(message);
  const messager = getMessenger(message, cmdType, cmdName, producer);
  const logger = getLogger(client.logger, message, cmdType, cmdName, producer);

  if (producer === undefined) return messager.noProducerSpecified();
  if (allowlistItemsToAdd.length === 0) return messager.noAllowlistItemsSpecified();

  let sub;
  try {
    sub = (await db.getSub()).rows[0];
  } catch (err) {
    logger.getSubError(err, producer);
    return messager.dbError();
  }

  if (sub === undefined) return messager.subDoesNotExist();

  let feedCategories;
  try {
    feedCategories = (await db.getFeedCategories(producer)).rows;
  } catch (err) {
    logger.getFeedCategoriesError(err);
    return messager.dbError();
  }

  // validate all items
  // add each valid item to an object
  // serialize the object
  // add invalid items to container to be included in return message

  const serializedItems = allowlistItemsToAdd.map(item => {
    if (item.includes('_')) {
      sub.IncludedCategories.values.push(item.replace(/[_]/, ' '));
    } else {
      sub.IncludedGames.values.push(item.replace(/[_]/, ' ').replace(/[|]/, '_'));
    }
  });

  try {
    await db.addToAllowlist(sub.id, serializedItems);
    return messager.addToAllowlistSuccess(serializedItems.length);
  } catch (err) {
    logger.addToAllowlistError(err);
    return messager.dbError();
  }
};

// const validateItem

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['addtoallowlist'],
  permLevel: 'Administrator'
}

exports.help = {
  name: 'add-to-allowlist',
  category: 'Subscription Management',
  description: `[Server] Adds one or more games or categories to a server's allowlist for the specified streamer. The server must be subscribed to the streamer.\n
  [DM] Adds one or more games or categories to your allowlist for the specified streamer. You must be subscribed to the streamer.`,
  usage: '!add streamer_twitch_username smb1 [Super_Mario_World] [sm64|120_Star] [Super_Mario_Sunshine|Any%]'
}