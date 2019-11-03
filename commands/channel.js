exports.run = (client, message, args, level) => {
  const channel = message.guild.channels.find(channel => channel.id === message.settings.channel);
  return message.reply(`On-pace notifications are currently being posted in: ${channel}`);
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: ['current-channel', 'currentchannel', 'get-channel', 'getchannel'],
  permLevel: 'User'
};

exports.help = {
  name: 'channel',
  category: 'Configuration',
  description: 'Sets the channel that the CtR bot will post on-pace notifications',
  usage: 'channel'
};