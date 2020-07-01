const db = require('../modules/db.js');
const getMessenger = require('../modules/getMessenger.js');
const getLogger = require('../modules/getLogger.js');
const CommandExecutionContext = require('../modules/commandExecutionContext.js');

exports.run = async (client, message, args, level, startTime) => {
  const ctx = new CommandExecutionContext(startTime, args, message, this.help.name);
  const messenger = getMessenger(message, getMessageRepo);
  const logger = getLogger(client.logger, getLogRepo);
  let [identifier] = args;
  
  if (identifier === undefined) return ctx.endCommandExecution(null, logger.logContext, null, messenger.noChannelSpecified);

  const type = identifier.slice(0, 2) === '<#' ? 'ref' : 'plaintext';
  if (type === 'ref') identifier = identifier.slice(2, -1);

  const existingChannel = message.guild.channels.find(channel => channel.id === client.settings.get(message.guild.id, 'notificationsChannelId'));
  if (existingChannel) {
    const checkValue = type === 'ref' ? existingChannel.id : existingChannel.name;
    if (checkValue === identifier) return ctx.endCommandExecution(null, logger.logContext, null, () => messenger.existingChannelSpecified(existingChannel));
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
        return ctx.endCommandExecution(dbClient, logger.logContext, () => logger.updateServerSubEndpointsError(err, message, channel), () => messenger.dbError(message.guild.name));
      }

      client.settings.set(message.guild.id, id, 'notificationsChannelId');
      return ctx.endCommandExecution(dbClient, logger.logContext, null, () => messenger.setChannelSuccess(channel));
    }
  }

  return ctx.endCommandExecution(null, logger.logContext, null, () => messenger.channelDoesNotExist(identifier));
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: [
    'setchannel',
    'set-notifications-channel',
    'setnotificationschannel',
    'set-notifs-channel',
    'setnotifschannel',
    'set-current-channel',
    'setcurrentchannel'
  ],
  permLevel: 'Administrator'
};

exports.help = {
  name: 'set-channel',
  category: 'Bot Configuration',
  description: 'Sets the channel in the current server that the Catch The Run bot will post notifications in. Accepts the channel name in either plaintext or the #channel-name format.',
  usage: 'set-channel [channel name]'
};

const getMessageRepo = (message) => ({
  dbError: () => message.channel.send(`An error occurred updating the channel that notifications are posted in for server \`${message.guild.name}\`. Please try again later.`),
  noChannelSpecified: () => message.channel.send(`Please specify a channel name.`),
  existingChannelSpecified: (channel) => message.channel.send(`Notifications are already being posted in channel ${channel}.`),
  setChannelSuccess: (channel) => message.channel.send(`Notifications will now be posted in channel ${channel}.`),
  channelDoesNotExist: (channel) => message.channel.send(`Channel name \`${channel}\` did not match any of the channels in the current server.`)
});

const getLogRepo = (logger) => ({
  updateServerSubEndpointsError: (err, message, channel) => logger.error(`Error updating all endpoints for (${message.guild.id} | ${message.guild.name})'s subscriptions to (${channel.id} | ${channel.name}): ${err}`)
})