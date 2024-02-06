import * as KoopModule from '@koopjs/koop-core';
import { Cache } from '../src';
const {default: Koop} = KoopModule;
const koop = new Koop()
koop.register(Cache);

koop.server.listen(8080)
