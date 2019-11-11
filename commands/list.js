const DynamoDB = require('aws-sdk/clients/dynamodb');

exports.run = async (client, message, args, level) => {
  const dynamoClient = new DynamoDB.DocumentClient({
    endpoint: 'https://dynamodb.us-east-1.amazonaws.com',
    accessKeyId: 'AKIAYGOXM6CJTCGJ5S5Z',
    secretAccessKey: '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',
    region: 'us-east-1'
  });

  const verbose = args[0] === 'verbose';

  const allSubsQueryParams = {
    TableName: 'Main',
    IndexName: 'Global1',
    KeyConditionExpression: 'SRT = :SRT',
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
    formatOutput(allSubs, verbose),
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
  description: `Lists all players in a server's notifications feed. Use verbose to display the whitelist for each player.`,
  usage: '!list (verbose)'
};

const formatOutput = (subs, verbose) => {
  if (verbose) {
    return subs
      .map(sub => `${sub.GS}\n${sub.IncludedGames.values.map(game => `\t- ${game}`).join('\n')}\n${sub.IncludedCategories.values.map(cat => `\t- ${cat.replace(/[_]/, ' :: ')}`).join('\n')}`)
      .join('\n');
  } else {
    return subs.map(sub => sub.GS).join('\n');
  }
};