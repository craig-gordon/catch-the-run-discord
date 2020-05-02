module.exports = (message, cmdType, cmdName, producer) => {
    const send = (...args) => message.channel.send(...args);

    const messageRepository = {
        'server': {
            'add-to-allowlist': {
                dbError: () => send(`An error occurred adding items to server \`${message.guild.name}\`'s allowlist for streamer \`${producer}\`. Please try again later.`),
                subDoesNotExist: () => send(`Server \`${message.guild.name}\` is not subscribed to streamer \`${producer}\`.`),
                addToAllowlistSuccess: (newItemsCount, failedInsertions = null) => send(`Successfully added \`${newItemsCount}\` items to server \`${message.guild.name}'s\` allowlist for streamer \`${producer}\`.`)
            },
            'add': {
                dbError: () => send(`An error occurred adding streamer \`${producer}\` to server \`${message.guild.name}\`'s subscriptions. Please try again later.`),
                subAlreadyExists: () => send(`Server \`${message.guild.name}\` is already subscribed to streamer \`${producer}\`.`),
                addSubSuccess: (newItemsCount = 0, failedInserts = null) =>
                    send(`Successfully added streamer \`${producer}\` to server \`${message.guild.name}'s\` subscriptions, including \`${newItemsCount}\` allowlist items.${failedInserts && Object.keys(failedInserts).length > 0 ? ` The following items were invalid: ${Object.keys(failedInserts).map(item => `\`${item}\``).join(', ')}` : ''}`)
            },
            'remove': {
                dbError: () => send(`An error occurred removing streamer \`${producer}\` from server \`${message.guild.name}\`'s subscriptions. Please try again later.`),
                subDoesNotExist: () => send(`Server \`${message.guild.name}\` is not subscribed to streamer \`${producer}\`.`),
                removeSubSuccess: () => send(`Successfully removed streamer \`${producer}\` from server \`${message.guild.name}'s\` subscriptions.`)
            },
            'set-channel': {
                noChannelSpecified: () => send(`Please specify a channel name.`),
                existingChannelSpecified: (channel) => send(`Notifications are already being posted in channel ${channel}.`),
                setChannelSuccess: (channel) => send(`Notifications will now be posted in channel ${channel}.`),
                channelDoesNotExist: (channel) => send(`Channel name \`${channel}\` did not match any of the channels in this server.`)
            },
            'view-feed': {
                dbError: () => send(`An error occurred displaying the games and categories in streamer \`${producer}\`'s feed. Please try again later.`),
                displayFeed: (feed) => send(feed, { code: 'asciidoc' })
            }
        },
        '@': {
            'add@me': {
                dbError: () => send(`\`${message.author.username}\`, an error occurred adding streamer \`${producer}\` to your mention subscriptions for server \`${message.guild.name}\`. 
                    Please try again later.`),
                subAlreadyExists: () => send(`\`${message.author.username}\`, streamer \`${producer}\` is already in your mention subscriptions for server \`${message.guild.name}\`.`),
                addSubSuccess: (newItemsCount = 0, failedInserts = null) => send(`\`${message.author.username}\`, successfully added streamer \`${producer}\` to your mention subscriptions for server \`${message.guild.name}\`, 
                    with ${newItemsCount} allowlist items.`)
            }
        },
        'dm': {
            'add-to-allowlist': {
                dbError: () => send(`An error occurred adding items to your allowlist for streamer \`${producer}\`. Please try again later.`),
                subDoesNotExist: () => send(`You are not subscribed to streamer \`${producer}\` through Discord.`),
                addToAllowlistSuccess: (newItemsCount, failedInsertions = null) => send(`Successfully added \`${newItemsCount}\` items to your allowlist for streamer \`${producer}\`.`)
            },
            'add': {
                dbError: () => send(`An error occurred adding streamer \`${producer}\` to your subscriptions. Please try again later.`),
                consumerIsProducer: () => send(`You cannot subscribe to your own feed.`),
                subAlreadyExists: () => send(`You are already subscribed to streamer \`${producer}\`.`),
                addSubSuccess: (newItemsCount = 0, failedInsertions = null) => send(`Successfully added streamer \`${producer}\` to your subscriptions, with ${newItemsCount} allowlist items.`)
            },
            'remove': {
                dbError: () => send(`An error occurred removing streamer \`${producer}\` from your subscriptions. Please try again later.`),
                consumerIsProducer: () => send(`You cannot subscribe to (or unsubscribe from) your own feed.`),
                subDoesNotExist: () => send(`You are not subscribed to streamer \`${producer}\`.`),
                removeSubSuccess: () => send(`Successfully removed streamer \`${producer}\` from your subscriptions.`)
            },
            'set-channel': {

            },
            'view-feed': {
                dbError: () => send(`An error occurred displaying the games and categories in streamer \`${producer}\`'s feed. Please try again later.`),
                displayFeed: (feed) => send(feed, { code: 'asciidoc' })
            }
        }
    };

    const common = {
        noProducerSpecified: () => send(`Please specify a streamer.`),
        noAllowlistItemsSpecified: () => send(`Please specify one or more allowlist items.`),
        producerDoesNotExist: () => send(`Streamer \`${producer}\` is not registered with ${global.PRODUCT_NAME}.`),
        consumerDoesNotExist: () => send(`Your Discord account is not connected to ${global.PRODUCT_NAME}. Please use the !connect command.`)
    };

    return Object.assign(messageRepository[cmdType][cmdName], common);
};