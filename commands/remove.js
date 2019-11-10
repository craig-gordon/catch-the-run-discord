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

  const deleteSubParams = {
    TableName: 'Main',
    ConditionExpression: 'attribute_exists(PRT)',
    Key: {
      PRT: `${providerTwitchName}|DC`,
      SRT: `F|SUB|${message.guild.id}`
    }
  };

  try {
    await dynamoClient.delete(deleteSubParams).promise();
  } catch (e) {
    if (e.code === 'ConditionalCheckFailedException') return message.channel.send(`\`${providerTwitchName}\` is not in server \`${message.guild.name}'s\` notifications feed.`);

    console.log(`Error removing ${providerTwitchName} from server ${message.guild.id}'s notifications feed:`, e);
    return message.channel.send(`An error occurred removing player ${providerTwitchName} from server \`${message.guild.id}'s\` notifications feed. Please try again later.`);
  }

  return message.channel.send(`${providerTwitchName} was successfully removed from server \`${message.guild.name}'s\` notifications feed.`);
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
  description: `Removes a player from a server's notifications feed.`,
  usage: '!remove [streamer twitch name]'
};