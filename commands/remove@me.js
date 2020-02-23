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

  const deleteSubParams = {
    TableName: 'Main',
    ConditionExpression: 'attribute_exists(PRT)',
    Key: {
      PRT: `${producer}|DC`,
      SRT: `F|SUB|${message.guild.id}|${message.author.id}`
    }
  };

  try {
    await dynamoClient.delete(deleteSubParams).promise();
  } catch (e) {
    if (e.code === 'ConditionalCheckFailedException') return message.reply(`\`${producer}\` is not your mentions feed for server \`${message.guild.name}\`.`);

    console.log(`Error removing ${producer} from ${message.author.id}'s mentions feed in server ${message.guild.id}:`, e);
    return message.reply(`An error occurred removing \`${producer}\` from your mentions feed in server \`${message.guild.id}\`. Please try again later.`);
  }

  return message.reply(`\`${producer}\` was successfully removed from your mentions feed in server \`${message.guild.name}\`.`);
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: ['remove-player@me', 'removeplayer@me', 'remove-streamer@me', 'removestreamer@me'],
  permLevel: 'User'
};

exports.help = {
  name: 'remove@me',
  category: 'Subscription Management',
  description: `Removes a streamer from a user's mentions feed in a given server.`,
  usage: '!remove@me [streamer]'
};