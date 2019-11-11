const DynamoDB = require('aws-sdk/clients/dynamodb');

exports.run = async (client, message, args, level) => {
  const dynamoClient = new DynamoDB.DocumentClient({
    endpoint: 'https://dynamodb.us-east-1.amazonaws.com',
    accessKeyId: 'AKIAYGOXM6CJTCGJ5S5Z',
    secretAccessKey: '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',
    region: 'us-east-1'
  });

  const providerTwitchName = args[0];

  if (providerTwitchName === undefined) {
    return message.channel.send(`No player was specified.`);
  }

  const getFeedParams = {
    TableName: 'Main',
    Key: {
      PRT: providerTwitchName,
      SRT: 'F'
    }
  };

  let providerDbEntry;
  try {
    providerDbEntry = (await dynamoClient.get(getFeedParams).promise()).Item;
  } catch (e) {
    console.log(`Error getting provider ${providerTwitchName}:`, e);
    return message.channel.send(`An error occurred adding \`${providerTwitchName}\` to \`${message.guild.name}'s\` notifications feed. Please try again later.`)
  }

  if (providerDbEntry === undefined) {
    return message.channel.send(`Player \`${providerTwitchName}\` is not registered with Catch The Run.`);
  }

  const addSubParams = {
    TableName: 'Main',
    ConditionExpression: 'attribute_not_exists(PRT)',
    Item: {
      PRT: `${providerTwitchName}|DC`,
      SRT: `F|SUB|${message.guild.id}`,
      GS: providerTwitchName,
      DCType: 'S'
    }
  };

  let addSubResponse;
  try {
    addSubResponse = await dynamoClient.put(addSubParams).promise();
  } catch (e) {
    if (e.code === 'ConditionalCheckFailedException') return message.channel.send(`\`${providerTwitchName}\` is already in server \`${message.guild.name}'s\` notifications feed.`);

    console.log(`Error adding provider ${providerTwitchName} to server ${message.guild.name}'s notifications feed:`, e);
    return message.channel.send(`An error occurred adding \`${providerTwitchName}\` to \`${message.guild.name}'s\` notifications feed. Please try again later.`);
  }

  if (addSubResponse) {
    return message.channel.send(`\`${providerTwitchName}\` was added to this server \`${message.guild.name}'s\` notifications feed.`);
  }
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: ['add-player', 'addplayer', 'add-streamer', 'addstreamer'],
  permLevel: 'Administrator'
};

exports.help = {
  name: 'add',
  category: 'Feed Management',
  description: `Adds a player to this server's notifications feed. The player must have a feed registered with Catch The Run.`,
  usage: '!add [player twitch name]'
};