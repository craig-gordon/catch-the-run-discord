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
    return message.reply(`No streamer was specified.`);
  }

  const getWhitelistParams = {
    TableName: 'Main',
    Key: {
      PRT: `${providerTwitchName}|DC`,
      SRT: `F|SUB|${message.author.id}`
    }
  };

  let dbRes;
  try {
    dbRes = await dynamoClient.get(getWhitelistParams).promise();
  } catch (e) {
    console.log(`Error getting ${message.author.id}'s whitelist for provider ${providerTwitchName}:`, e);
    return message.reply(`There was an error getting your whitelist for \`${providerTwitchName}\`. Please try again later.`);
  }

  if (dbRes.Item) {
    return message.channel.send(
      formatwhitelist(dbRes.Item.IncludedGames.values, dbRes.Item.IncludedCategories.values),
      { code: 'asciidoc' }
    );
  } else {
    return message.reply(`\`${providerTwitchName}\` is not a part of your subscriptions.`);
  }
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['viewwhitelist@dm', 'see-whitelist@dm', 'seewhitelist@dm', 'list-whitelist@dm', 'listwhitelist@dm'],
  permLevel: 'User'
};

exports.help = {
  name: 'view-whitelist@dm',
  category: 'Configuration',
  description: `Displays the game/category whitelist settings for the specified player in a user's subscriptions.`,
  usage: '!view-whitelist@dm [player twitch name]'
};

const formatwhitelist = (games, cats) => {
  let output = '';

  games.forEach(game => output += `- ${game}\n`);
  cats.forEach(cat => output += `- ${cat.replace(/_/, ' :: ')}\n`);

  return output;
};