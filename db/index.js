require('dotenv').config();
const { Pool } = require('pg');
const logger = require('../modules/logger');

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

const getDbClient = (callback) => {
    pool.connect((err, client, done) => {
        const query = client.query;

        client.query = (...args) => {
            client.lastQuery = args;
            return query.apply(client, args);
        };

        const timeout = setTimeout(() => {
            console.error('A client has been checked out for more than 5 seconds!');
            console.error(`The last executed query on this client was: ${client.lastQuery}`);
        }, 5000);
        
        const release = (err) => {
            done(err);
            clearTimeout(timeout);
            client.query = query;
        };

        callback(err, client, release);
    });
}

const getSub = (consumerDiscordId, producerTwitchName, domain, type, client = null) => {
    return (client || pool).query(
        `SELECT sub.id, sub.allowlist, consumer.discord_id, producer.twitch_name
        FROM subscription AS sub
        INNER JOIN app_user AS consumer ON sub.consumer_id = consumer.id
        INNER JOIN app_user AS producer ON sub.producer_id = producer.id
        WHERE consumer.discord_id = $1 AND producer.twitch_name = $2 AND sub_domain = $3 AND discord_sub_type = $4`,
        [consumerDiscordId, producerTwitchName, domain, type]
    );
};

const getFeedCategories = (producerTwitchName, client = null) => {
    return (client || pool).query(
        `SELECT cat.name, game.title
        FROM category AS cat
        INNER JOIN feed_category AS fc ON cat.id = fc.category_id 
        INNER JOIN app_user AS producer ON fc.producer_id = producer.id 
        INNER JOIN game ON game.id = cat.game_id 
        WHERE producer.twitch_name = $1`,
        [producerTwitchName]
    );
};

const addToAllowlist = (subId, items, client = null) => {
    return (client || pool).query(
        `UPDATE subscription
        SET allowlist = allowlist || '$2'
        where id = $1`,
        [subId, items]
    );
};

const removeFromAllowlist = (subId, items, client = null) => {
    return (client || pool).query(
        `UPDATE subscription
        SET allowlist = allowlist - '$2'::text[]
        where id = $1`,
        [subId, items]
    );
};

module.exports = {
    getDbClient,
    getSub,
    getFeedCategories,
    addToAllowlist,
    removeFromAllowlist
};