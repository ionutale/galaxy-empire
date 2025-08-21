import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

const transport = isDev
  ? pino.transport({
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' }
    })
  : undefined;

const logger = transport
  ? pino({ level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info') }, transport)
  : pino({ level: process.env.LOG_LEVEL ?? 'info' });

export { logger };
export default logger;
