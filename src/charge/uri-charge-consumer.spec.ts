import { beforeEach, describe, expect, it } from '@jest/globals';
import { DefaultURIChargeConsumer } from './uri-charge-consumer.js';

describe('DefaultURIChargeConsumer', () => {
  let consumer: DefaultURIChargeConsumer;

  beforeEach(() => {
    consumer = new DefaultURIChargeConsumer();
  });

  describe('addSimple', () => {
    it('creates new array', () => {
      consumer.addSimple('test', 1, true);

      expect(consumer.object).toEqual({ test: [1] });
    });
  });

  describe('addObject', () => {
    it('creates new array', () => {
      const objectConsumer = consumer.startObject('test', true);

      objectConsumer.addString('value', '!!!', false);
      objectConsumer.endObject();

      expect(consumer.object).toEqual({ test: [{ value: '!!!' }] });
    });
  });
});
