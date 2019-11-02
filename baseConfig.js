const config = {
  ownerID: process.env.ownerID,
  admins: [],
  support: [],
  token: process.env.botToken,

  // DO NOT LEAVE ANY OF THESE BLANK, AS YOU WILL NOT BE ABLE TO UPDATE THEM
  // VIA COMMANDS IN THE GUILD.

  defaultSettings: {
    prefix: '!',
    modLogChannel: 'mod-log',
    modRole: 'Moderator',
    adminRole: 'Administrator',
    systemNotice: 'true', // This gives a notice when a user tries to run a command that they do not have permission to use.
    welcomeEnabled: 'false'
  },

  permLevels: [
    {
      level: 0,
      name: 'User',
      check: () => true
    },
    {
      level: 2,
      name: 'Moderator',
      // The following lines check the guild the message came from for the roles.
      // Then it checks if the member that authored the message has the role.
      // If they do return true, which will allow them to execute the command in question.
      // If they don't then return false, which will prevent them from executing the command.
      check: message => {
        try {
          const modRole = message.guild.roles.find(
            r => r.name.toLowerCase() === message.settings.modRole.toLowerCase()
          );
          if (modRole && message.member.roles.has(modRole.id)) return true;
        } catch (e) {
          return false;
        }
      }
    },

    {
      level: 3,
      name: 'Administrator',
      check: message => {
        try {
          const adminRole = message.guild.roles.find(
            r =>
              r.name.toLowerCase() === message.settings.adminRole.toLowerCase()
          );
          return adminRole && message.member.roles.has(adminRole.id);
        } catch (e) {
          return false;
        }
      }
    },
    {
      level: 4,
      name: 'Server Owner',
      check: message =>
        message.channel.type === 'text'
          ? message.guild.ownerID === message.author.id
            ? true
            : false
          : false
    },
    {
      level: 8,
      name: 'Bot Support',
      check: message => config.support.includes(message.author.id)
    },
    {
      level: 9,
      name: 'Bot Admin',
      check: message => config.admins.includes(message.author.id)
    },
    {
      level: 10,
      name: 'Bot Owner',
      check: message => message.client.config.ownerID === message.author.id
    }
  ]
};

module.exports = config;
