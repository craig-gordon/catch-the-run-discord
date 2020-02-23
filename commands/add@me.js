const DynamoDB = require('aws-sdk/clients/dynamodb');

exports.run = async (client, message, args, level) => {
  const dynamoClient = new DynamoDB.DocumentClient({
    endpoint: 'https://dynamodb.us-east-1.amazonaws.com',
    accessKeyId: 'AKIAYGOXM6CJTCGJ5S5Z',
    secretAccessKey: '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',
    region: 'us-east-1'
  });

  const producer = args[0];

  if (producer === undefined) {
    return message.reply(`No streamer was specified.`);
  }

  const getFeedParams = {
    TableName: 'Main',
    Key: {
      PRT: producer,
      SRT: 'F'
    }
  };

  let producerDbEntry;
  try {
    producerDbEntry = (await dynamoClient.get(getFeedParams).promise()).Item;
  } catch (e) {
    console.log(`Error getting producer ${producer}:`, e);
    return message.reply(`An error occurred adding \`${producer}\` to your mentions feed in server \`${message.guild.name}\`. Please try again later.`)
  }

  if (producerDbEntry === undefined) {
    return message.reply(`\`${producer}\` is not registered with Catch The Run.`);
  }

  const addSubParams = {
    TableName: 'Main',
    ConditionExpression: 'attribute_not_exists(PRT)',
    Item: {
      PRT: `${producer}|DC`,
      SRT: `F|SUB|${message.guild.id}|${message.author.id}`,
      GS: producer,
      DCType: '@'
    }
  };

  let addSubResponse;
  try {
    addSubResponse = await dynamoClient.put(addSubParams).promise();
  } catch (e) {
    if (e.code === 'ConditionalCheckFailedException') return message.reply(`\`${producer}\` is already in your mentions feed in server \`${message.guild.name}\`.`);

    console.log(`Error adding producer ${producer} to ${message.guild.name}'s mentions feed in server ${message.guild.id}:`, e);
    return message.reply(`An error occurred adding \`${producer}\` to \`${message.guild.name}'s\` notifications feed. Please try again later.`);
  }

  if (addSubResponse) {
    return message.reply(`\`${producer}\` was added to your mentions feed in server \`${message.guild.name}\`.`);
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
  category: 'Subscription Management',
  description: `Adds a streamer to a user's mentions feed in a given server. The streamer must have a feed registered with Catch The Run.`,
  usage: '!add@me [streamer]'
};