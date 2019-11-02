module.exports = (client, guild) => client.logger.cmd(
  `[JOIN SERVER] ${guild.name} (${guild.id}) added the bot. Owner: ${guild.owner.user.tag} (${guild.owner.user.id})`
);
