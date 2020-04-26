module.exports = (client, guild) => client.logger.info(
  `[JOIN SERVER] ${guild.name} (${guild.id}) added the bot. Owner: ${guild.owner.user.tag} (${guild.owner.user.id})`
);
