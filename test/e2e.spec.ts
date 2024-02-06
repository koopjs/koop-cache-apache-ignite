import { Cache } from '../src';
import * as koopModule from '@koopjs/koop-core';

const { default: Koop } = koopModule;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe.skip('Apache Ignite Cache Plugin - E2E', () => {
  describe('Cache on its own', () => {
    test('insert and retrieve', (done) => {
      const cache = new Cache()
      cache.on('apache-connected', async () => {
        await cache.insert('test3', { foo: 'bar' }, { ttl: 20 });
        const res = await cache.retrieve('test3');
        expect(res).toEqual({ foo: 'bar' });
        done();
      })
    });

    test('insert and retrieve, expired', (done) => {
      const cache = new Cache()
      cache.on('apache-connected', async () => {
        await cache.insert('test4', { foo: 'bar' }, { ttl: 1 });
        await sleep(1200);
        const res = await cache.retrieve('test4');
        expect(res).toEqual(null);
        done();
      });
    });

    test('insert, delete, and retrieve', (done) => {
      const cache = new Cache()
      cache.on('apache-connected', async () => {
        await cache.insert('test5', { foo: 'bar' }, { ttl: 10 });
        await cache.delete('test5');
        const res = await cache.retrieve('test5');
        expect(res).toEqual(null);
        done();
      });
    });
  })

  describe('Register as Koop plugin', () => {
    test('register', () => {
      const koop = new Koop();
      koop.register(Cache)
    })
  })
});
