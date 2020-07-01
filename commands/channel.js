const getMessenger = require('../modules/getMessenger.js');
const getLogger = require('../modules/getLogger.js');
const CommandExecutionContext = require('../modules/commandExecutionContext.js');

exports.run = (client, message, args, level, startTime) => {
  const ctx = new CommandExecutionContext(startTime, args, message, this.help.name);
  const messenger = getMessenger(message, getMessageRepo);
  const logger = getLogger(client.logger);

  const channel = message.guild.channels.find(channel => channel.id === message.settings.notificationsChannelId);

  if (!channel) return ctx.endCommandExecution(null, logger.logContext, null, messenger.channelNotSet)

  return ctx.endCommandExecution(null, logger.logContext, null, messenger.displayChannel);
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: [
    'notifications-channel',
    'notificationschannel',
    'notifs-channel',
    'notifschannel',
    'current-channel',
    'currentchannel',
    'get-channel',
    'getchannel',
    'get-notifications-channel',
    'getnotificationschannel',
    'get-notifs-channel',
    'getnotifschannel',
    'get-current-channel',
    'getcurrentchannel'
  ],
  permLevel: 'User'
};

exports.help = {
  name: 'channel',
  category: 'Bot Configuration',
  description: 'Displays the channel in the current server that the Catch The Run bot posts notifications in.',
  usage: 'channel'
};

const getMessageRepo = message => ({
  channelNotSet: () => message.channel.send(`Notifications are not currently being posted in any channel. Please use the !set-channel command.`),
  displayChannel: () => message.channel.send(`Notifications are currently being posted in ${message.channel}.`)
});