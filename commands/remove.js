const DynamoDB = require('aws-sdk/clients/dynamodb');

exports.run = async (client, message, args, level) => {
  const dynamoClient = new DynamoDB.DocumentClient({
    endpoint: 'https://dynamodb.us-east-1.amazonaws.com',
    accessKeyId: 'AKIAYGOXM6CJTCGJ5S5Z',
    secretAccessKey: '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',
    region: 'us-east-1'
  });

  const twitchUsername = args[0];

  if (twitchUsername === undefined) {
    return message.reply(`No streamer was specified. Example format: "!add bAsEdUrNgOd333221"`);
  }

  const deleteServerSubParams = {
    TableName: 'Main',
    ConditionExpression: 'attribute_exists(PRT)',
    Key: {
      PRT: `${twitchUsername}|DC`,
      SRT: `F|SUB|${message.guild.id}`
    }
  };

  try {
    await dynamoClient.delete(deleteServerSubParams).promise();
  } catch (e) {
    return message.reply(`The specified streamer is not a part of this server's notifications feed. This command takes case-sensitive input. Example format: "!remove bAsEdUrNgOd333221"`);
  }

  return message.reply(`${twitchUsername} was successfully removed from this server's notifications feed`);
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: ['remove-player', 'removeplayer', 'remove-streamer', 'removestreamer'],
  permLevel: 'Administrator'
};

exports.help = {
  name: 'remove',
  category: 'Configuration',
  description: `Removes a streamer from this server's on-pace notifications feed.`,
  usage: 'remove [streamer twitch username]'
};