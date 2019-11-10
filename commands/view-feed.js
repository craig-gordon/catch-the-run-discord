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

  const getFeedQueryParams = {
    TableName: 'Main',
    KeyConditionExpression: 'PRT = :PRT AND begins_with(SRT, :SRT)',
    ExpressionAttributeValues: {
      ':PRT': twitchUsername,
      ':SRT': 'F|CAT'
    }
  };

  try {
    const dbRes = await dynamoClient.query(getFeedQueryParams).promise();

    if (dbRes.Items.length > 0) {
      return message.channel.send(
        formatFeedItems(dbRes.Items),
        { code: 'asciidoc' }
      );
    } else {
      return message.reply(`The specified streamer does not have a notifications feed. This command takes case-sensitive input. Example format: "!remove bAsEdUrNgOd333221"`);
    }
  } catch (e) {
    return message.reply(`There was an error getting ${twitchUsername}'s feed. Please try again later.`);
  }
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: [],
  permLevel: 'User'
};

exports.help = {
  name: 'view-feed',
  category: 'Information',
  description: `Displays the games & categories in the specified streamer's feed.`,
  usage: 'view-feed [streamer twitch username]'
};

const formatFeedItems = dbCategoryItems => {
  const games = [];

  const rawCategories = dbCategoryItems.map(item => item.SRT.split('|')[2]);

  rawCategories.forEach(category => {
    const [gameTitle, categoryName] = category.split('_');

    const idx = games.reduce((idx, currGame, currIdx) => {
      if (currGame.title === gameTitle) idx = currIdx;
      return idx;
    }, -1);

    if (idx === -1) {
      games.push({
        title: gameTitle,
        categories: [categoryName]
      });
    } else {
      games[idx].categories.push(categoryName);
    }
  });

  let output = '';

  games.forEach(game => {
    output += `- ${game.title}\n`;
    game.categories.forEach(cat => output += `\t- ${cat}\n`);
    output += '\n';
  });

  return output;
};