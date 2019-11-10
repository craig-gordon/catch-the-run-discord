const DynamoDB = require('aws-sdk/clients/dynamodb');

exports.run = async (client, message, args, level) => {
  const dynamoClient = new DynamoDB.DocumentClient({
    endpoint: 'https://dynamodb.us-east-1.amazonaws.com',
    accessKeyId: 'AKIAYGOXM6CJTCGJ5S5Z',
    secretAccessKey: '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',
    region: 'us-east-1'
  });

  const getCTRUsernameParams = {
    TableName: 'Main',
    IndexName: 'Global1',
    ProjectionExpression: 'PRT',
    Key: {
      SRT: 'C|DC-U',
      G1S: message.author.id
    }
  };

  let username, dbItem;
  try {
    dbItem = (await dynamoClient.get(getCTRUsernameParams).promise()).Item;
  } catch (e) {
    console.log(`Error getting CTR username for user ${message.author.id}:`, e);
    return message.channel.send(`An error occurred getting your subscriptions. Please try again later.`)
  }

  if (dbItem) {
    username = dbItem.PRT;
  }

  const allSubsQueryParams = {
    TableName: 'Main',
    IndexName: 'ConsumerProvider',
    KeyConditionExpression: 'Consumer = :Consumer',
    ProjectionExpression: 'G1S',
    ExpressionAttributeValues: {
      ':Consumer': username
    }
  };

  let allSubs;

  try {
    allSubs = (await dynamoClient.query(allSubsQueryParams).promise()).Items;
  } catch (e) {
    console.log(`Error getting subs for user ${message.author.id}:`, e);
    return message.channel.send(`An error occurred getting your subscriptions. Please try again later.`)
  }

  if (allSubs === undefined) {
    return message.channel.send(`You are currently not subscribed to any players. Use !add@DM to add a player.`);
  }

  return message.channel.send(
    allSubs.map(sub => sub.G1S).join('\n'),
    { code: 'asciidoc' }
  );
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['list-players@DM', 'listplayers@DM', 'list-streamers@DM', 'liststreamers@DM'],
  permLevel: 'User'
};

exports.help = {
  name: 'list@DM',
  category: 'Information',
  description: `Lists all of a user's subscriptions.`,
  usage: '!list@DM'
};