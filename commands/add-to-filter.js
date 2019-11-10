const DynamoDB = require('aws-sdk/clients/dynamodb');

exports.run = async (client, message, args, level) => {
  const dynamoClient = new DynamoDB.DocumentClient({
    endpoint: 'https://dynamodb.us-east-1.amazonaws.com',
    accessKeyId: 'AKIAYGOXM6CJTCGJ5S5Z',
    secretAccessKey: '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',
    region: 'us-east-1'
  });

  const [twitchUsername, ...newFilterItems] = args;

  if (twitchUsername === undefined) {
    return message.reply(`No streamer was specified.`);
  }

  const getServerSubParams = {
    TableName: 'Main',
    Key: {
      PRT: `${twitchUsername}|DC`,
      SRT: `F|SUB|${message.guild.id}`
    }
  };

  let serverSub;

  try {
    serverSub = (await dynamoClient.get(getServerSubParams).promise()).Item;
    console.log('serverSub:', serverSub);
  } catch (e) {
    console.log(`Error getting server ${message.guild.id}'s subscription to provider ${twitchUsername}:`, e);
    return message.reply('There was an unknown error adding items to a feed whitelist. Please try again later.');
  }

  if (serverSub === undefined) {
    return message.reply(`The specified player is not part of this server's notifications feed.`);
  }

  const playerCategoriesQueryParams = {
    TableName: 'Main',
    KeyConditionExpression: `PRT = :PRT and begins_with(SRT, :SRT)`,
    ExpressionAttributeValues: {
      ':PRT': twitchUsername,
      ':SRT': `F|CAT`
    }
  };

  let playerCategories;

  try {
    playerCategories = (await dynamoClient.query(playerCategoriesQueryParams).promise()).Items;
    console.log('playerCategories:', playerCategories);
  } catch (e) {
    console.log(`Error getting provider ${twitchUsername}'s feed categories:`, e);
    return message.reply('There was an unknown error adding items to a feed whitelist. Please try again later.');
  }

  newFilterItems.forEach(item => {
    if (item.includes('_')) serverSub.IncludedCategories.values.push(item.replace(/[_]/, ' '));
    else serverSub.IncludedGames.values.push(item.replace(/[_]/, ' ').replace(/[|]/, '_'));
  });

  const modifyFilterParams = {
    TableName: 'Main',
    Item: serverSub
  };

  try {
    const modifyFilterResponse = await dynamoClient.put(modifyFilterParams).promise();
    if (modifyFilterResponse) return message.reply(`Successfully added ${newFilterItems.length} items to ${twitchUsername}'s feed whitelist.`);
  } catch (e) {
    console.log(`Error modifying server ${message.guild.id}'s subscription whitelist for provider ${twitchUsername}:`, e);
    return message.reply('There was an unknown error adding items to a feed whitelist. Please try again later.');
  }
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: ['addtofilter'],
  permLevel: 'Administrator'
};

exports.help = {
  name: 'add-to-filter',
  category: 'Configuration',
  description: `Adds one or more games or categories to a player's filter. The player must be included in the server's notifications feed.`,
  usage: 'add-to-filter [streamer twitch username] smb1 Super_Mario_World sm64|120_Star Super_Mario_Sunshine|Any%'
};