const winston = require('winston');
require('winston-daily-rotate-file');
const CloudWatchTransport = require('winston-aws-cloudwatch');

var NODE_ENV = process.env.NODE_ENV || 'dev';

const logger = new winston.createLogger({
  level: 'debug',
  exitOnError: false
});

var config = {
  logGroupName: 'my-log-group',
  logStreamName: NODE_ENV,
  createLogGroup: false,
  createLogStream: true,
  awsConfig: {
    accessKeyId: process.env.CLOUDWATCH_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDWATCH_SECRET_ACCESS_KEY,
    region: process.env.CLOUDWATCH_REGION
  },
  formatLog: item => `${item.level}: ${item.message} ${JSON.stringify(item.meta)}`
}

if (NODE_ENV === 'dev') {
  logger.add(
    new (winston.transports.Console)({
      timestamp: true,
      colorize: true
    })
  )
}

if (NODE_ENV === 'prod') {
  logger.add(CloudWatchTransport, config);
}

logger.stream = {
  write: function(message, encoding) {
    logger.info(message);
  }
};

module.exports = logger;