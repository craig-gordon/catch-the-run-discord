const DynamoDB = require('aws-sdk/clients/dynamodb');

exports.run = async (client, message, args, level) => {
  const dynamoClient = new DynamoDB.DocumentClient({
    endpoint: 'https://dynamodb.us-east-1.amazonaws.com',
    accessKeyId: 'AKIAYGOXM6CJTCGJ5S5Z',
    secretAccessKey: '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',
    region: 'us-east-1'
  });

  const providerTwitchName = args[0];

  if (providerTwitchName === undefined) {
    return message.channel.send(`No streamer was specified.`);
  }

  const getWhitelistParams = {
    TableName: 'Main',
    Key: {
      PRT: `${providerTwitchName}|DC`,
      SRT: `F|SUB|${message.guild.id}`
    }
  };

  let dbRes;
  try {
    dbRes = await dynamoClient.get(getWhitelistParams).promise();
  } catch (e) {
    console.log(`Error getting ${message.guild.id}'s whitelist for provider ${providerTwitchName}:`, e);
    return message.channel.send(`There was an error getting \`${message.guild.name}'s\` whitelist settings for \`${providerTwitchName}\`. Please try again later.`);
  }

  if (dbRes.Item) {
    return message.channel.send(
      formatwhitelist(dbRes.Item.IncludedGames.values, dbRes.Item.IncludedCategories.values),
      { code: 'asciidoc' }
    );
  } else {
    return message.channel.send(`\`${providerTwitchName}\` is not in server \`${message.guild.name}\`'s notifications feed.`);
  }
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: ['viewwhitelist', 'see-whitelist', 'seewhitelist', 'list-whitelist', 'listwhitelist'],
  permLevel: 'User'
};

exports.help = {
  name: 'view-whitelist',
  category: 'Configuration',
  description: `Displays the game/category whitelist settings for the specified player.`,
  usage: '!view-whitelist [player twitch name]'
};

const formatwhitelist = (games, cats) => {
  let output = '';

  games.forEach(game => output += `- ${game}\n`);
  cats.forEach(cat => output += `- ${cat.replace(/_/, ' :: ')}\n`);

  return output;
};