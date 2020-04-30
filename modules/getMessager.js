module.exports = (message, cmdType, cmdName, producer) => {
    const s = (...args) => message.channel.send(...args);

    const messageRepository = {
        'server': {
            'add-to-allowlist': {
                dbError: () => s(`An error occurred adding items to server \`${message.guild.name}\`'s allowlist for streamer \`${producer}\`. Please try again later.`),
                subDoesNotExist: () => s(`Server \`${message.guild.name}\` is not subscribed to streamer \`${producer}\`.`),
                addToAllowlistSuccess: (newItemsCount, failedInsertions = null) => s(`Successfully added \`${newItemsCount}\` items to server \`${message.guild.name}'s\` allowlist for streamer \`${producer}\`.`)
            },
            'add': {
                dbError: () => s(`An error occurred adding streamer \`${producer}\` to server \`${message.guild.name}\`'s subscriptions. Please try again later.`),
                subAlreadyExists: () => s(`Server \`${message.guild.name}\` is already subscribed to streamer \`${producer}\`.`),
                addSubSuccess: (newItemsCount = 0, failedInserts = null) => s(`Successfully added streamer \`${producer}\` to server \`${message.guild.name}'s\` subscriptions, with ${newItemsCount} allowlist items.`)
            },
            'remove': {
                dbError: () => s(`An error occurred removing streamer \`${producer}\` from server \`${message.guild.name}\`'s subscriptions. Please try again later.`),
                subDoesNotExist: () => s(`Server \`${message.guild.name}\` is not subscribed to streamer \`${producer}\`.`),
                removeSubSuccess: () => s(`Successfully removed streamer \`${producer}\` from server \`${message.guild.name}'s\` subscriptions.`)
            }
        },
        '@': {
            'add@me': {
                dbError: () => s(`\`${message.author.username}\`, an error occurred adding streamer \`${producer}\` to your mention subscriptions for server \`${message.guild.name}\`. 
                    Please try again later.`),
                subAlreadyExists: () => s(`\`${message.author.username}\`, streamer \`${producer}\` is already in your mention subscriptions for server \`${message.guild.name}\`.`),
                addSubSuccess: (newItemsCount = 0, failedInserts = null) => s(`\`${message.author.username}\`, successfully added streamer \`${producer}\` to your mention subscriptions for server \`${message.guild.name}\`, 
                    with ${newItemsCount} allowlist items.`)
            }
        },
        'dm': {
            'add-to-allowlist': {
                dbError: () => s(`An error occurred adding items to your allowlist for streamer \`${producer}\`. Please try again later.`),
                subDoesNotExist: () => s(`You are not subscribed to streamer \`${producer}\` through Discord.`),
                addToAllowlistSuccess: (newItemsCount, failedInsertions = null) => s(`Successfully added \`${newItemsCount}\` items to your allowlist for streamer \`${producer}\`.`)
            },
            'add': {
                dbError: () => s(`An error occurred adding streamer \`${producer}\` to your subscriptions. Please try again later.`),
                consumerIsProducer: () => s(`You cannot subscribe to your own feed.`),
                subAlreadyExists: () => s(`You are already subscribed to streamer \`${producer}\`.`),
                addSubSuccess: (newItemsCount = 0, failedInsertions = null) => s(`Successfully added streamer \`${producer}\` to your subscriptions, with ${newItemsCount} allowlist items.`)
            },
            'remove': {
                dbError: () => s(`An error occurred removing streamer \`${producer}\` from your subscriptions. Please try again later.`),
                consumerIsProducer: () => s(`You cannot subscribe to (or unsubscribe from) your own feed.`),
                subDoesNotExist: () => s(`You are not subscribed to streamer \`${producer}\`.`),
                removeSubSuccess: () => s(`Successfully removed streamer \`${producer}\` from your subscriptions.`)
            }
        }
    };

    const common = {
        helpDescription: (helpDescription) => s(helpDescription),
        noProducerSpecified: () => s(`No streamer was specified.`),
        noAllowlistItemsSpecified: () => s(`No allowlist items were specified.`),
        producerDoesNotExist: () => s(`Streamer \`${producer}\` is not registered with ${global.PRODUCT_NAME}.`),
        consumerDoesNotExist: () => s(`Your Discord account is not connected to ${global.PRODUCT_NAME}. Please use !connect.`)
    };

    return Object.assign(messageRepository[cmdType][cmdName], common);
};