const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const Discord = require('discord.js');
const DynamoDB = require('aws-sdk/clients/dynamodb');

module.exports = discordClient => {
  const server = express();
  server.use(bodyParser.json());

  server.post('/event', async (req, res) => {
    const { ProviderName, Message, Category } = req.body;

    const dynamoClient = new DynamoDB.DocumentClient({
      endpoint: 'https://dynamodb.us-east-1.amazonaws.com',
      accessKeyId: 'AKIAYGOXM6CJTCGJ5S5Z',
      secretAccessKey: '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',
      region: 'us-east-1'
    });

    const params = {
      TableName: 'Main',
      KeyConditionExpression: 'PRT = :PRT and begins_with(SRT, :SRT)',
      ExpressionAttributeValues: {
        ':PRT': `${ProviderName}|DC`,
        ':SRT': 'F|SUB'
      }
    };

    /**
     * {
     *   serverId: '<@userId> <@userId>',
     *   serverId: '<@userId> <@userId>'
     * }
     */

    const lookup = {};

    try {
      const subs = (await dynamoClient.query(params).promise()).Items;
      subs.forEach(sub => {
        const subType = sub.DCType;

        if (subType === 'DM') {
          checkAgainstFilter(Category, sub.Filter) ? discordClient.users.get(sub.SRT.split('|')[2]).send(Message) : null;
        } else {
          const [FConst, SUBConst, serverId, userId] = sub.SRT.split('|');

          if (lookup[serverId]) {
            if (subType === '@') {
              checkAgainstFilter(Category, sub.Filter) ? lookup[serverId] += ` <@${userId}>` : null;
            }
          } else {
            if (subType === '@') {
              checkAgainstFilter(Category, sub.Filter) ? lookup[serverId] = ` <@${userId}>` : null;
            } else {
              checkAgainstFilter(Category, sub.Filter) ? lookup[serverId] = '' : null;
            }
          }
        }
      });

      for (const serverId in lookup) {
        const channelId = discordClient.settings.get(serverId, 'channel');
        discordClient.channels.get(channelId).send(Message + lookup[serverId]);
      }

      console.log('finished sending notifications');
    } catch (e) {
      console.log('error sending notifications:', e);
    }
  });

  server.listen(4000, () => console.log('Bot serving requests on port 4000'));
};

const checkAgainstFilter = (category, filter) => {
  if (filter === undefined) return true;

  const gameTitle = category.slice(0, category.indexOf('_'));

  if (filter.Type === 'B') { // blacklist
    for (const filterGame of filter.Games.values) {
      if (gameTitle === filterGame) return false;
    }

    for (const filterCategory of filter.Categories.values) {
      if (category === filterCategory) return false;
    }

    return true;
  }

  else { // whitelist
    for (const filterGame of filter.Games.values) {
      if (gameTitle === filterGame) return true;
    }

    for (const filterCategory of filter.Categories.values) {
      if (category === filterCategory) return true;
    }

    return false;
  }
};