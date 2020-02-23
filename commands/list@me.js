const DynamoDB = require('aws-sdk/clients/dynamodb');

exports.run = async (client, message, args, level) => {
  const dynamoClient = new DynamoDB.DocumentClient({
    endpoint: 'https://dynamodb.us-east-1.amazonaws.com',
    accessKeyId: 'AKIAYGOXM6CJTCGJ5S5Z',
    secretAccessKey: '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',
    region: 'us-east-1'
  });

  const verbose = args[0] === 'verbose';

  const allServerSpecificSubsQueryParams = {
    TableName: 'Main',
    IndexName: 'Global1',
    KeyConditionExpression: 'SRT = :SRT',
    ExpressionAttributeValues: {
      ':SRT': `F|SUB|${message.guild.id}|${message.author.id}`
    }
  };

  let allSubs;

  try {
    allSubs = (await dynamoClient.query(allServerSpecificSubsQueryParams).promise()).Items;
  } catch (e) {
    console.log(`Error getting server ${message.guild.id}-specific subs for user ${message.author.id}:`, e);
    return message.reply(`An error occurred getting your mentions feed in server \`${message.guild.name}\`. Please try again later.`)
  }

  if (allSubs === undefined) {
    return message.reply(`You do not have mentions enabled in this server for any streamers. Use !add@me to add a streamer.`);
  }

  return message.channel.send(
    `${message.author.username}, you are receiving mentions in server ${message.guild.name} for:\n
    ${formatOutput(allSubs, verbose)}`,
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
  category: 'Subscription Information',
  description: `Lists all streamers that a user receives mentions for in a given server. Use verbose to display the whitelist for each streamer.`,
  usage: '!list@me (verbose)'
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