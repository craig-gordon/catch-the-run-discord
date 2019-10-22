module.exports = async client => {
  client.logger.log(
    `${client.user.tag}, ready to serve ${client.users.size} users in ${client.guilds.size} servers.`,
    'ready'
  );
};
