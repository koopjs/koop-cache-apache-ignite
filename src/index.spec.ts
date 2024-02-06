import { Cache } from './';
import IgniteClient from 'apache-ignite-client';
import loggerModule from '@koopjs/logger';
import config from 'config';

jest.mock('config', () => ({
  has: () => {
    return false;
  },
}));

jest.mock('@koopjs/logger');

const mockLoggerClient = {
  info: jest.fn(),
  error: jest.fn()
}

jest.mock('@koopjs/logger', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => {
    return mockLoggerClient;
  })
}));

const mockApacheCache = {
  setKeyType: jest.fn(),
  put: jest.fn(),
  get: jest.fn(() => {
    return Promise.resolve(
      JSON.stringify({
        data: { foo: 'bar' },
        expires: Date.now() + 86400,
      }),
    );
  }),
  removeKey: jest.fn(),
};

const mockClient = {
  connect: jest.fn(),
  getOrCreateCache: jest.fn(() => {
    return mockApacheCache;
  }),
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

jest.mock('apache-ignite-client', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => {
    return mockClient;
  }),
  ObjectType: {
    PRIMITIVE_TYPE: {
      STRING: '3',
    },
  },
  IgniteClientConfiguration: jest.fn().mockImplementation(() => {
    return;
  }),
  CacheConfiguration: jest.fn().mockImplementation(() => {
    return;
  }),
}));

describe('Apache Ignite Cache Plugin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('constructor, connects to apache', () => {
    mockClient.connect.mockResolvedValue(true);
    const cache = new Cache({});
    cache.on('apache-connected', async () => {
      expect(mockLoggerClient.info.mock.calls[0]).toEqual(
        ['apache-ignite connection established, "koop-cache" ready'],
      );
    });
  });

  test('constructor, params', () => {
    mockClient.connect.mockResolvedValue(true);
    const cache = new Cache({ logger: mockLogger, options: { connStr: 'hello-world', cacheName: 'some-cache' } });
    cache.on('apache-connected', async () => {
      expect(mockLogger.info.mock.calls[0]).toEqual(
        ['apache-ignite connection established, "some-cache" ready'],
      );
    });
  });

  test('constructor, config', () => {
    jest.mock('config', () => {})
    jest.mock('config', () => ({
      has: () => {
        return true;
      },
      get: () => {
        return {};
      }
    }));
    mockClient.connect.mockResolvedValue(true);
    const cache = new Cache({ logger: mockLogger, options: { connStr: 'hello-world', cacheName: 'some-cache' } });
    cache.on('apache-connected', async () => {
      expect(mockLogger.info.mock.calls[0]).toEqual(
        ['apache-ignite connection established, "some-cache" ready'],
      );
    });
  });

  test('constructor, fails to connect to apache', () => {
    mockClient.connect.mockRejectedValue(new Error('Cannot connect'));

    const cache = new Cache({ logger: mockLogger });
    cache.on('apache-connection-failed', async () => {
      expect(mockLogger.error.mock.calls[0]).toEqual(
        ['could not establish apache-ignite connection'],
      );
    }).on('error', (error) => {
      expect(error.message).toBe('Cannot connect')
    });
  });

  test('insert with ttl', async () => {
    mockClient.connect.mockResolvedValue(true);
    const cache = new Cache();

    cache.on('apache-connected', async () => {
      await cache.insert('foo', { hello: 'world' }, { ttl: 10 });
      const putArgs = mockApacheCache.put.mock.calls[0];
      const cacheVal = JSON.parse(putArgs[1]);
      expect(putArgs[0]).toEqual('foo');
      expect(cacheVal.data).toEqual({ hello: 'world' });
    });
  });

  test('insert without ttl', async () => {
    mockClient.connect.mockResolvedValue(true);
    const cache = new Cache();

    cache.on('apache-connected', async () => {
      await cache.insert('foo', { hello: 'world' }, {});
      expect(mockApacheCache.put.mock.calls.length).toEqual(0);
    });
  });

  test('retrieve, find', async () => {
    mockClient.connect.mockResolvedValue(true);
    const cache = new Cache();

    cache.on('apache-connected', async () => {
      const entry = await cache.retrieve('foo');
      expect(mockApacheCache.get.mock.calls[0]).toEqual(['foo']);
      expect(entry).toEqual({ foo: 'bar' });
    });
  });

  test('retrieve, not found', async () => {
    mockClient.connect.mockResolvedValue(true);
    mockApacheCache.get.mockReset();
    mockApacheCache.get.mockResolvedValue(null as any);

    const cache = new Cache();

    cache.on('apache-connected', async () => {
      const entry = await cache.retrieve('foo');
      expect(mockApacheCache.get.mock.calls[0]).toEqual(['foo']);
      expect(entry).toEqual(null);
    });
  });

  test('retrieve, found but expired', async () => {
    mockClient.connect.mockResolvedValue(true);
    mockApacheCache.get.mockReset();
    mockApacheCache.get.mockResolvedValue(
      JSON.stringify({
        data: { foo: 'bar' },
        expires: Date.now() - 86400,
      }),
    );

    const cache = new Cache();

    cache.on('apache-connected', async () => {
      const entry = await cache.retrieve('foo');
      expect(mockApacheCache.get.mock.calls[0]).toEqual(['foo']);
      expect(entry).toEqual(null);
    });
  });

  test('delete', async () => {
    mockClient.connect.mockResolvedValue(true);
    const cache = new Cache();

    cache.on('apache-connected', async () => {
      const entry = await cache.delete('foo');
      expect(mockApacheCache.removeKey.mock.calls[0]).toEqual(['foo']);
    });
  });
});
