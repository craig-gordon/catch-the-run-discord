module.exports = (logger, getCmdRepo, message, producer) => {
    const error = (...args) => logger.error(...args);

    const logRepository = {
        'server': {
            'add-to-allowlist': {
                getSubError: (err) => error(`Error getting (${message.guild.id} | ${message.guild.name})'s subscription to producer ${producer}: ${err}`),
                addToAllowlistError: (err) => error(`Error adding to (${message.guild.id} | ${message.guild.name})'s allowlist for producer ${producer}: ${err}`)
            },
            'add': {
                getConsumerError: (err) => error(`Error getting consumer record for (${message.guild.id} | ${message.guild.name}): ${err}`),
                addSubError: (err) => error(`Error adding producer ${producer} to (${message.guild.id} | ${message.guild.name})'s subscriptions: ${err}`)
            },
            'channel': {},
            'remove': {
                getConsumerError: (err) => error(`Error getting consumer record for (${message.guild.id} | ${message.guild.name}): ${err}`),
                removeSubError: (err) => error(`Error removing producer ${producer} from (${message.guild.id} | ${message.guild.name})'s subscriptions: ${err}`)
            },
            'set-channel': {
                updateServerSubEndpointsError: (err, channel) => error(`Error updating all endpoints for (${message.guild.id} | ${message.guild.name})'s subscriptions to (${channel.id} | ${channel.name}): ${err}`)
            },
            'view-feed': {}
        },
        '@': {
            'add': {
                getConsumerError: (err) => error(`Error getting consumer record for (${message.author.id} | ${message.author.username}): ${err}`),
                getMentionServerError: (err) => error(`Error getting Discord mention server record for server (${message.guild.id} | ${message.guild.name}): ${err}`),
                addSubError: (err) => error(`Error adding producer ${producer} to (${message.author.id} | ${message.author.username})'s subscriptions: ${err}`)
            }
        },
        'dm': {
            'add-to-allowlist': {
                getSubError: (err) => error(`Error getting (${message.author.id} | ${message.author.username})'s subscription to producer ${producer}: ${err}`),
                addToAllowlistError: (err) => error(`Error adding to (${message.author.id} | ${message.author.username})'s whitelist for producer ${producer}: ${err}`)
            },
            'add': {
                getConsumerError: (err) => error(`Error getting consumer record for (${message.author.id} | ${message.author.username}): ${err}`),
                addSubError: (err) => error(`Error adding producer ${producer} to (${message.author.id} | ${message.author.username})'s subscriptions: ${err}`)
            },
            'channel': {},
            'remove': {
                getConsumerError: (err) => error(`Error getting consumer record for (${message.author.id} | ${message.author.username}): ${err}`),
                removeSubError: (err) => error(`Error removing producer ${producer} from (${message.author.id} | ${message.author.username})'s subscriptions: ${err}`)
            },
            'set-channel': {},
            'view-feed': {}
        }
    };

    const common = {
        logContext: (ctx) => {
            const now = Date.now();
            ctx.elapsedExecutionTime = `${now - ctx.cmdExecutionStartTime}ms`;
            ctx.elapsedSinceMessageCreationTime = `${now - ctx.messageCreationTime}ms`;
            delete ctx.cmdExecutionStartTime;
            delete ctx.messageCreationTime;
            logger.info('%o', ctx);
        },
        getDbClientError: (err) => error(`Error getting client from pg pool: ${err}`),
        getProducerError: (err, producer) => error(`Error getting producer record for ${producer}: ${err}`),
        getFeedCategoriesError: (err, producer) => error(`Error getting producer ${producer}'s feed categories: ${err}`)
    };

    return Object.assign(common, getCmdRepo && getCmdRepo(logger));
};