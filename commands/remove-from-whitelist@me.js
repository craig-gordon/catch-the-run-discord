const DynamoDB = require('aws-sdk/clients/dynamodb');

exports.run = async (client, message, args, level) => {
  const dynamoClient = new DynamoDB.DocumentClient({
    endpoint: 'https://dynamodb.us-east-1.amazonaws.com',
    accessKeyId: 'AKIAYGOXM6CJTCGJ5S5Z',
    secretAccessKey: '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',
    region: 'us-east-1'
  });

  const [producer, ...itemsToRemove] = args;

  if (producer === undefined) {
    return message.reply(`No streamer was specified.`);
  }

  const getSubParams = {
    TableName: 'Main',
    Key: {
      PRT: `${producer}|DC`,
      SRT: `F|SUB|${message.guild.id}|${message.author.id}`
    }
  };

  let sub;
  try {
    sub = (await dynamoClient.get(getSubParams).promise()).Item;
  } catch (e) {
    console.log(`Error getting ${message.author.id}'s subscription to producer ${producer} in server ${message.guild.id}:`, e);
    return message.reply(`There was an error removing items from your whitelist for \`${producer}\` in server \`${message.guild.name}\`. Please try again later.`);
  }

  if (sub === undefined) {
    return message.reply(`\`${producer}\` is not part of your mentions feed for server \`${message.guild.name}\`.`);
  }

  const producerCategoriesQueryParams = {
    TableName: 'Main',
    KeyConditionExpression: `PRT = :PRT and begins_with(SRT, :SRT)`,
    ExpressionAttributeValues: {
      ':PRT': producer,
      ':SRT': `F|CAT`
    }
  };

  let producerCategories;

  try {
    producerCategories = (await dynamoClient.query(producerCategoriesQueryParams).promise()).Items;
  } catch (e) {
    console.log(`Error getting producer ${producer}'s feed categories:`, e);
    return message.reply(`There was an error removing items from your whitelist for \`${producer}\` in server \`${message.guild.name}\`. Please try again later.`);
  }

  const removedItems = [];

  itemsToRemove.forEach(item => {
    let formattedItem;
    if (item.includes('_')) {
      formattedItem = item.replace(/[_]/, ' ');
    } else {
      formattedItem = item.replace(/[_]/, ' ').replace(/[|]/, '_');
    }

    const itemIdx = sub.IncludedCategories.values.indexOf(formattedItem);
    if (itemIdx > -1) {
      sub.IncludedCategories.values.splice(itemIdx, 1);
      removedItems.push(formattedItem);
    }
  });

  if (removedItems.length === 0) return message.channel.send(`None of the games or categories specified are a part of your whitelist for \`${producer}\` in server \`${message.guild.name}\`.`)

  const modifyFilterParams = {
    TableName: 'Main',
    Item: sub
  };

  try {
    const modifyFilterResponse = await dynamoClient.put(modifyFilterParams).promise();
    if (modifyFilterResponse) return message.reply(`Successfully removed ${itemsToRemove.length} items from your whitelist for \`${producer}\` in server \`${message.guild.name}\`: ${itemsToRemove}`);
  } catch (e) {
    console.log(`Error modifying server ${message.guild.id}'s subscription whitelist for producer ${producer}:`, e);
    return message.reply(`There was an error removing items from your whitelist for \`${producer}\` in server \`${message.guild.name}\`. Please try again later.`);
  }
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: ['removefromwhitelist@me'],
  permLevel: 'User'
};

exports.help = {
  name: 'remove-from-whitelist@me',
  category: 'Subscription Management',
  description: `Removes one or more games or categories from a user's mentions feed whitelist for the specified streamer. The streamer must be included in the user's mentions feed in the given server.`,
  usage: '!remove-from-whitelist@me [streamer] smb1 Super_Mario_World sm64|120_Star Super_Mario_Sunshine|Any%'
};