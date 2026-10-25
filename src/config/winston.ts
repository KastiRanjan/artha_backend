import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import { WinstonModuleOptions } from 'nest-winston';
import * as WinstonCloudWatch from 'winston-cloudwatch';

// Only enable CloudWatch if explicitly requested AND AWS region + credentials are provided
const hasCloudWatchConfig = Boolean(
  (process.env.ENABLE_CLOUDWATCH === 'true' || process.env.USE_CLOUDWATCH === 'true') &&
  (process.env.CLOUDWATCH_AWS_REGION || process.env.AWS_REGION) &&
  (process.env.AWS_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID)
);

const winstonConfig = {
  groupName: process.env.CLOUDWATCH_GROUP_NAME || 'artha',
  streamName: process.env.CLOUDWATCH_STREAM_NAME || 'artha-stream',
  awsAccessKeyId: process.env.AWS_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID || '',
  awsSecretAccessKey: process.env.AWS_KEY_SECRET || process.env.AWS_SECRET_ACCESS_KEY || '',
  awsRegion: process.env.CLOUDWATCH_AWS_REGION || process.env.AWS_REGION || '',
};

export default {
  format: winston.format.colorize(),
  exitOnError: false,
  transports: hasCloudWatchConfig
    ? new WinstonCloudWatch({
      name: 'Artha CloudWatch Logger',
      awsOptions: {
        credentials: {
          accessKeyId: winstonConfig.awsAccessKeyId,
          secretAccessKey: winstonConfig.awsSecretAccessKey,
        },
      },
      logGroupName: winstonConfig.groupName,
      logStreamName: winstonConfig.streamName,
      awsRegion: winstonConfig.awsRegion,
      messageFormatter: function (item) {
        return (
          item.level + ': ' + item.message + ' ' + JSON.stringify(item.meta)
        );
      },
    })
    : new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        nestWinstonModuleUtilities.format.nestLike('Artha Logger', {
          prettyPrint: true,
        }),
      ),
    }),
} as WinstonModuleOptions;
