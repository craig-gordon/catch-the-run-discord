const DynamoDB = require('aws-sdk/clients/dynamodb');

exports.run = async (client, message, args, level) => {
  const dynamoClient = new DynamoDB.DocumentClient({
    endpoint: 'https://dynamodb.us-east-1.amazonaws.com',
    accessKeyId: 'AKIAYGOXM6CJTCGJ5S5Z',
    secretAccessKey: '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',
    region: 'us-east-1'
  });

  const producer = args[0];

  if (producer === undefined) {
    return message.reply(`No streamer was specified.`);
  }

  const getWhitelistParams = {
    TableName: 'Main',
    Key: {
      PRT: `${producer}|DC`,
      SRT: `F|SUB|${message.guild.id}|${message.author.id}`
    }
  };

  let dbRes;
  try {
    dbRes = await dynamoClient.get(getWhitelistParams).promise();
  } catch (e) {
    console.log(`Error getting ${message.author.id}'s whitelist for producer ${producer} in server ${message.guild.id}:`, e);
    return message.reply(`There was an error getting your whitelist for \`${producer}\` in server \`${message.guild.name}\`. Please try again later.`);
  }

  if (dbRes.Item) {
    return message.channel.send(
      formatwhitelist(dbRes.Item.IncludedGames.values, dbRes.Item.IncludedCategories.values),
      { code: 'asciidoc' }
    );
  } else {
    return message.reply(`\`${producer}\` is not in your mentions feed for server \`${message.guild.name}\`.`);
  }
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: ['viewwhitelist@me', 'see-whitelist@me', 'seewhitelist@me', 'list-whitelist@me', 'listwhitelist@me'],
  permLevel: 'User'
};

exports.help = {
  name: 'view-whitelist@me',
  category: 'Configuration',
  description: `Displays the game/category whitelist settings for the specified streamer in a user's mentions feed.`,
  usage: '!view-whitelist@me [streamer]'
};

const formatwhitelist = (games, cats) => {
  let output = '';

  games.forEach(game => output += `- ${game}\n`);
  cats.forEach(cat => output += `- ${cat.replace(/_/, ' :: ')}\n`);

  return output;
};