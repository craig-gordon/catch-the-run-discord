const db = require('../db/index.js');
const getMessager = require('../modules/getMessager.js');
const getLogger = require('../modules/getLogger.js');
const CommandExecutionContext = require('../modules/commandExecutionContext.js');

exports.run = async (client, message, args, level) => {
  const ctx = new CommandExecutionContext(Date.now(), args, message, this.help.name);
  const [producer] = args;
  const messager = getMessager(message, ctx.cmdType, ctx.cmdName, producer);
  const logger = getLogger(client.logger, message, ctx.cmdType, ctx.cmdName, producer);

  if (producer === undefined) return messager.noProducerSpecified();

  let dbClient;
  try {
    dbClient = await db.getDbClient();
  } catch (err) {
    return ctx.endCommandExecution(dbClient, logger.logContext, () => logger.getDbClientError(err), () => messager.dbError(producer));
  }

  const feedCategoriesRes = db.getFeedCategories(producer, dbClient);
  const producerRes = db.getProducer(producer, dbClient);

  let feedCategoryRecords;
  let producerRecord;

  try {
    producerRecord = (await producerRes).rows[0];
  } catch (err) {
    return ctx.endCommandExecution(dbClient, logger.logContext, () => logger.getProducerError(err), () => messager.dbError(producer));
  }
  
  if (producerRecord === undefined) return ctx.endCommandExecution(dbClient, logger.logContext, null, () => messager.producerDoesNotExist(producer));
  
  try {
    feedCategoryRecords = (await feedCategoriesRes).rows;
  } catch (err) {
    return ctx.endCommandExecution(dbClient, logger.logContext, () => logger.getFeedCategoriesError(err), () => messager.dbError(producer));
  }

  const formattedItems = formatFeedItems(feedCategoryRecords);
  const output = `twitch.tv/${producer}\n\n${formattedItems}`;
  return ctx.endCommandExecution(dbClient, logger.logContext, null, () => messager.displayFeed(output));
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['view', 'view-streamer'],
  permLevel: 'User'
};

exports.help = {
  name: 'view-feed',
  category: 'Feed Information',
  description: `Displays the specified streamer's feed, including stream URL, games, and categories.`,
  usage: '!view-feed [streamer twitch username]'
};

const formatFeedItems = categoryRecords => {
  if (categoryRecords.length === 0) return `No games or categories currently registered.`

  const games = [];

  categoryRecords.forEach(category => {
    const gameTitle = category.game_title;
    const categoryName = category.category_name;

    const idx = games.reduce((idx, currGame, currIdx) => {
      if (currGame.title === gameTitle) idx = currIdx;
      return idx;
    }, -1);

    if (idx === -1) {
      games.push({
        title: gameTitle,
        categories: [categoryName]
      });
    } else {
      games[idx].categories.push(categoryName);
    }
  });

  let output = '';

  games.forEach(game => {
    output += `► ${game.title}\n`;
    game.categories.forEach(cat => output += `\t- ${cat}\n`);
    output += '\n';
  });

  return output;
};