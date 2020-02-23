const DynamoDB = require('aws-sdk/clients/dynamodb');

exports.run = async (client, message, args, level) => {
  const dynamoClient = new DynamoDB.DocumentClient({
    endpoint: 'https://dynamodb.us-east-1.amazonaws.com',
    accessKeyId: 'AKIAYGOXM6CJTCGJ5S5Z',
    secretAccessKey: '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',
    region: 'us-east-1'
  });

  const [producer, ...itemsToRemove] = args;

  const handler = getHandlerObject(message, producer);

  if (producer === undefined) {
    return handler.sendNoProducerSpecifiedMessage();
  }

  const getSubParams = handler.getGetSubParams(producer);

  let sub;
  try {
    sub = (await dynamoClient.get(getSubParams).promise()).Item;
  } catch (err) {
    handler.logGetSubError(err, producer);
    return handler.sendDbErrorMessage();
  }

  if (sub === undefined) {
    return handler.sendSubDoesNotExistMessage();
  }

  const producerCategoriesQueryParams = handler.getProducerCategoriesQueryParams();

  let producerCategories;
  try {
    producerCategories = (await dynamoClient.query(producerCategoriesQueryParams).promise()).Items;
  } catch (err) {
    handler.logGetFeedCategoriesError(err);
    return handler.sendDbErrorMessage();
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

  if (removedItems.length === 0) return handler.sendNoValidItemsProvidedMessage();

  const modifyFilterParams = handler.getModifyFilterParams(sub);

  try {
    const modifyFilterResponse = await dynamoClient.put(modifyFilterParams).promise();
    if (modifyFilterResponse) return handler.sendModifyFilterSuccessMessage(itemsToRemove);
  } catch (err) {
    handler.logModifyFilterError(err);
    return handler.sendDbErrorMessage();
  }
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['removefromwhitelist'],
  permLevel: 'Administrator'
};

exports.help = {
  name: 'remove-from-whitelist',
  category: 'Subscription Management',
  description: `Server use: Removes one or more games or categories from a server's whitelist for a specified streamer. The streamer must be included in the server's notifications feed.\n
  DM use: Removes one or more games or categories to your whitelist for a specified streamer. You must be subscribed to the streamer.`,
  usage: '!remove-from-whitelist [streamer] smb1 Super_Mario_World sm64|120_Star Super_Mario_Sunshine|Any%'
};

const getHandlerObject = (message, producer) => {
  const base = {
    sendNoProducerSpecifiedMessage: () => message.channel.send(`No streamer was specified.`),
    getProducerCategoriesQueryParams: () => ({
      TableName: 'Main',
      KeyConditionExpression: `PRT = :PRT and begins_with(SRT, :SRT)`,
      ExpressionAttributeValues: {
        ':PRT': producer,
        ':SRT': `F|CAT`
      }
    }),
    getModifyFilterParams: (sub) => ({
      TableName: 'Main',
      Item: sub
    })
  };

  if (message.channel.type === 'dm') {
    return Object.assign(base, {
      getGetSubParams: () => ({
        TableName: 'Main',
        Key: {
          PRT: `${producer}|DC`,
          SRT: `F|SUB|${message.author.id}`
        }
      }),
      logGetSubError: (err) => console.log(`Error getting ${message.author.id}'s subscription to provider ${producer}: ${err}`),
      sendDbErrorMessage: () => message.channel.send(`There was an error adding items to your whitelist for \`${producer}\`. Please try again later.`),
      sendSubDoesNotExistMessage: () => message.channel.send(`You are not subscribed to \`${producer}\` through Discord.`),
      logGetFeedCategoriesError: (err) => `Error getting producer ${producer}'s feed categories: ${err}`,
      sendModifyFilterSuccessMessage: (removedItems) => message.channel.send(`Successfully removed ${removedItems.length} items to your whitelist for \`${producer}\`: ${removedItems}`),
      sendNoValidItemsProvidedMessage: () => message.channel.send(`None of the games or categories specified are a part of your whitelist for \`${producer}\`.`),
      logModifyFilterError: (err) => console.log(`Error modifying ${message.author.id}'s whitelist for producer ${producer}: ${err}`)
    });
  } else {
    return Object.assign(base, {
      getGetSubParams: () => ({
        TableName: 'Main',
        Key: {
          PRT: `${producer}|DC`,
          SRT: `F|SUB|${message.guild.id}`
        }
      }),
      logGetSubError: (err) => console.log(`Error getting server ${message.guild.id}'s subscription to producer ${producer}: ${err}`),
      sendDbErrorMessage: () => message.channel.send(`There was an error adding items to \`${message.guild.name}'s\` whitelist for \`${producer}\`. Please try again later.`),
      sendSubDoesNotExistMessage: () => message.channel.send(`\`${producer}\` is not part of this server's notifications feed.`),
      logGetFeedCategoriesError: (err) => `Error getting producer ${producer}'s feed categories: ${err}`,
      sendModifyFilterSuccessMessage: (removedItems) => message.channel.send(`Successfully removed ${removedItems.length} items to \`${message.guild.name}'s\` whitelist for \`${producer}\`: ${removedItems}`),
      sendNoValidItemsProvidedMessage: () => message.channel.send(`None of the games or categories specified are a part of \`${message.guild.name}'s\` whitelist for \`${producer}\`.`),
      logModifyFilterError: (err) => console.log(`Error modifying server ${message.guild.id}'s whitelist for producer ${producer}: ${err}`)
    });
  }
}