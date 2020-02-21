const DynamoDB = require('aws-sdk/clients/dynamodb');

exports.run = async (client, message, args, level) => {
  const dynamoClient = new DynamoDB.DocumentClient({
    endpoint: 'https://dynamodb.us-east-1.amazonaws.com',
    accessKeyId: 'AKIAYGOXM6CJTCGJ5S5Z',
    secretAccessKey: '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',
    region: 'us-east-1'
  });

  const verbose = args[0] === 'verbose';

  const handler = getHandlerObject(message);

  const consumer = handler.getConsumer(dynamoClient);

  const allSubsQueryParams = handler.getAllSubsQueryParams(consumer);

  let allSubs;
  try {
    allSubs = (await dynamoClient.query(allSubsQueryParams).promise()).Items;
  } catch (err) {
    handler.logSubsQueryError(err);
    return handler.sendSubsQueryErrorMessage();
  }

  if (allSubs === undefined) {
    return handler.sendNoSubsExistErrorMessage();
  }

  return message.channel.send(
    handler.formatOutput(allSubs, verbose),
    { code: 'asciidoc' }
  );
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['list-streamers', 'liststreamers', 'list-players', 'listplayers'],
  permLevel: 'User'
};

exports.help = {
  name: 'list',
  category: 'Subscription Information',
  description: `Server use: Lists all streamers in a server's notifications feed. Use verbose to display the whitelist for each streamer.\n\n
  DM use: Lists all of your Discord DM subscriptions. Use verbose to display the whitelist for each streamer.`,
  usage: '!list (verbose)'
};

const getHandlerObject = (message) => {
  if (message.channel.type === 'dm') {
    return {
      getConsumer: async (dynamoClient) => {
        const CTRUsernameQueryParams = {
          TableName: 'Main',
          IndexName: 'Global1',
          KeyConditionExpression: 'SRT = :SRT and GS = :GS',
          ExpressionAttributeValues: {
            ':SRT': 'C|DC-U',
            ':GS': message.author.id
          }
        };
      
        let username, dbResponse;
        try {
          dbResponse = (await dynamoClient.query(CTRUsernameQueryParams).promise());
        } catch (e) {
          console.log(`Error getting Twitch username for user ${message.author.id}:`, e);
          return message.channel.send(`An error occurred getting your subscriptions. Please try again later.`)
        }
      
        if (dbResponse.Items.length > 0) {
          username = dbResponse.Items[0].PRT;
        }

        return username;
      },
      getAllSubsQueryParams: (consumer) => ({
        TableName: 'Main',
        IndexName: 'ConsumerProvider',
        KeyConditionExpression: 'Consumer = :Consumer',
        ExpressionAttributeValues: {
          ':Consumer': consumer
        }
      }),
      logSubsQueryError: (err) => console.log(`Error getting subscriptions for user ${message.author.id}: ${err}`),
      sendSubsQueryErrorMessage: () => message.channel.send(`An error occurred getting your Discord DM subscriptions. Please try again later.`),
      sendNoSubsExistErrorMessage: () => message.channel.send(`You are currently not subscribed to any streamers. Use !add to subscribe to a streamer.`),
      formatOutput: (subs, verbose) => {
        if (verbose) {
          return subs
            .map(sub => {
              let subType;
              if (sub.PRT.includes('PUSH')) subType = 'Push';
              else if (sub.DCType === '@') subType = 'Discord Mention';
              else if (sub.DCType === 'DM') subType = 'Discord DM';
              return `${sub.GS} [${subType}]\n${sub.IncludedGames.values.map(game => `\t- ${game}`).join('\n')}\n${sub.IncludedCategories.values.map(cat => `\t- ${cat.replace(/[_]/, ' :: ')}`).join('\n')}`;
            })
            .join('\n');
        } else {
          return subs
            .map(sub => {
              let subType;
              if (sub.PRT.includes('PUSH')) subType = 'Push';
              else if (sub.DCType === '@') subType = 'Discord Mention';
              else if (sub.DCType === 'DM') subType = 'Discord DM';
              return `${sub.GS} [${subType}]`
            })
            .join('\n');
        }
      }
    };
  } else {
    return {
      getConsumer: () => message.guild.id,
      getAllSubsQueryParams: (consumer) => ({
        TableName: 'Main',
        IndexName: 'Global1',
        KeyConditionExpression: 'SRT = :SRT',
        ExpressionAttributeValues: {
          ':SRT': `F|SUB|${consumer}`
        }
      }),
      logSubsQueryError: (err) => console.log(`Error getting subscriptions for server ${message.guild.id}: ${err}`),
      sendSubsQueryErrorMessage: () => message.channel.send(`An error occurred getting all streamers in server \`${message.guild.name}'s\` notifications feed. Please try again later.`),
      sendNoSubsExistErrorMessage: () => message.channel.send(`Server \`${message.guild.name}\` does not have any streamers in its notifications feed. Use !add to add a streamer.`),
      formatOutput: (subs, verbose) => {
        if (verbose) {
          return subs
            .map(sub => `${sub.GS}\n${sub.IncludedGames.values.map(game => `\t- ${game}`).join('\n')}\n${sub.IncludedCategories.values.map(cat => `\t- ${cat.replace(/[_]/, ' :: ')}`).join('\n')}`)
            .join('\n');
        } else {
          return subs.map(sub => sub.GS).join('\n');
        }
      }
    }
  }
};