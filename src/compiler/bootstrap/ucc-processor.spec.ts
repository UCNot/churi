import { describe, expect, it } from '@jest/globals';
import { SPEC_MODULE } from '../../impl/module-names.js';
import { UcSchema } from '../../schema/uc-schema.js';
import {
  UccTestBootstrap,
  recordUcTestData,
  ucTestProcessSchemaRecord,
  ucTestRecord,
  ucTestRecordBroken,
  ucTestSubRecord,
} from '../../spec/ucc-test-bootstrap.js';
import { UccProcessor } from './ucc-processor.js';

describe('UccProcessor', () => {
  describe('schema constraints', () => {
    it('fails to enable missing feature', async () => {
      const schema: UcSchema<number> = {
        type: 'timestamp',
        where: {
          deserializer: {
            use: 'MissingFeature',
            from: SPEC_MODULE,
          },
        },
      };

      await expect(
        new UccTestProcessor({
          processors: ['deserializer'],
          models: { test: { model: schema } },
        }).bootstrap(),
      ).rejects.toThrow(
        new ReferenceError(
          `No such schema processing feature: import('${SPEC_MODULE}').MissingFeature`,
        ),
      );
    });
    it('fails to enable wrong feature', async () => {
      const schema: UcSchema<number> = {
        type: 'timestamp',
        where: {
          deserializer: {
            use: 'WrongFeature',
            from: SPEC_MODULE,
          },
        },
      };

      await expect(
        new UccTestProcessor({
          processors: ['deserializer'],
          models: { test: { model: schema } },
        }).bootstrap(),
      ).rejects.toThrow(
        new ReferenceError(
          `Not a schema processing feature: import('${SPEC_MODULE}').WrongFeature`,
        ),
      );
    });
    it('applies schema constraint', async () => {
      const constraints = ucTestRecord('test');
      const schema: UcSchema = { type: 'test', where: constraints };
      const processor = new UccTestProcessor({
        processors: ['deserializer'],
        models: { test: { model: schema } },
      });

      await processor.bootstrap();

      expect(processor.records).toEqual([
        {
          processor: 'deserializer',
          schema,
          constraint: constraints.deserializer,
          options: 'test',
        },
      ]);
    });
    it('fails to constrain schema by incompatible feature', async () => {
      const constraints = ucTestRecordBroken('test');
      const schema: UcSchema = { type: 'test', where: constraints };
      const processor = new UccTestProcessor({
        processors: ['deserializer'],
        models: { test: { model: schema } },
      });

      await expect(processor.bootstrap()).rejects.toThrow(
        new TypeError(
          `Feature import('#churi/spec.js').ucTestProcessFeatureRecord can not constrain schema "test"`,
        ),
      );

      expect(processor.records).toEqual([
        {
          processor: 'deserializer',
        },
      ]);
    });
    it('applies schema constraint within presentation', async () => {
      const constraints = ucTestRecord('test');
      const schema: UcSchema = { type: 'test', within: { charge: constraints } };
      const processor = new UccTestProcessor({
        processors: ['deserializer'],
        models: { test: { model: schema } },
      });

      await processor.bootstrap();

      expect(processor.records).toEqual([
        {
          processor: 'deserializer',
          schema,
          presentation: 'charge',
          constraint: constraints.deserializer,
          options: 'test',
        },
      ]);
    });
    it('enables feature', async () => {
      const constraints = ucTestSubRecord('test');
      const schema: UcSchema = { type: 'test', within: { charge: constraints } };
      const processor = new UccTestProcessor({
        processors: ['deserializer'],
        models: { test: { model: schema } },
      });

      await processor.bootstrap();

      expect(processor.records).toEqual([
        {
          processor: 'deserializer',
        },
      ]);
    });
  });

  describe('features', () => {
    it('enables feature', async () => {
      const processor = new UccTestProcessor({
        processors: [],
        features: boot => {
          recordUcTestData(boot);
        },
      });

      await processor.bootstrap();

      expect(processor.records).toEqual([{}]);
    });
  });

  describe('capabilities', () => {
    it('applies constraint at most once', async () => {
      const constraints = ucTestRecord('test');
      const schema: UcSchema = { type: 'test', where: constraints };
      const processor = new UccTestProcessor({
        capabilities: activation => {
          activation.onConstraint(
            {
              processor: 'deserializer',
              use: ucTestProcessSchemaRecord.name,
              from: SPEC_MODULE,
            },
            application => {
              application.ignore();
              application.apply();
              application.apply();
              application.ignore();
              application.apply();
              application.apply();
            },
          );
        },
        processors: ['deserializer'],
        models: { test: { model: schema } },
      });

      await processor.bootstrap();

      expect(processor.records).toEqual([
        {
          processor: 'deserializer',
          schema,
          constraint: constraints.deserializer,
          options: 'test',
        },
      ]);
    });
    it('allows to ignore constraint', async () => {
      const constraints = ucTestRecord('test');
      const schema: UcSchema = { type: 'test', where: constraints };
      const processor = new UccTestProcessor({
        capabilities: activation => {
          activation.onConstraint(
            {
              processor: 'deserializer',
              use: ucTestProcessSchemaRecord.name,
              from: SPEC_MODULE,
            },
            application => {
              application.ignore();
            },
          );
        },
        processors: ['deserializer'],
        models: { test: { model: schema } },
      });

      await processor.bootstrap();

      expect(processor.records).toEqual([]);
    });
    it('allows to ignore constraint within any presentation', async () => {
      const constraints = ucTestRecord('test');
      const schema: UcSchema = { type: 'test', within: { charge: constraints } };
      const processor = new UccTestProcessor({
        capabilities: activation => {
          activation.onConstraint(
            {
              processor: 'deserializer',
              use: ucTestProcessSchemaRecord.name,
              from: SPEC_MODULE,
            },
            application => {
              application.ignore();
            },
          );
        },
        processors: ['deserializer'],
        models: { test: { model: schema } },
      });

      await processor.bootstrap();

      expect(processor.records).toEqual([]);
    });
    it('allows to ignore constraint within concrete presentation', async () => {
      const constraints = ucTestRecord('test');
      const schema: UcSchema = { type: 'test', within: { charge: constraints } };
      const processor = new UccTestProcessor({
        capabilities: activation => {
          activation.onConstraint(
            {
              processor: 'deserializer',
              within: 'charge',
              use: ucTestProcessSchemaRecord.name,
              from: SPEC_MODULE,
            },
            application => {
              application.ignore();
            },
          );
        },
        processors: ['deserializer'],
        models: { test: { model: schema } },
      });

      await processor.bootstrap();

      expect(processor.records).toEqual([]);
    });
    it('allows to apply multiple constraints', async () => {
      const constraints = ucTestRecord('test');
      const schema: UcSchema = { type: 'test', within: { charge: constraints } };
      const processor = new UccTestProcessor({
        capabilities: activation => {
          activation
            .onConstraint(
              {
                processor: 'deserializer',
                use: ucTestProcessSchemaRecord.name,
                from: SPEC_MODULE,
              },
              application => {
                application.ignore();
                application.boot.record({
                  processor: application.processor,
                  schema: application.schema,
                  within: application.within,
                  constraint: application.constraint,
                });
              },
            )
            .onConstraint(
              {
                processor: 'deserializer',
                use: ucTestProcessSchemaRecord.name,
                from: SPEC_MODULE,
              },
              ({ boot }) => {
                recordUcTestData(boot, 2);
              },
            );
        },
        processors: ['deserializer'],
        models: { test: { model: schema } },
      });

      await processor.bootstrap();

      expect(processor.records).toEqual([
        {
          processor: 'deserializer',
          schema,
          within: 'charge',
          constraint: constraints.deserializer,
        },
        {
          processor: 'deserializer',
          schema,
          presentation: 'charge',
          constraint: constraints.deserializer,
          options: 2,
        },
      ]);
    });
  });
});

class UccTestProcessor extends UccProcessor<UccTestBootstrap> implements UccTestBootstrap {

  readonly records: unknown[] = [];

  record(value: unknown): void {
    this.records.push(value);
  }

  async bootstrap(): Promise<void> {
    await this.processInstructions();
  }

  protected override startBootstrap(): UccTestBootstrap {
    return this;
  }

}
