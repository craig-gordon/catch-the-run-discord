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
      SRT: `F|SUB|${message.author.id}`
    }
  };

  try {
    await dynamoClient.delete(deleteSubParams).promise();
  } catch (e) {
    if (e.code === 'ConditionalCheckFailedException') return message.channel.send(`\`${providerTwitchName}\` is not in your Discord DM subscriptions.`);

    console.log(`Error removing ${providerTwitchName} from ${message.author.id}'s Discord DM subscriptions:`, e);
    return message.channel.send(`An error occurred removing player \`${providerTwitchName}\` from your Discord DM subscriptions. Please try again later.`);
  }

  return message.channel.send(`\`${providerTwitchName}\` was successfully removed from your Discord DM subscriptions.`);
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['remove-player@dm', 'removeplayer@dm', 'remove-streamer@dm', 'removestreamer@dm'],
  permLevel: 'User'
};

exports.help = {
  name: 'remove@dm',
  category: 'Feed Management',
  description: `Removes a player from a user's list of Discord DM subscriptions.`,
  usage: '!remove@dm [streamer twitch name]'
};