module.exports = (message, cmdType, cmdName, producer) => {
    const messageRepository = {
        'server': {
            'add-to-allowlist': {
                dbError: () =>
                    message.channel.send(`An error occurred adding items to server \`${message.guild.name}\`'s allowlist for streamer \`${producer}\`. Please try again later.`),
                subDoesNotExist: () =>
                    message.channel.send(`Server \`${message.guild.name}\` is not subscribed to streamer \`${producer}\`.`),
                addToAllowlistSuccess: (newItemsCount, failedInsertions = null) =>
                    message.channel.send(`Successfully added \`${newItemsCount}\` items to server \`${message.guild.name}'s\` allowlist for streamer \`${producer}\`.`)
            },
            'add': {
                dbError: () =>
                    message.channel.send(`An error occurred adding streamer \`${producer}\` to server \`${message.guild.name}\`'s subscriptions. Please try again later.`),
                subAlreadyExists: () =>
                    message.channel.send(`Server \`${message.guild.name}\` is already subscribed to streamer \`${producer}\`.`),
                addSubSuccess: (newItemsCount = 0, failedInserts = null) =>
                    message.channel.send(`Successfully added streamer \`${producer}\` to server \`${message.guild.name}'s\` subscriptions, with ${newItemsCount} allowlist items.`)
            }
        },
        '@': {
            'add@me': {
                dbError: () =>
                    message.channel.send(`\`${message.author.username}\`, an error occurred adding streamer \`${producer}\` to your mention subscriptions for server \`${message.guild.name}\`. 
                    Please try again later.`),
                subAlreadyExists: () =>
                    message.channel.send(`\`${message.author.username}\`, streamer \`${producer}\` is already in your mention subscriptions for server \`${message.guild.name}\`.`),
                addSubSuccess: (newItemsCount = 0, failedInserts = null) =>
                    message.channel.send(`\`${message.author.username}\`, successfully added streamer \`${producer}\` to your mention subscriptions for server \`${message.guild.name}\`, 
                    with ${newItemsCount} allowlist items.`)
            }
        },
        'dm': {
            'add-to-allowlist': {
                dbError: () =>
                    message.channel.send(`An error occurred adding items to your allowlist for streamer \`${producer}\`. Please try again later.`),
                subDoesNotExist: () =>
                    message.channel.send(`You are not subscribed to streamer \`${producer}\` through Discord.`),
                addToAllowlistSuccess: (newItemsCount, failedInsertions = null) =>
                    message.channel.send(`Successfully added \`${newItemsCount}\` items to your allowlist for streamer \`${producer}\`.`)
            },
            'add': {
                dbError: () =>
                    message.channel.send(`An error occurred adding streamer \`${producer}\` to your subscriptions. Please try again later.`),
                subAlreadyExists: () =>
                    message.channel.send(`You are already subscribed to streamer \`${producer}\`.`),
                addSubSuccess: (newItemsCount = 0, failedInsertions = null) =>
                    message.channel.send(`Successfully added streamer \`${producer}\` to your subscriptions, with ${newItemsCount} allowlist items.`)
            }
        }
    };

    const common = {
        noProducerSpecified: () => message.channel.send(`No streamer was specified.`),
        noAllowlistItemsSpecified: () => message.channel.send(`No allowlist items were specified.`),
        producerDoesNotExist: () => message.channel.send(`\`${producer}\` is not registered with ${global.PRODUCT_NAME}.`)
    };

    return Object.assign(messageRepository[cmdType][cmdName], common);
};