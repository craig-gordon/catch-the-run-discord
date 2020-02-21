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
    return message.reply(`No player was specified.`);
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
    return message.reply(`An error occurred adding \`${providerTwitchName}\` to your mentions feed in server \`${message.guild.name}\`. Please try again later.`)
  }

  if (providerDbEntry === undefined) {
    return message.reply(`\`${providerTwitchName}\` is not registered with Catch The Run.`);
  }

  const addSubParams = {
    TableName: 'Main',
    ConditionExpression: 'attribute_not_exists(PRT)',
    Item: {
      PRT: `${providerTwitchName}|DC`,
      SRT: `F|SUB|${message.guild.id}|${message.author.id}`,
      GS: providerTwitchName,
      DCType: '@'
    }
  };

  let addSubResponse;
  try {
    addSubResponse = await dynamoClient.put(addSubParams).promise();
  } catch (e) {
    if (e.code === 'ConditionalCheckFailedException') return message.reply(`\`${providerTwitchName}\` is already in your mentions feed in server \`${message.guild.name}\`.`);

    console.log(`Error adding provider ${providerTwitchName} to ${message.guild.name}'s mentions feed in server ${message.guild.id}:`, e);
    return message.reply(`An error occurred adding \`${providerTwitchName}\` to \`${message.guild.name}'s\` notifications feed. Please try again later.`);
  }

  if (addSubResponse) {
    return message.reply(`\`${providerTwitchName}\` was added to your mentions feed in server \`${message.guild.name}\`.`);
  }
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: ['add-player@me', 'addplayer@me', 'add-streamer@me', 'addstreamer@me', 'subscribe@me'],
  permLevel: 'Administrator'
};

exports.help = {
  name: 'add@me',
  category: 'Feed Management',
  description: `Adds a player to a user's mentions feed in a given server. The player must have a feed registered with Catch The Run.`,
  usage: '!add@me [player twitch name]'
};