const getMessager = require('../modules/getMessager.js');
const getLogger = require('../modules/getLogger.js');
const CommandExecutionContext = require('../modules/commandExecutionContext.js');

exports.run = (client, message, args, level) => {
  const ctx = new CommandExecutionContext(Date.now(), args, message, this.help.name);
  let [identifier] = args;
  const messager = getMessager(message, ctx.cmdType, ctx.cmdName);
  const logger = getLogger(client.logger, message, ctx.cmdType, ctx.cmdName);
  
  if (identifier === undefined) return ctx.endCommandExecution(null, logger.logContext, null, messager.noChannelSpecified);

  const type = identifier.slice(0, 2) === '<#' ? 'ref' : 'plaintext';
  if (type === 'ref') identifier = identifier.slice(2, -1);

  const existingChannel = message.guild.channels.find(channel => channel.id === client.settings.get(message.guild.id, 'channel'));
  const checkValue = type === 'ref' ? existingChannel.id : existingChannel.name;
  if (identifier === checkValue) return ctx.endCommandExecution(null, logger.logContext, null, () => messager.existingChannelSpecified(existingChannel));

  for (const channelObj of message.guild.channels) {
    const [id, channel] = channelObj;
    const name = channel.name;
    const checkValue = type === 'ref' ? id : name; 
    if (checkValue === identifier) {
      client.settings.set(message.guild.id, id, 'channel');
      return ctx.endCommandExecution(null, logger.logContext, null, () => messager.setChannelSuccess(channel));
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