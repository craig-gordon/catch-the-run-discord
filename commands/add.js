const DynamoDB = require('aws-sdk/clients/dynamodb');

exports.run = async (client, message, args, level) => {
  const dynamoClient = new DynamoDB.DocumentClient({
    endpoint: 'https://dynamodb.us-east-1.amazonaws.com',
    accessKeyId: 'AKIAYGOXM6CJTCGJ5S5Z',
    secretAccessKey: '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',
    region: 'us-east-1'
  });

  const producer = args[0];

  const handler = getHandlerObject(message, producer);

  if (producer === undefined) {
    return handler.sendNoProducerSpecifiedMessage();
  }

  const getFeedParams = handler.getGetFeedParams();

  let producerDbEntry;
  try {
    producerDbEntry = (await dynamoClient.get(getFeedParams).promise()).Item;
  } catch (err) {
    handler.logGetProducerDbEntryError(err);
    return handler.sendDbErrorMessage();
  }

  if (producerDbEntry === undefined) {
    return handler.sendProducerDoesNotExistMessage();
  }

  const addSubParams = handler.getAddSubParams();

  let addSubResponse;
  try {
    addSubResponse = await dynamoClient.put(addSubParams).promise();
  } catch (err) {
    if (err.code === 'ConditionalCheckFailedException') return handler.sendSubAlreadyExistsMessage();

    handler.logAddSubError(err);
    return handler.sendDbErrorMessage();
  }

  if (addSubResponse) {
    return handler.sendAddSubSuccessMessage();
  }
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['add-player', 'addplayer', 'add-streamer', 'addstreamer', 'subscribe'],
  permLevel: 'Administrator'
};

exports.help = {
  name: 'add',
  category: 'Subscription Management',
  description: `Server use: Adds a streamer to a server's notifications feed. The streamer must have a feed registered with Catch The Run.\n\n
  DM use: Adds a streamer to your Discord DM subscriptions. The streamer must have a feed registered with Catch The Run.`,
  usage: '!add [player twitch name]'
};

const getHandlerObject = (message, producer) => {
  const base = {
    sendNoProducerSpecifiedMessage: () => message.channel.send(`No streamer was specified.`),
    getGetFeedParams: () => ({
      TableName: 'Main',
      Key: {
        PRT: producer,
        SRT: 'F'
      }
    }),
    logGetProducerDbEntryError: (err) => console.log(`Error getting producer ${producer}: ${err}`),
    sendProducerDoesNotExistMessage: () => message.channel.send(`Streamer \`${producer}\` is not registered with ${global.PRODUCT_NAME}.`)
  };

  if (message.channel.type === 'dm') {
    return Object.assign(base, {
      sendDbErrorMessage: () => message.channel.send(`An error occurred adding \`${producer}\` to your Discord DM subscriptions. Please try again later.`),
      getAddSubParams: () => ({
        TableName: 'Main',
        ConditionExpression: 'attribute_not_exists(PRT)',
        Item: {
          PRT: `${producer}|DC`,
          SRT: `F|SUB|${message.author.id}`,
          GS: producer,
          DCType: 'DM'
        }
      }),
      sendSubAlreadyExistsMessage: () => message.channel.send(`\`${producer}\` is already included in your Discord DM subscriptions.`),
      logAddSubError: (err) => console.log(`Error adding producer ${producer} to ${message.author.id}'s Discord DM subscriptions: ${err}`),
      sendAddSubSuccessMessage: () => message.channel.send(`\`${producer}\` was added to your Discord DM subscriptions.`)
    });
  } else {
    return Object.assign(base, {
      sendDbErrorMessage: () => message.channel.send(`An error occurred adding \`${producer}\` to \`${message.guild.name}'s\` notifications feed. Please try again later.`),
      getAddSubParams: () => ({
        TableName: 'Main',
        ConditionExpression: 'attribute_not_exists(PRT)',
        Item: {
          PRT: `${producer}|DC`,
          SRT: `F|SUB|${message.guild.id}`,
          GS: producer,
          DCType: 'S'
        }
      }),
      sendSubAlreadyExistsMessage: () => message.channel.send(`\`${producer}\` is already in server \`${message.guild.name}'s\` notifications feed.`),
      logAddSubError: (err) => console.log(`Error adding producer ${producer} to server ${message.guild.name}'s notifications feed: ${err}`),
      sendAddSubSuccessMessage: () => message.channel.send(`\`${producer}\` was added to this server \`${message.guild.name}'s\` notifications feed.`)
    });
  }
}