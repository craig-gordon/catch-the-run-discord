module.exports = (logger, message, cmdType, cmdName, producer) => {
    const e = (...args) => logger.error(...args);

    const logRepository = {
        'server': {
            'add-to-allowlist': {
                getSubError: (err) => e(`Error getting (${message.guild.id} | ${message.guild.name})'s subscription to producer ${producer}: ${err}`),
                addToAllowlistError: (err) => e(`Error adding to (${message.guild.id} | ${message.guild.name})'s allowlist for producer ${producer}: ${err}`)
            },
            'add': {
                getConsumerError: (err) => e(`Error getting consumer record for (${message.guild.id} | ${message.guild.name}): ${err}`),
                addSubError: (err) => e(`Error adding producer ${producer} to (${message.guild.id} | ${message.guild.name})'s subscriptions: ${err}`)
            },
            'remove': {
                getConsumerError: (err) => e(`Error getting consumer record for (${message.guild.id} | ${message.guild.name}): ${err}`),
                removeSubError: (err) => e(`Error removing producer ${producer} from (${message.guild.id} | ${message.guild.name})'s subscriptions: ${err}`)
            },
            'view-feed': {

            }
        },
        '@': {
            'add': {
                getConsumerError: (err) => e(`Error getting consumer record for (${message.author.id} | ${message.author.username}): ${err}`),
                getMentionServerError: (err) => e(`Error getting Discord mention server record for server (${message.guild.id} | ${message.guild.name}): ${err}`),
                addSubError: (err) => e(`Error adding producer ${producer} to (${message.author.id} | ${message.author.username})'s subscriptions: ${err}`)
            }
        },
        'dm': {
            'add-to-allowlist': {
                getSubError: (err) => e(`Error getting (${message.author.id} | ${message.author.username})'s subscription to producer ${producer}: ${err}`),
                addToAllowlistError: (err) => e(`Error adding to (${message.author.id} | ${message.author.username})'s whitelist for producer ${producer}: ${err}`)
            },
            'add': {
                getConsumerError: (err) => e(`Error getting consumer record for (${message.author.id} | ${message.author.username}): ${err}`),
                addSubError: (err) => e(`Error adding producer ${producer} to (${message.author.id} | ${message.author.username})'s subscriptions: ${err}`)
            },
            'remove': {
                getConsumerError: (err) => e(`Error getting consumer record for (${message.author.id} | ${message.author.username}): ${err}`),
                removeSubError: (err) => e(`Error removing producer ${producer} from (${message.author.id} | ${message.author.username})'s subscriptions: ${err}`)
            },
            'view-feed': {
                
            }
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
        getDbClientError: (err) => e(`Error getting client from pg pool: ${err}`),
        getProducerError: (err) => e(`Error getting producer record for ${producer}: ${err}`),
        getFeedCategoriesError: (err) => e(`Error getting producer ${producer}'s feed categories: ${err}`)
    };

    return Object.assign(logRepository[cmdType][cmdName], common);
};