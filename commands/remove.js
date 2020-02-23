const DynamoDB = require('aws-sdk/clients/dynamodb');

exports.run = async (client, message, args, level) => {
  const dynamoClient = new DynamoDB.DocumentClient({
    endpoint: 'https://dynamodb.us-east-1.amazonaws.com',
    accessKeyId: 'AKIAYGOXM6CJTCGJ5S5Z',
    secretAccessKey: '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',
    region: 'us-east-1'
  });

  const producer = args[0];

  const handler = getHandler(message, producer);

  if (producer === undefined) {
    return handler.sendNoProducerSpecifiedMessage();
  }

  const deleteSubParams = handler.getDeleteSubParams();

  try {
    await dynamoClient.delete(deleteSubParams).promise();
  } catch (err) {
    if (err.code === 'ConditionalCheckFailedException') return handler.sendNoSubExistsMessage();

    handler.logDeleteSubError(err);
    return handler.sendDbErrorMessage();
  }

  return handler.sendDeleteSubSuccessMessage();
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['remove-player', 'removeplayer', 'remove-streamer', 'removestreamer'],
  permLevel: 'Administrator'
};

exports.help = {
  name: 'remove',
  category: 'Subscription Management',
  description: `Server use: Removes a streamer from a server's notifications feed.\n
  Removes a streamer from a user's list of Discord DM subscriptions.`,
  usage: '!remove [streamer]'
};

const getHandler = (message, producer) => {
  const base = {
    sendNoProducerSpecifiedMessage: () => message.channel.send(`No streamer was specified.`),
  };

  if (message.channel.type === 'dm') {
    return Object.assign(base, {
      getDeleteSubParams: () => ({
        TableName: 'Main',
        ConditionExpression: 'attribute_exists(PRT)',
        Key: {
          PRT: `${producer}|DC`,
          SRT: `F|SUB|${message.author.id}`
        }
      }),
      sendNoSubExistsMessage: () => message.channel.send(`\`${producer}\` is not in your Discord DM subscriptions.`),
      logDeleteSubError: (err) => console.log(`Error removing ${producer} from ${message.author.id}'s Discord DM subscriptions: ${err}`),
      sendDbErrorMessage: () => message.channel.send(`An error occurred removing \`${producer}\` from your Discord DM subscriptions. Please try again later.`),
      sendDeleteSubSuccessMessage: () => message.channel.send(`\`${producer}\` was successfully removed from your Discord DM subscriptions.`)
    });
  } else {
    return Object.assign(base, {
      getDeleteSubParams: () => ({
        TableName: 'Main',
        ConditionExpression: 'attribute_exists(PRT)',
        Key: {
          PRT: `${producer}|DC`,
          SRT: `F|SUB|${message.guild.id}`
        }
      }),
      sendNoSubExistsMessage: () => message.channel.send(`\`${producer}\` is not in server \`${message.guild.name}'s\` notifications feed.`),
      logDeleteSubError: (err) => console.log(`Error removing ${producer} from server ${message.guild.id}'s notifications feed: ${err}`),
      sendDbErrorMessage: () => message.channel.send(`An error occurred removing ${producer} from server \`${message.guild.id}'s\` notifications feed. Please try again later.`),
      sendDeleteSubSuccessMessage: () => message.channel.send(`${producer} was successfully removed from server \`${message.guild.name}'s\` notifications feed.`)
    });
  }
};