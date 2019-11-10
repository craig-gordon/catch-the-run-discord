const DynamoDB = require('aws-sdk/clients/dynamodb');

exports.run = async (client, message, args, level) => {
  const dynamoClient = new DynamoDB.DocumentClient({
    endpoint: 'https://dynamodb.us-east-1.amazonaws.com',
    accessKeyId: 'AKIAYGOXM6CJTCGJ5S5Z',
    secretAccessKey: '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',
    region: 'us-east-1'
  });

  const allServerSpecificSubsQueryParams = {
    TableName: 'Main',
    IndexName: 'Global1',
    KeyConditionExpression: 'SRT = :SRT',
    ProjectionExpression: 'G1S',
    ExpressionAttributeValues: {
      ':SRT': `F|SUB|${message.guild.id}|${message.author.id}`
    }
  };

  let allSubs;

  try {
    allSubs = (await dynamoClient.query(allServerSpecificSubsQueryParams).promise()).Items;
  } catch (e) {
    console.log(`Error getting server ${message.guild.id}-specific subs for user ${message.author.id}:`, e);
    return message.channel.send(`An error occurred getting your subscriptions specific to this server. Please try again later.`)
  }

  if (allSubs === undefined) {
    return message.channel.send(`You do not have mentions enabled in this server for any players. Use !add@me to add a player.`);
  }

  return message.channel.send(
    allSubs.map(sub => sub.G1S).join('\n'),
    { code: 'asciidoc' }
  );
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: ['list-players@me', 'listplayers@me', 'list-streamers@me', 'liststreamers@me'],
  permLevel: 'User'
};

exports.help = {
  name: 'list@me',
  category: 'Information',
  description: `Lists all players that a user will get mentioned for in a given server.`,
  usage: '!list@me'
};