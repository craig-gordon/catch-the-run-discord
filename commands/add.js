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

  const getParams = {
    TableName: 'Main',
    Key: {
      PRT: twitchUsername,
      SRT: 'F'
    }
  };

  try {
    const providerDbEntry = (await dynamoClient.get(getParams).promise()).Item;

    if (providerDbEntry === undefined) {
      return message.reply(`The specified streamer either does not exist, or is not registered with Catch The Run. This command takes case-sensitive input. Example format: "!add basedurngod333221"`);
    }

    const putParams = {
      TableName: 'Main',
      Item: {
        PRT: `${twitchUsername}|DC`,
        SRT: `F|SUB|${message.guild.id}`,
        G1S: twitchUsername,
        DCType: 'S'
      }
    }

    const addSubResponse = await dynamoClient.put(putParams).promise();

    if (addSubResponse.err === undefined) {
      return message.reply(`${twitchUsername} was added to this server's feed`);
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