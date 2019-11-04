const DynamoDB = require('aws-sdk/clients/dynamodb');

exports.run = async (client, message, args, level) => {
  const dynamoClient = new DynamoDB.DocumentClient({
    endpoint: 'https://dynamodb.us-east-1.amazonaws.com',
    accessKeyId: 'AKIAYGOXM6CJTCGJ5S5Z',
    secretAccessKey: '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',
    region: 'us-east-1'
  });

  const getAllServerSubsQueryParams = {
    TableName: 'Main',
    IndexName: 'Global1',
    KeyConditionExpression: 'SRT = :SRT',
    ExpressionAttributeValues: {
      ':SRT': `F|SUB|${message.guild.id}`
    }
  };

  try {
    const allServerSubs = (await dynamoClient.query(getAllServerSubsQueryParams).promise()).Items;

    if (allServerSubs === undefined) {
      return message.reply(`This server does not have any streamers in its notifications feed. Use !add to add a streamer`);
    }

    return message.channel.send(
      allServerSubs.map(sub => sub.G1S).join('\n'),
      { code: 'asciidoc' }
    );
  } catch (e) {
    console.log(`error getting server's subs:`, e);
  }
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: ['list-players', 'listplayers', 'list-streamers', 'liststreamers'],
  permLevel: 'User'
};

exports.help = {
  name: 'list',
  category: 'Configuration',
  description: `Lists all streamers in this server's on-pace notifications feed.`,
  usage: 'list'
};