const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const Discord = require('discord.js');
const DynamoDB = require('aws-sdk/clients/dynamodb');

const server = express();
server.use(bodyParser.json());

server.post('/event', async (req, res) => {
  console.log('req.body:', req.body);

  const dynamoClient = new DynamoDB({
    endpoint: 'https://dynamodb.us-east-1.amazonaws.com',
    accessKeyId: 'AKIAYGOXM6CJTCGJ5S5Z',
    secretAccessKey: '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',
    region: 'us-east-1'
  });

  const params = {
    TableName: 'Main',
    KeyConditionExpression: 'PRT = :PRT and SRT = :SRT',
    ExpressionAttributeValues: {
      ':PRT': req.body.ProviderName,
      ':SRT': 'F|SUB|DC'
    }
  };

  /**
   * {
   *   serverId: '<@userId> <@userId>',
   *   serverId: '<@userId> <@userId>'
   * }
   */

  const discordClient = new Discord.Client();

  const lookup = {};

  try {
    const dcSubs = (await dynamoClient.query(params).promise()).Items;
    dcSubs.forEach(sub => {
      const subType = sub.DCType;

      if (subType === 'DM') {
        const dmChannel = discordClient.channels.get(sub.SRT.split('|')[2]);
        dmChannel.send('test');
      } else {
        const [fConst, sConst, serverId, userId] = sub.SRT.split('|');

        if (lookup[serverId]) {
          if (subType === '@') lookup[serverId].push(userId);
        } else {
          if (subType === '@') lookup[serverId] = [userId];
          else lookup[serverId] = [];
        }
      }
    });

    for (const serverId in lookup) {
      const channelId = discordClient.settings.get(serverId, 'channel');
      discordClient.channels.get(channelId).send('test ' + lookup[serverId]);
    }

    console.log('finished sending notifications');
  } catch (e) {
    console.log('error sending notifications:', e);
  }
});

server.listen(4000, () => console.log('Bot serving requests on port 4000'));