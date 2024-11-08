import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { ThrottlerModuleOptions } from '@nestjs/throttler';
import * as config from 'config';

const throttleConfigVariables = {
  throttle:
  {
    global:
    {
      ttl: 60,
      limit: 60
    }
  }
}

const redisConfig = config.get('queue');
const throttleConfig: ThrottlerModuleOptions = {
  ttl: 60,
  limit: 60,
  storage: new ThrottlerStorageRedisService({
    host: 'redis',
    port: 6379,
    password: ''
  })
};

export = throttleConfig;
