const { createLogger, format, transports } = require('winston');
const { combine, colorize, json, prettyPrint, timestamp, splat, printf } = format;
require('winston-daily-rotate-file');

const { NODE_ENV } = process.env;

const logFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${message}`;
});

const logger = new createLogger({
  level: 'debug',
  exitOnError: false,
  format: combine(
    colorize(),
    timestamp({format: 'MM-DD-YYYY H:mm:ss'}),
    prettyPrint(),
    json(),
    splat(),
    logFormat,
  )
});

if (NODE_ENV === 'dev') {
  logger.add(
    new (transports.Console)()
  )
}

if (NODE_ENV === 'prod') {
  //
}

module.exports = logger;