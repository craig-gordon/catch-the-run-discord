module.exports = (message, cmdType, cmdName, producer) => {
    const messageRepository = {
        'server': {
            'add-to-allowlist': {
                dbError: () => message.channel.send(`An error occurred adding items to \`${message.guild.name}\`'s allowlist for \`${producer}\`. Please try again later.`),
                subDoesNotExist: () => message.channel.send(`Server \`${message.guild.name}\` is not subscribed to \`${producer}\`.`),
                addToAllowlistSuccess: (newItemsCount) => message.channel.send(`Successfully added \`${newItemsCount}\` items to \`${message.guild.name}'s\` allowlist for \`${producer}\`.`)
            }
        },
        '@': {
    
        },
        'dm': {
            'add-to-allowlist': {
                dbError: () => message.channel.send(`An error occurred adding items to your allowlist for \`${producer}\`. Please try again later.`),
                subDoesNotExist: () => message.channel.send(`You are not subscribed to \`${producer}\` through Discord.`),
                addToAllowlistSuccess: (newItemsCount) => message.channel.send(`Successfully added \`${newItemsCount}\` items to your allowlist for \`${producer}\`.`)
            }
        }
    };

    const common = {
        noProducerSpecified: () => message.channel.send(`No streamer was specified.`),
        noAllowlistItemsSpecified: () => message.channel.send(`No allowlist items were specified.`)
    };

    return Object.assign(messageRepository[cmdType][cmdName], common);
};