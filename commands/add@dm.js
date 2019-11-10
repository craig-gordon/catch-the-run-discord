const DynamoDB = require('aws-sdk/clients/dynamodb');

exports.run = async (client, message, args, level) => {
  if (message.channel.type === 'text') return message.channel.send(`Surprisingly, this command can only be used in DM.`);

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
    return message.channel.send(`An error occurred adding \`${providerTwitchName}\` to your Discord DM subscriptions. Please try again later.`)
  }

  if (providerDbEntry === undefined) {
    return message.channel.send(`Player \`${providerTwitchName}\` is not registered with Catch The Run.`);
  }

  const addSubParams = {
    TableName: 'Main',
    ConditionExpression: 'attribute_not_exists(PRT)',
    Item: {
      PRT: `${providerTwitchName}|DC`,
      SRT: `F|SUB|${message.author.id}`,
      G1S: providerTwitchName,
      DCType: 'DM'
    }
  };

  let addSubResponse;
  try {
    addSubResponse = await dynamoClient.put(addSubParams).promise();
  } catch (e) {
    if (e.code === 'ConditionalCheckFailedException') return message.channel.send(`\`${providerTwitchName}\` is already included in your Discord DM subscriptions.`);

    console.log(`Error adding provider ${providerTwitchName} to ${message.author.id}'s Discord DM subscriptions:`, e);
    return message.channel.send(`An error occurred adding \`${providerTwitchName}\` to your Discord DM subscriptions. Please try again later.`);
  }

  if (addSubResponse) {
    return message.channel.send(`\`${providerTwitchName}\` was added to your Discord DM subscriptions.`);
  }
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['add-player@dm', 'addplayer@dm', 'add-streamer@dm', 'addstreamer@dm'],
  permLevel: 'Administrator'
};

exports.help = {
  name: 'add@dm',
  category: 'Subscription Management',
  description: `Adds a player to a user's list of Discord DM subscriptions. The streamer must have a feed registered with Catch The Run.`,
  usage: '!add@dm [player twitch name]'
};