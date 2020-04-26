require('dotenv').config();

const Discord = require('discord.js');
const { promisify } = require('util');
const Enmap = require('enmap');
const readdir = promisify(require('fs').readdir);

const client = new Discord.Client();

require('./modules/functions.js')(client);
require('./server')(client);

client.config = require('./config.js');
client.logger = require('./modules/logger');
client.commands = new Enmap();
client.aliases = new Enmap();
client.settings = new Enmap({ name: 'settings' });

(async () => {
  const cmdFiles = await readdir('./commands/');
  client.logger.info(`Loading a total of ${cmdFiles.length} commands.`);
  cmdFiles.forEach(f => {
    if (!f.endsWith('.js')) return;
    const response = client.loadCommand(f);
    if (response) console.log(response);
  });

  const evtFiles = await readdir('./events/');
  client.logger.info(`Loading a total of ${evtFiles.length} events.`);
  evtFiles.forEach(file => {
    const eventName = file.split('.')[0];
    client.logger.info(`Loading Event: ${eventName}`);
    const event = require(`./events/${file}`);
    client.on(eventName, event.bind(null, client));
  });

  client.levelCache = {};

  for (let i = 0; i < client.config.permLevels.length; i++) {
    const thisLevel = client.config.permLevels[i];
    client.levelCache[thisLevel.name] = thisLevel.level;
  }

  client.login(client.config.token);
})();

global.PRODUCT_NAME = 'Catch The Run';