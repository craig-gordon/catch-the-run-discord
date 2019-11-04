const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const Discord = require('discord.js');
const DynamoDB = require('aws-sdk/clients/dynamodb');

module.exports = discordClient => {
  const server = express();
  server.use(bodyParser.json());

  server.post('/event', async (req, res) => {
    const { ProviderName, Message } = req.body;

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
          discordClient.users.get(sub.SRT.split('|')[2]).send(Message);
        } else {
          const [FConst, SUBConst, serverId, userId] = sub.SRT.split('|');

          if (lookup[serverId]) {
            if (subType === '@') {
              lookup[serverId] += ` <@${userId}>`;
            }
          } else {
            if (subType === '@') lookup[serverId] = ` <@${userId}>`;
            else lookup[serverId] = '';
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
}