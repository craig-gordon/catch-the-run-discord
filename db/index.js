require('dotenv').config();
const { Pool } = require('pg');
const logger = require('../modules/baseLogger');

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

const UNIQUE_VIOLATION_CODE = '23505';

const getDbClient = () => pool.connect();

const getProducer = (producerTwitchName, client = null) => {
    return (client || pool).query(
        `SELECT producer.id, producer.twitch_name
        FROM app_user AS producer
        WHERE producer.twitch_name = $1`,
        [producerTwitchName]
    );
};

const getConsumer = (consumerDiscordId, client = null) => {
    return (client || pool).query(
        `SELECT consumer.id, consumer.discord_name, consumer.discord_id
        FROM app_user AS consumer
        WHERE consumer.discord_id = $1`,
        [consumerDiscordId]
    );
};

const getSub = (consumerDiscordId, producerTwitchName, domain, type, client = null) => {
    return (client || pool).query(
        `SELECT sub.id, sub.allowlist, consumer.discord_id, producer.twitch_name
        FROM subscription AS sub
        INNER JOIN app_user AS consumer ON sub.consumer_id = consumer.id
        INNER JOIN app_user AS producer ON sub.producer_id = producer.id
        WHERE consumer.discord_id = $1 AND producer.twitch_name = $2 AND subscription_domain = $3 AND discord_subscription_type = $4`,
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

const addSub = (consumerId, producerId, discordMentionServerId, domain, type, endpoint, allowlist, client = null) => {
    return (client || pool).query(
        `INSERT INTO subscription (consumer_id, producer_id, discord_mention_server_id, subscription_domain, discord_subscription_type, endpoint, allowlist, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, to_timestamp(${Date.now() / 1000.0}))`,
        [consumerId, producerId, discordMentionServerId, domain, type, endpoint, allowlist]
    );
}

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
    UNIQUE_VIOLATION_CODE,
    getDbClient,
    getProducer,
    getConsumer,
    getSub,
    getFeedCategories,
    addSub,
    addToAllowlist,
    removeFromAllowlist
};