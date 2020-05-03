const getMessager = require('../modules/getMessager.js');
const getLogger = require('../modules/getLogger.js');
const CommandExecutionContext = require('../modules/commandExecutionContext.js');

exports.run = (client, message, args, level) => {
  const ctx = new CommandExecutionContext(Date.now(), args, message, this.help.name);
  const messager = getMessager(message, ctx.cmdType, ctx.cmdName);
  const logger = getLogger(client.logger, message, ctx.cmdType, ctx.cmdName);

  const channel = message.guild.channels.find(channel => channel.id === message.settings.notificationsChannelId);

  if (!channel) return ctx.endCommandExecution(null, logger.logContext, null, messager.channelNotSet)

  return ctx.endCommandExecution(null, logger.logContext, null, () => messager.displayChannel(channel));
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: ['notifications-channel', 'notificationschannel', 'current-channel', 'currentchannel', 'get-channel', 'getchannel', 'get-notifications-channel', 'getnotificationschannel', 'get-current-channel', 'getcurrentchannel'],
  permLevel: 'User'
};

exports.help = {
  name: 'channel',
  category: 'Bot Configuration',
  description: 'Displays the channel in the current server that the Catch The Run bot posts notifications in.',
  usage: 'channel'
};