exports.run = (client, message, args, level) => {
  const providedName = args[0];

  if (providedName === undefined) {
    return message.reply(`No channel name was provided. Example format: "!set-channel notifications"`);
  }

  const existingChannel = message.guild.channels.find(channel => channel.id === client.settings.get(message.guild.id, 'channel'));
  if (providedName === existingChannel.name) {
    return message.reply(`On-pace notifications are already being posted in channel ${existingChannel}`)
  }

  for (const channel of message.guild.channels) {
    const channelId = channel[0];
    const currName = channel[1].name;
    if (currName === providedName) {
      client.settings.set(message.guild.id, channelId, 'channel');
      return message.reply(
        `On-pace notifications will now be posted in channel ${channel[1]}`
      );
    }
  }

  return message.reply(`The name provided did not match any of the channels in this server. Example format: "!set-channel notifications"`);
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: ['setchannel'],
  permLevel: 'Administrator'
};

exports.help = {
  name: 'set-channel',
  category: 'Configuration',
  description: 'Sets the channel that the CtR bot will post on-pace notifications',
  usage: 'set-channel [channel name]'
};