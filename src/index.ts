import { EventEmitter } from 'node:events';
import * as Ignite from 'apache-ignite-client';
import * as loggerModule from '@koopjs/logger';
import config from 'config';

const IgniteClient = Ignite.default;
const { default: Logger } = loggerModule;
const CacheConfiguration = Ignite.CacheConfiguration;
const ObjectType = Ignite.ObjectType;
const IgniteClientConfiguration = Ignite.IgniteClientConfiguration;

type KeyVal = Record<string, any>;

export interface iCacheParams {
  logger?: any;
  options?: any;
}

export class Cache extends EventEmitter {
  static pluginName = 'Apache Ignite Cache';
  static type = 'cache';
  private logger;
  private cache;
  private config;

  constructor(params: iCacheParams = {}) {
    super();
    this.logger = params.logger || new Logger();
    this.config = config.has('apacheIgnite')
      ? config.get<any>('apacheIgnite')
      : {};

    const igniteClient = new IgniteClient();
    const connStr =
      params.options?.connStr || this.config.connStr || '127.0.0.1:10800';
    const cacheName =
      params.options?.cacheName || this.config.cacheName || 'koop-cache';
    const igniteClientConfig = new IgniteClientConfiguration(connStr);

    igniteClient
      .connect(igniteClientConfig)
      .then(() => {
        const cacheConfig = new CacheConfiguration();
        return igniteClient.getOrCreateCache(cacheName, cacheConfig);
      })
      .then((cache) => {
        this.cache = cache;
        this.cache.setKeyType(ObjectType.PRIMITIVE_TYPE.STRING);
        this.logger.info(
          `apache-ignite connection established, "${cacheName}" ready`,
        );
        this.emit('apache-connected');
        return;
      })
      .catch((error) => {
        this.logger.error(`could not establish apache-ignite connection`);
        this.logger.error(error);
        this.emit('error', error);
      });
  }

  async insert(key: string, data: KeyVal, options: KeyVal): Promise<void> {
    if (!options.ttl) {
      return;
    }

    const cacheEntry = {
      data,
      expires: Date.now() + options.ttl * 1000,
    };

    return this.cache.put(key, JSON.stringify(cacheEntry));
  }

  async retrieve(key: string): Promise<KeyVal> {
    const stringVal = await this.cache.get(key);

    if (stringVal) {
      const val = JSON.parse(stringVal);

      if (Date.now() > val.expires) {
        await this.cache.removeKey(key);
        return null;
      }

      return val.data;
    }

    return null;
  }

  async delete(key: string): Promise<void> {
    return this.cache.removeKey(key);
  }
}
