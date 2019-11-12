const DynamoDB = require('aws-sdk/clients/dynamodb');

exports.run = async (client, message, args, level) => {
  const dynamoClient = new DynamoDB.DocumentClient({
    endpoint: 'https://dynamodb.us-east-1.amazonaws.com',
    accessKeyId: 'AKIAYGOXM6CJTCGJ5S5Z',
    secretAccessKey: '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',
    region: 'us-east-1'
  });

  const [providerTwitchName, ...newWhitelistItems] = args;

  if (providerTwitchName === undefined) {
    return message.channel.send(`No streamer was specified.`);
  }

  const getSubParams = {
    TableName: 'Main',
    Key: {
      PRT: `${providerTwitchName}|DC`,
      SRT: `F|SUB|${message.author.id}`
    }
  };

  let sub;
  try {
    sub = (await dynamoClient.get(getSubParams).promise()).Item;
  } catch (e) {
    console.log(`Error getting ${message.author.id}'s subscription to provider ${providerTwitchName}:`, e);
    return message.channel.send(`There was an error adding items to your whitelist for \`${providerTwitchName}\`. Please try again later.`);
  }

  if (sub === undefined) {
    return message.channel.send(`\`${providerTwitchName}\` is not part of your subscriptions.`);
  }

  const playerCategoriesQueryParams = {
    TableName: 'Main',
    KeyConditionExpression: `PRT = :PRT and begins_with(SRT, :SRT)`,
    ExpressionAttributeValues: {
      ':PRT': providerTwitchName,
      ':SRT': `F|CAT`
    }
  };

  let playerCategories;

  try {
    playerCategories = (await dynamoClient.query(playerCategoriesQueryParams).promise()).Items;
  } catch (e) {
    console.log(`Error getting provider ${providerTwitchName}'s feed categories:`, e);
    return message.channel.send(`There was an error adding items to your whitelist for \`${providerTwitchName}\`. Please try again later.`);
  }

  newWhitelistItems.forEach(item => {
    if (item.includes('_')) sub.IncludedCategories.values.push(item.replace(/[_]/, ' '));
    else sub.IncludedGames.values.push(item.replace(/[_]/, ' ').replace(/[|]/, '_'));
  });

  const modifyFilterParams = {
    TableName: 'Main',
    Item: sub
  };

  try {
    const modifyFilterResponse = await dynamoClient.put(modifyFilterParams).promise();
    if (modifyFilterResponse) return message.channel.send(`Successfully added ${newWhitelistItems.length} items to your whitelist for \`${providerTwitchName}\`.`);
  } catch (e) {
    console.log(`Error modifying ${message.author.id}'s subscription whitelist for provider ${providerTwitchName}:`, e);
    return message.channel.send(`There was an error adding items to your whitelist for \`${providerTwitchName}\`. Please try again later.`);
  }
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['addtowhitelist@dm'],
  permLevel: 'Administrator'
};

exports.help = {
  name: 'add-to-whitelist@dm',
  category: 'Configuration',
  description: `Adds one or more games or categories to a user's whitelist for the specified player. The player must be part of the user's subscriptions.`,
  usage: '!add-to-whitelist@dm [player twitch name] smb1 Super_Mario_World sm64|120_Star Super_Mario_Sunshine|Any%'
};