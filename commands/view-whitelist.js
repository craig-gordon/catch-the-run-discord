const DynamoDB = require('aws-sdk/clients/dynamodb');

exports.run = async (client, message, args, level) => {
  const dynamoClient = new DynamoDB.DocumentClient({
    endpoint: 'https://dynamodb.us-east-1.amazonaws.com',
    accessKeyId: 'AKIAYGOXM6CJTCGJ5S5Z',
    secretAccessKey: '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',
    region: 'us-east-1'
  });

  const producer = args[0];

  const handler = getHandler(message, producer);

  if (producer === undefined) {
    return handler.sendNoProducerSpecifiedMessage();
  }

  const getWhitelistParams = handler.getGetWhitelistParams();

  let dbRes;
  try {
    dbRes = await dynamoClient.get(getWhitelistParams).promise();
  } catch (err) {
    handler.logGetWhitelistError(err);
    return handler.sendDbErrorMessage();
  }

  if (dbRes.Item) {
    return message.channel.send(
      handler.formatwhitelist(dbRes.Item.IncludedGames.values, dbRes.Item.IncludedCategories.values),
      { code: 'asciidoc' }
    );
  } else {
    return message.channel.send(`\`${producer}\` is not in server \`${message.guild.name}\`'s notifications feed.`);
  }
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['viewwhitelist', 'see-whitelist', 'seewhitelist', 'list-whitelist', 'listwhitelist'],
  permLevel: 'User'
};

exports.help = {
  name: 'view-whitelist',
  category: 'Subscription Information',
  description: `Server use: Displays the game/category whitelist settings for the specified streamer.\n
  DM use: Displays the game/category whitelist settings for the specified streamer in your subscriptions.`,
  usage: '!view-whitelist [streamer]'
};

const getHandler = (message, producer) => {
  const base = {
    sendNoProducerSpecifiedMessage: () => message.channel.send(`No streamer was specified.`),
    formatWhitelist: (games, cats) => {
      let output = '';
    
      games.forEach(game => output += `- ${game}\n`);
      cats.forEach(cat => output += `- ${cat.replace(/_/, ' :: ')}\n`);
    
      return output;
    }
  };

  if (message.channel.type === 'dm') {
    return Object.assign(base, {
      getGetWhitelistParams: () => ({
        TableName: 'Main',
        Key: {
          PRT: `${producer}|DC`,
          SRT: `F|SUB|${message.author.id}`
        }
      }),
      logGetWhitelistError: (err) => console.log(`Error getting ${message.author.id}'s whitelist for provider ${producer}: ${err}`),
      sendDbErrorMessage: () => message.reply(`There was an error getting your whitelist for \`${producer}\`. Please try again later.`),
      sendSubDoesNotExistMessage: () => message.reply(`\`${producer}\` is not a part of your subscriptions.`)
    });
  } else {
    return Object.assign(base, {
      getGetWhitelistParams: () => ({
        TableName: 'Main',
        Key: {
          PRT: `${producer}|DC`,
          SRT: `F|SUB|${message.guild.id}`
        }
      }),
      logGetWhitelistError: (err) => console.log(`Error getting ${message.guild.id}'s whitelist for provider ${producer}: ${err}`),
      sendDbErrorMessage: () => message.channel.send(`There was an error getting \`${message.guild.name}'s\` whitelist settings for \`${producer}\`. Please try again later.`),
      sendSubDoesNotExistMessage: () => message.channel.send(`\`${producer}\` is not in server \`${message.guild.name}\`'s notifications feed.`)
    });
  }
};