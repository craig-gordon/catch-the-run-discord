module.exports = (logger, message, cmdType, cmdName, producer) => {
    const logRepository = {
        'server': {
            'add-to-allowlist': {
                getSubError: (err) => logger.error(`Error getting ${message.author.id}'s subscription to provider ${producer}: ${err}`),
                getFeedCategoriesError: (err) => logger.error(`Error getting producer ${producer}'s feed categories: ${err}`),
                addToAllowlistError: (err) => logger.error(`Error adding to ${message.author.id}'s allowlist for producer ${producer}: ${err}`)
            }
        },
        '@': {
    
        },
        'dm': {
            'add-to-allowlist': {
                getSubError: (err) => logger.error(`Error getting ${message.author.id}'s subscription to producer ${producer}: ${err}`),
                getFeedCategoriesError: (err) => logger.error(`Error getting producer ${producer}'s feed categories: ${err}`),
                addToAllowlistError: (err) => logger.error(`Error adding to ${message.author.id}'s whitelist for producer ${producer}: ${err}`)
            }
        }
    };

    const common = {
    };

    return Object.assign(logRepository[cmdType][cmdName], common);
};