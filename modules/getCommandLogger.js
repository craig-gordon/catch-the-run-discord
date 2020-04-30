module.exports = (logger, message, cmdType, cmdName, producer) => {
    const logRepository = {
        'server': {
            'add-to-allowlist': {
                getSubError: (err) => logger.error(`Error getting (${message.guild.id} | ${message.guild.name})'s subscription to producer ${producer}: ${err}`),
                getFeedCategoriesError: (err) => logger.error(`Error getting producer ${producer}'s feed categories: ${err}`),
                addToAllowlistError: (err) => logger.error(`Error adding to (${message.guild.id} | ${message.guild.name})'s allowlist for producer ${producer}: ${err}`)
            },
            'add': {
                getConsumerError: (err) => logger.error(`Error getting consumer record for (${message.guild.id} | ${message.guild.name}): ${err}`),
                addSubError: (err) => console.log(`Error adding producer ${producer} to (${message.guild.id} | ${message.guild.name})'s subscriptions: ${err}`)
            }
        },
        '@': {
            'add': {
                getConsumerError: (err) => logger.error(`Error getting consumer record for (${message.author.id} | ${message.author.username}): ${err}`),
                getMentionServerError: (err) => logger.error(`Error getting Discord mention server record for server (${message.guild.id} | ${message.guild.name}): ${err}`),
                addSubError: (err) => console.log(`Error adding producer ${producer} to (${message.author.id} | ${message.author.username})'s subscriptions: ${err}`)
            }
        },
        'dm': {
            'add-to-allowlist': {
                getSubError: (err) => logger.error(`Error getting (${message.author.id} | ${message.author.username})'s subscription to producer ${producer}: ${err}`),
                getFeedCategoriesError: (err) => logger.error(`Error getting producer ${producer}'s feed categories: ${err}`),
                addToAllowlistError: (err) => logger.error(`Error adding to (${message.author.id} | ${message.author.username})'s whitelist for producer ${producer}: ${err}`)
            },
            'add': {
                getConsumerError: (err) => logger.error(`Error getting consumer record for (${message.author.id} | ${message.author.username}): ${err}`),
                addSubError: (err) => console.log(`Error adding producer ${producer} to (${message.author.id} | ${message.author.username})'s subscriptions: ${err}`)
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
        getDbClientError: (err) => logger.error(`Error getting client from pg pool: ${err}`),
        getProducerError: (err) => logger.error(`Error getting producer record for ${producer}: ${err}`)
    };

    return Object.assign(logRepository[cmdType][cmdName], common);
};