import { beforeEach, describe, expect, it } from '@jest/globals';
import { ChURIObjectBuilder } from './ch-uri-object-builder.js';

describe('ChURIObjectBuilder', () => {
  let consumer: ChURIObjectBuilder;

  beforeEach(() => {
    consumer = new ChURIObjectBuilder();
  });

  describe('addSimple', () => {
    it('creates new array', () => {
      consumer.addPrimitive('test', 1, true);

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
