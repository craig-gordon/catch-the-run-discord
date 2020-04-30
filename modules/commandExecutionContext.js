class CommandExecutionContext {
    constructor(startTime, args, message, cmdName) {
        this.args = args;
        this.messageString = message.content;
        this.cmdName = cmdName;
        this.cmdType = this.getCommandType(message);
        this.channelId = message.channel.id;
        this.callerId = message.author.id;
        this.callerUsername = message.author.username;
        this.cmdExecutionStartTime = startTime;
        this.messageCreationTime = message.createdTimestamp;

        if (this.cmdType !== 'dm') {
            this.channelName = message.channel.name;
            this.serverId = message.guild.id;
            this.serverName = message.guild.name;
        }
    }

    getCommandType(message) {
        return message.content.split(' ')[0].includes('@') ? '@' : message.channel.type === 'dm' ? 'dm' : 'server';
    }

    getConsumerDiscordId() {
        return this.cmdType === 'server' ? this.serverId : this.callerId;
    }

    endCommandExecution(dbClient, logExecutionContext, loggerErrorCallback, messagerCallback) {
        dbClient && dbClient.end();
        logExecutionContext && logExecutionContext(this);
        loggerErrorCallback && loggerErrorCallback();
        return messagerCallback && messagerCallback();
    }
};

module.exports = CommandExecutionContext;