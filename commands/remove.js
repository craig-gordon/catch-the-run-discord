const db = require('../db/index.js');
const getMessager = require('../modules/getMessager.js');
const getLogger = require('../modules/getLogger.js');
const CommandExecutionContext = require('../modules/commandExecutionContext.js');

exports.run = async (client, message, args, level) => {
  const ctx = new CommandExecutionContext(Date.now(), args, message, this.help.name);
  const [producer] = args;
  const consumerDiscordId = ctx.getConsumerDiscordId();
  const messager = getMessager(message, ctx.cmdType, ctx.cmdName, producer);
  const logger = getLogger(client.logger, message, ctx.cmdType, ctx.cmdName, producer);

  if (producer === undefined) return messager.noProducerSpecified();

  let dbClient;
  try {
    dbClient = await db.getDbClient();
  } catch (err) {
    return ctx.endCommandExecution(dbClient, logger.logContext, () => logger.getDbClientError(err), message.dbError);
  }

  const consumerRes = db.getConsumer(consumerDiscordId, dbClient);
  const producerRes = db.getProducer(producer, dbClient);
  let consumerRecord;
  let producerRecord;

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

  if (consumerRecord === undefined) return ctx.endCommandExecution(dbClient, logger.logContext, null, messager.consumerDoesNotExist);
  if (producerRecord === undefined) return ctx.endCommandExecution(dbClient, logger.logContext, null, messager.producerDoesNotExist);
  if (consumerRecord.id === producerRecord.id) return ctx.endCommandExecution(dbClient, logger.logContext, null, messager.consumerIsProducer);

  let removeRes;
  try {
    removeRes = await db.removeSub(consumerRecord.id, producerRecord.id, null, 'discord', ctx.cmdType, dbClient);
  } catch (err) {
    return ctx.endCommandExecution(dbClient, logger.logContext, () => logger.removeSubError(err), messager.dbError);
  }

  if (removeRes.rowCount === 0) return ctx.endCommandExecution(dbClient, logger.logContext, null, messager.subDoesNotExist);

  return ctx.endCommandExecution(dbClient, logger.logContext, null, messager.removeSubSuccess);
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['remove-player', 'removeplayer', 'remove-streamer', 'removestreamer', 'unsubscribe'],
  permLevel: 'Administrator'
};

exports.help = {
  name: 'remove',
  category: 'Subscription Management',
  description: `[Server] Removes a streamer from a server's notifications feed.\n
  [DM] Removes a streamer from your Discord DM subscriptions.`,
  usage: '!remove streamer_twitch_username'
};