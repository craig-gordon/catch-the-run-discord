require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

module.exports = {
    UNIQUE_VIOLATION_CODE: '23505',

    getDbClient: () => pool.connect(),

    beginTransaction: (client) => client.query('BEGIN'),

    commitTransaction: (client) => client.query('COMMIT'),

    rollbackTransaction: (client) => client.query('ROLLBACK'),

    getProducer: (producerTwitchName, client = null) => {
        return (client || pool).query(
            `SELECT producer.id, producer.twitch_name
            FROM app_user AS producer
            WHERE producer.twitch_name = $1`,
            [producerTwitchName]
        );
    },

    getConsumer: (consumerDiscordId, client = null) => {
        return (client || pool).query(
            `SELECT consumer.id, consumer.discord_name, consumer.discord_id
            FROM app_user AS consumer
            WHERE consumer.discord_id = $1`,
            [consumerDiscordId]
        );
    },

    getSub: (consumerDiscordId, producerTwitchName, discordMentionServerId, domain, type, client = null) => {
        if (discordMentionServerId === null && type === null) {
            return (client || pool).query(
                `SELECT sub.id, sub.allowlist, consumer.discord_id, producer.twitch_name
                FROM subscription AS sub
                INNER JOIN app_user AS consumer ON sub.consumer_id = consumer.id
                INNER JOIN app_user AS producer ON sub.producer_id = producer.id
                WHERE consumer.discord_id = $1
                AND producer.twitch_name = $2
                AND subscription_domain = $3`,
                [consumerDiscordId, producerTwitchName, domain]
            );
        } else if (discordMentionServerId === null) {
            return (client || pool).query(
                `SELECT sub.id, sub.allowlist, consumer.discord_id, producer.twitch_name
                FROM subscription AS sub
                INNER JOIN app_user AS consumer ON sub.consumer_id = consumer.id
                INNER JOIN app_user AS producer ON sub.producer_id = producer.id
                WHERE consumer.discord_id = $1
                AND producer.twitch_name = $2
                AND subscription_domain = $3
                AND discord_subscription_type = $4`,
                [consumerDiscordId, producerTwitchName, domain, type]
            );
        } else {
            return (client || pool).query(
                `SELECT sub.id, sub.allowlist, consumer.discord_id, producer.twitch_name
                FROM subscription AS sub
                INNER JOIN app_user AS consumer ON sub.consumer_id = consumer.id
                INNER JOIN app_user AS producer ON sub.producer_id = producer.id
                INNER JOIN app_user AS server ON sub.discord_mention_server_id = server.id
                WHERE consumer.discord_id = $1
                AND producer.twitch_name = $2
                AND server.discord_id = $3
                AND subscription_domain = $4
                AND discord_subscription_type = $5`,
                [consumerDiscordId, producerTwitchName, discordMentionServerId, domain, type]
            );
        }
    },

    getFeedCategories: (producerTwitchName, client = null) => {
        return (client || pool).query(
            `SELECT cat.name AS category_name, game.title AS game_title, game.abbreviation AS game_abbreviation
            FROM category
            INNER JOIN feed_category AS fc ON category.id = fc.category_id 
            INNER JOIN app_user AS producer ON fc.producer_id = producer.id 
            INNER JOIN game ON game.id = category.game_id 
            WHERE producer.twitch_name = $1`,
            [producerTwitchName]
        );
    },

    addSub: (consumerId, producerId, discordMentionServerId, domain, type, endpoint, client = null) => {
        return (client || pool).query(
            `INSERT INTO subscription (consumer_id, producer_id, discord_mention_server_id, subscription_domain, discord_subscription_type, endpoint, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, to_timestamp(${Date.now() / 1000.0}))`,
            [consumerId, producerId, discordMentionServerId, domain, type, endpoint]
        );
    },

    updateAllServerSubEndpoints: (channelId, serverId, client = null) => {
        return (client || pool).query(
            `UPDATE subscription
            SET endpoint = $1
            FROM (
                SELECT sub.id AS sub_id, consumer.discord_id AS server_discord_id
                FROM subscription AS sub
                INNER JOIN app_user AS producer ON sub.producer_id = producer.id
                INNER JOIN app_user AS consumer ON sub.consumer_id = consumer.id
            ) AS extended_sub
            WHERE subscription.id = extended_sub.sub_id
            AND extended_sub.server_discord_id = $2`,
            [channelId, serverId]
        );
    },

    updateAllMentionSubEndpoints: (channelId, serverId, client = null) => {
        return (client || pool).query(
            `UPDATE subscription
            SET endpoint = $1
            FROM (
                SELECT sub.id AS sub_id, mention_server.discord_id AS server_discord_id
                FROM subscription AS sub
                INNER JOIN app_user AS producer ON sub.producer_id = producer.id
                INNER JOIN app_user AS mention_server ON sub.discord_mention_server_id = mention_server.id
            ) AS extended_sub
            WHERE subscription.id = extended_sub.sub_id
            AND extended_sub.server_discord_id = $2`,
            [channelId, serverId]
        );
    },

    removeSub: (consumerId, producerId, discordMentionServerId, domain, type, client = null) => {
        if (discordMentionServerId === null && type === null) {
            return (client || pool).query(
                `DELETE FROM subscription
                WHERE consumer_id = $1 AND producer_id = $2
                AND subscription_domain = $3`,
                [consumerId, producerId, domain]
            );
        } else if (discordMentionServerId === null) {
            return (client || pool).query(
                `DELETE FROM subscription
                WHERE consumer_id = $1 AND producer_id = $2
                AND subscription_domain = $3
                AND discord_subscription_type = $4`,
                [consumerId, producerId, domain, type]
            );
        } else {
            return (client || pool).query(
                `DELETE FROM subscription
                WHERE consumer_id = $1
                AND producer_id = $2
                AND discord_mention_server_id = $3
                AND subscription_domain = $4
                AND discord_subscription_type = $5`,
                [consumerId, producerId, discordMentionServerId, domain, type]
            );
        }
    },

    addToAllowlist: (subId, items, client = null) => {
        return (client || pool).query(
            `INSERT INTO allowlist_item (subscription_id, allow_all, game_id, category_id, created_at)
            WHERE id = $1`,
            [subId, items]
        );
    },

    removeFromAllowlist: (subId, items, client = null) => {
        return (client || pool).query(
            `DELETE subscription
            WHERE id = $1 AND `,
            [subId, items]
        );
    }
};