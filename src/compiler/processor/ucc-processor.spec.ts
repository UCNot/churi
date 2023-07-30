import { describe, expect, it } from '@jest/globals';
import { SPEC_MODULE } from '../../impl/module-names.js';
import { UcSchema } from '../../schema/uc-schema.js';
import {
  UccTestSetup,
  recordUcTestData,
  ucTestRecord,
  ucTestSubRecord,
  ucTestSupportRecord,
} from '../../spec/ucc-test-setup.js';
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
          models: [schema],
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
          models: [schema],
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
        models: [schema],
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
    it('applies schema constraint within presentation', async () => {
      const constraints = ucTestRecord('test');
      const schema: UcSchema = { type: 'test', within: { charge: constraints } };
      const processor = new UccTestProcessor({
        processors: ['deserializer'],
        models: [schema],
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
        models: [schema],
      });

      await processor.bootstrap();

      expect(processor.records).toEqual([
        {
          processor: 'deserializer',
          options: 'test',
        },
      ]);
    });
  });

  describe('features', () => {
    it('enables feature', async () => {
      const processor = new UccTestProcessor({
        processors: [],
        models: [],
        features: setup => ({
          configure(options) {
            recordUcTestData(setup, options);
          },
        }),
      });

      await processor.bootstrap();

      expect(processor.records).toEqual([{}]);
    });
  });

  describe('profiles', () => {
    it('applies constraint at most once', async () => {
      const constraints = ucTestRecord('test');
      const schema: UcSchema = { type: 'test', where: constraints };
      const processor = new UccTestProcessor({
        profiles: activation => {
          activation.onConstraint(
            {
              processor: 'deserializer',
              use: ucTestSupportRecord.name,
              from: SPEC_MODULE,
            },
            async application => {
              application.ignore();
              await application.apply();
              await application.apply();
              application.ignore();
              await application.apply();
              await application.apply();
            },
          );
        },
        processors: ['deserializer'],
        models: [schema],
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
        profiles: activation => {
          activation.onConstraint(
            {
              processor: 'deserializer',
              use: ucTestSupportRecord.name,
              from: SPEC_MODULE,
            },
            application => {
              application.ignore();
            },
          );
        },
        processors: ['deserializer'],
        models: [schema],
      });

      await processor.bootstrap();

      expect(processor.records).toEqual([]);
    });
    it('allows to ignore constraint within any presentation', async () => {
      const constraints = ucTestRecord('test');
      const schema: UcSchema = { type: 'test', within: { charge: constraints } };
      const processor = new UccTestProcessor({
        profiles: activation => {
          activation.onConstraint(
            {
              processor: 'deserializer',
              use: ucTestSupportRecord.name,
              from: SPEC_MODULE,
            },
            application => {
              application.ignore();
            },
          );
        },
        processors: ['deserializer'],
        models: [schema],
      });

      await processor.bootstrap();

      expect(processor.records).toEqual([]);
    });
    it('allows to ignore constraint within concrete presentation', async () => {
      const constraints = ucTestRecord('test');
      const schema: UcSchema = { type: 'test', within: { charge: constraints } };
      const processor = new UccTestProcessor({
        profiles: activation => {
          activation.onConstraint(
            {
              processor: 'deserializer',
              within: 'charge',
              use: ucTestSupportRecord.name,
              from: SPEC_MODULE,
            },
            application => {
              application.ignore();
            },
          );
        },
        processors: ['deserializer'],
        models: [schema],
      });

      await processor.bootstrap();

      expect(processor.records).toEqual([]);
    });
    it('allows to apply multiple constraints', async () => {
      const constraints = ucTestRecord('test');
      const schema: UcSchema = { type: 'test', within: { charge: constraints } };
      const processor = new UccTestProcessor({
        profiles: activation => {
          activation
            .onConstraint(
              {
                processor: 'deserializer',
                use: ucTestSupportRecord.name,
                from: SPEC_MODULE,
              },
              application => {
                application.ignore();
                application.setup.record({
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
                use: ucTestSupportRecord.name,
                from: SPEC_MODULE,
              },
              ({ setup }) => {
                recordUcTestData(setup, 2);
              },
            );
        },
        processors: ['deserializer'],
        models: [schema],
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

class UccTestProcessor extends UccProcessor<UccTestSetup> implements UccTestSetup {

  readonly records: unknown[] = [];

  record(value: unknown): void {
    this.records.push(value);
  }

  async bootstrap(): Promise<void> {
    await this.processInstructions();
  }

  protected override createSetup(): UccTestSetup {
    return this;
  }

}
