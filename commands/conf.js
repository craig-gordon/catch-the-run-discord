const { inspect } = require('util');

/*
FOR GUILD SETTINGS SEE set.js !
This command is used to modify the bot's default configuration values, which affects all guilds.
*/

exports.run = async (client, message, [action, key, ...value], level) => {
  const defaults = client.settings.get('default');

  if (action === 'add') {
    if (!key) {
      return message.reply('Please specify a key to add');
    }
    if (defaults[key]) {
      return message.reply('This key already exists in the default settings');
    }
    if (value.length < 1) {
      return message.reply('Please specify a value');
    }

    // `value` being an array, we need to join it first.
    defaults[key] = value.join(' ');

    client.settings.set('default', defaults);
    message.reply(`${key} successfully added with the value of ${value.join(' ')}`);
  }

  // Changing the default value of a key only modified it for guilds that did not change it to another value.
  else if (action === 'edit') {
    if (!key) return message.reply('Please specify a key to edit');
    if (!defaults[key])
      return message.reply('This key does not exist in the settings');
    if (value.length < 1) return message.reply('Please specify a new value');

    defaults[key] = value.join(' ');

    client.settings.set('default', defaults);
    message.reply(`${key} successfully edited to ${value.join(' ')}`);
  }

  // WARNING: DELETING A KEY FROM THE DEFAULTS ALSO REMOVES IT FROM EVERY GUILD
  // MAKE SURE THAT KEY IS REALLY NO LONGER NEEDED!
  else if (action === 'del') {
    if (!key) return message.reply('Please specify a key to delete.');
    if (!defaults[key])
      return message.reply('This key does not exist in the settings');

    // Throw the 'are you sure?' text at them.
    const response = await client.awaitReply(
      message,
      `Are you sure you want to permanently delete ${key} from all guilds? This **CANNOT** be undone.`
    );

    // If they respond with y or yes, continue.
    if (['y', 'yes'].includes(response)) {
      // We delete the default `key` here.
      delete defaults[key];
      client.settings.set('default', defaults);

      // then we loop on all the guilds and remove this key if it exists.
      // "if it exists" is done with the filter (if the key is present and it's not the default config!)
      for (const [guildid, conf] of client.settings.filter(
        (setting, id) => setting[key] && id !== 'default'
      )) {
        delete conf[key];
        client.settings.set(guildid, conf);
      }

      message.reply(`${key} was successfully deleted.`);
    }
    // If they respond with n or no, we inform them that the action has been cancelled.
    else if (['n', 'no', 'cancel'].includes(response)) {
      message.reply('Action cancelled.');
    }
  }

  // Display a key's default value
  else if (action === 'get') {
    if (!key) return message.reply('Please specify a key to view');
    if (!defaults[key])
      return message.reply('This key does not exist in the settings');
    message.reply(`The value of ${key} is currently ${defaults[key]}`);

    // Display all default settings.
  } else {
    await message.channel.send(
      `***__Bot Default Settings__***\n\`\`\`json\n${inspect(defaults)}\n\`\`\``
    );
  }
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: ['defaults'],
  permLevel: 'Bot Admin'
};

exports.help = {
  name: 'conf',
  category: 'System',
  description: 'Modify the default configuration for all guilds.',
  usage: 'conf <view/get/edit> <key> <value>'
};
