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
    return message.reply(`No streamer was specified. Example format: "!add basedurngod333221"`);
  }

  const getFeedParams = {
    TableName: 'Main',
    Key: {
      PRT: twitchUsername,
      SRT: 'F'
    }
  };

  try {
    const providerDbEntry = (await dynamoClient.get(getFeedParams).promise()).Item;

    if (providerDbEntry === undefined) {
      return message.reply(`The specified streamer is not registered with Catch The Run. This command takes case-sensitive input. Example format: "!add basedurngod333221"`);
    }

    const getServerSubParams = {
      TableName: 'Main',
      Key: {
        PRT: `${twitchUsername}|DC`,
        SRT: `F|SUB|${message.guild.id}`
      }
    };

    const existingSub = (await dynamoClient.get(getServerSubParams).promise()).Item;

    if (existingSub !== undefined) {
      return message.reply(`${twitchUsername} is already in this server's notifications feed`);
    }

    const addSubParams = {
      TableName: 'Main',
      Item: {
        PRT: `${twitchUsername}|DC`,
        SRT: `F|SUB|${message.guild.id}`,
        G1S: twitchUsername,
        DCType: 'S'
      }
    };

    const addSubResponse = await dynamoClient.put(addSubParams).promise();

    if (addSubResponse.err === undefined) {
      return message.reply(`${twitchUsername} was added to this server's notifications feed`);
    }
  } catch (e) {
    console.log('error adding new discord server subscription to DB:', e);
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
  category: 'Configuration',
  description: `Adds a streamer to this server's on-pace notifications feed. The streamer must have a feed registered with Catch The Run.`,
  usage: 'add [streamer twitch username]'
};