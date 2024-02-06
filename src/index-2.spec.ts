// Requires its on test file due to complications of mocking node-config
import { Cache } from '.';
import IgniteClient from 'apache-ignite-client';
import loggerModule from '@koopjs/logger';
import config from 'config';

jest.mock('config', () => ({
  has: () => {
    return true;
  },
  get: () => {
    return {};
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


  test('constructor, config', () => {
    mockClient.connect.mockResolvedValue(true);
    const cache = new Cache({ logger: mockLogger, options: { connStr: 'hello-world', cacheName: 'some-cache' } });
    cache.on('apache-connected', async () => {
      expect(mockLogger.info.mock.calls[0]).toEqual(
        ['apache-ignite connection established, "some-cache" ready'],
      );
    });
  });
});
