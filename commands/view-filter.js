const DynamoDB = require('aws-sdk/clients/dynamodb');

exports.run = async (client, message, args, level) => {
  const dynamoClient = new DynamoDB.DocumentClient({
    endpoint: 'https://dynamodb.us-east-1.amazonaws.com',
    accessKeyId: 'AKIAYGOXM6CJTCGJ5S5Z',
    secretAccessKey: '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',
    region: 'us-east-1'
  });

  const twitchUsername = args[0];

  if (twitchUsername === undefined) {
    return message.reply(`No streamer was specified. Example format: "!add bAsEdUrNgOd333221"`);
  }

  const getFilterParams = {
    TableName: 'Main',
    AttributesToGet: ['Filter'],
    Key: {
      PRT: `${twitchUsername}|DC`,
      SRT: `F|SUB|${message.guild.id}`
    }
  };

  try {
    const dbRes = (await dynamoClient.get(getFilterParams).promise());

    if (dbRes.Item) {
      return message.channel.send(
        formatFilter(dbRes.Item.Filter),
        { code: 'asciidoc' }
      );
    } else {
      return message.reply(`The specified streamer is not a part of this server's notifications feed. This command takes case-sensitive input. Example format: "!remove bAsEdUrNgOd333221"`);
    }
  } catch (e) {
    return message.reply(`There was an error getting this server's filter settings for ${twitchUsername}. Please try again later.`);
  }
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: ['viewfilter', 'seefilter', 'see-filter', 'list-filter', 'listfilter'],
  permLevel: 'User'
};

exports.help = {
  name: 'view-filter',
  category: 'Configuration',
  description: `Displays the game/category filter settings for the specified streamer.`,
  usage: 'view-filter [streamer twitch username]'
};

const formatFilter = filter => {
  let output = '';

  filter.Games.values.forEach(game => output += `- ${game}\n`);
  filter.Categories.values.forEach(category => output += `- ${category.replace(/_/, ' -- ')}\n`);

  return output;
};