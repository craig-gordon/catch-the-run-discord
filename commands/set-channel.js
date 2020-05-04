const db = require('../modules/db.js');
const getMessager = require('../modules/getMessager.js');
const getLogger = require('../modules/getLogger.js');
const CommandExecutionContext = require('../modules/commandExecutionContext.js');

exports.run = async (client, message, args, level) => {
  const ctx = new CommandExecutionContext(Date.now(), args, message, this.help.name);
  let [identifier] = args;
  const messager = getMessager(message, ctx.cmdType, ctx.cmdName);
  const logger = getLogger(client.logger, message, ctx.cmdType, ctx.cmdName);
  
  if (identifier === undefined) return ctx.endCommandExecution(null, logger.logContext, null, messager.noChannelSpecified);

  const type = identifier.slice(0, 2) === '<#' ? 'ref' : 'plaintext';
  if (type === 'ref') identifier = identifier.slice(2, -1);

  const existingChannel = message.guild.channels.find(channel => channel.id === client.settings.get(message.guild.id, 'notificationsChannelId'));
  if (existingChannel) {
    const checkValue = type === 'ref' ? existingChannel.id : existingChannel.name;
    if (checkValue === identifier) return ctx.endCommandExecution(null, logger.logContext, null, () => messager.existingChannelSpecified(existingChannel));
  }

  for (const channelTuple of message.guild.channels) {
    const [id, channel] = channelTuple;
    const name = channel.name;
    const checkValue = type === 'ref' ? id : name;

    if (checkValue === identifier) {
      const dbClient = await db.getDbClient();

      try {
        await db.beginTransaction(dbClient);

        const serverRes = db.updateAllServerSubEndpoints(id, message.guild.id, dbClient);
        const mentionRes = db.updateAllMentionSubEndpoints(id, message.guild.id, dbClient);
        await serverRes;
        await mentionRes;

        await db.commitTransaction(dbClient);
      } catch (err) {
        await db.rollbackTransaction(dbClient);
        return ctx.endCommandExecution(dbClient, logger.logContext, () => logger.updateServerSubEndpointsError(err, channel), () => messager.dbError(message.guild.name));
      }

      client.settings.set(message.guild.id, id, 'notificationsChannelId');
      return ctx.endCommandExecution(dbClient, logger.logContext, null, () => messager.setChannelSuccess(channel));
    }
  }

  return ctx.endCommandExecution(null, logger.logContext, null, () => messager.channelDoesNotExist(identifier));
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: ['setchannel'],
  permLevel: 'Administrator'
};

exports.help = {
  name: 'set-channel',
  category: 'Bot Configuration',
  description: 'Sets the channel in the current server that the Catch The Run bot will post notifications in. Accepts the channel name in either plaintext or the #channel-name format.',
  usage: 'set-channel [channel name]'
};