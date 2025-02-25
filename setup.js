const Enmap = require('enmap');
const inquirer = require('inquirer');
const fs = require('fs');

let baseConfig = fs.readFileSync('./baseConfig.txt', 'utf8');

const defaultSettings = {
  prefix: '!',
  modLogChannel: 'mod-log',
  modRole: 'Moderator',
  adminRole: 'Administrator',
  systemNotice: 'true',
  welcomeEnabled: 'false'
};

const settings = new Enmap({
  name: 'settings',
  cloneLevel: 'deep',
  ensureProps: true
});

let prompts = [
  {
    type: 'list',
    name: 'resetDefaults',
    message: 'Do you want to reset default settings?',
    choices: ['Yes', 'No']
  },
  {
    type: 'input',
    name: 'token',
    message: 'Please enter the bot token from the application page.'
  },
  {
    type: 'input',
    name: 'ownerID',
    message: "Please enter the bot owner's User ID"
  }
];

(async () => {
  console.log('Setting up bot configuration');
  await settings.defer;
  if (!settings.has('default')) {
    prompts = prompts.slice(1);
    console.log('First Start! Inserting default guild settings in the database');
    await settings.set('default', defaultSettings);
  }

  const answers = await inquirer.prompt(prompts);

  if (answers.resetDefaults && answers.resetDefaults === 'Yes') {
    console.log('Resetting default guild settings...');
    await settings.set('default', defaultSettings);
  }

  baseConfig = baseConfig
    .replace('{{ownerID}}', answers.ownerID)
    .replace('{{token}}', `"${answers.token}"`);

  fs.writeFileSync('./config.js', baseConfig);
  console.log('REMEMBER TO NEVER SHARE YOUR TOKEN WITH ANYONE!');
  console.log('Configuration has been written, enjoy!');
  await settings.close();
})();
