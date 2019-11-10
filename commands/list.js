const DynamoDB = require('aws-sdk/clients/dynamodb');

exports.run = async (client, message, args, level) => {
  const dynamoClient = new DynamoDB.DocumentClient({
    endpoint: 'https://dynamodb.us-east-1.amazonaws.com',
    accessKeyId: 'AKIAYGOXM6CJTCGJ5S5Z',
    secretAccessKey: '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',
    region: 'us-east-1'
  });

  const allSubsQueryParams = {
    TableName: 'Main',
    IndexName: 'Global1',
    KeyConditionExpression: 'SRT = :SRT',
    ProjectionExpression: 'G1S',
    ExpressionAttributeValues: {
      ':SRT': `F|SUB|${message.guild.id}`
    }
  };

  let allSubs;

  try {
    allSubs = (await dynamoClient.query(allSubsQueryParams).promise()).Items;
  } catch (e) {
    console.log(`Error getting subs for server ${message.guild.id}:`, e);
    return message.channel.send(`An error occurred getting all players in server \`${message.guild.name}'s\` notifications feed. Please try again later.`)
  }

  if (allSubs === undefined) {
    return message.channel.send(`Server \`${message.guild.name}\` does not have any players in its notifications feed. Use !add to add a player.`);
  }

  return message.channel.send(
    allSubs.map(sub => sub.G1S).join('\n'),
    { code: 'asciidoc' }
  );
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: ['list-players', 'listplayers', 'list-streamers', 'liststreamers'],
  permLevel: 'User'
};

exports.help = {
  name: 'list',
  category: 'Feed Information',
  description: `Lists all players in a server's notifications feed.`,
  usage: '!list'
};