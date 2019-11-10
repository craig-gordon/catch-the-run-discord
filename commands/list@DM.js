const DynamoDB = require('aws-sdk/clients/dynamodb');

exports.run = async (client, message, args, level) => {
  if (message.channel.type === 'text') return message.channel.send(`Surprisingly, this command can only be used in DM.`);

  const dynamoClient = new DynamoDB.DocumentClient({
    endpoint: 'https://dynamodb.us-east-1.amazonaws.com',
    accessKeyId: 'AKIAYGOXM6CJTCGJ5S5Z',
    secretAccessKey: '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',
    region: 'us-east-1'
  });

  const CTRUsernameQueryParams = {
    TableName: 'Main',
    IndexName: 'Global1',
    KeyConditionExpression: 'SRT = :SRT and G1S = :G1S',
    ProjectionExpression: 'PRT',
    ExpressionAttributeValues: {
      ':SRT': 'C|DC-U',
      ':G1S': message.author.id
    }
  };

  let username, dbResponse;
  try {
    dbResponse = (await dynamoClient.query(CTRUsernameQueryParams).promise());
  } catch (e) {
    console.log(`Error getting CTR username for user ${message.author.id}:`, e);
    return message.channel.send(`An error occurred getting your subscriptions. Please try again later.`)
  }

  if (dbResponse.Items.length > 0) {
    username = dbResponse.Items[0].PRT;
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
    return message.channel.send(`You are currently not subscribed to any players. Use !add@dm to add a player.`);
  }

  return message.channel.send(
    `${message.author.username}, you are subscribed to:
    ${allSubs.map(sub => sub.G1S).join('\n')}`,
    { code: 'asciidoc' }
  );
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['list-players@dm', 'listplayers@dm', 'list-streamers@dm', 'liststreamers@dm'],
  permLevel: 'User'
};

exports.help = {
  name: 'list@dm',
  category: 'Feed Information',
  description: `Lists all of a user's subscriptions.`,
  usage: '!list@dm'
};