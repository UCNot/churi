import { describe, expect, it } from '@jest/globals';
import { UcSchema, ucSchema } from './uc-schema.js';

describe('ucSchema', () => {
  it('merges per-tool schema processing instructions', () => {
    expect(
      ucSchema(
        {
          type: 'test-type',
          with: {
            deserializer: {
              use: {
                from: 'test-module',
                feature: 'test-feature',
                options: { test: 1 },
              },
            },
          },
        },
        {
          with: [
            {
              deserializer: {
                use: {
                  from: 'test-module',
                  feature: 'test-feature',
                  options: { test: 2 },
                },
              },
            },
            {
              deserializer: {
                use: {
                  from: 'test-module',
                  feature: 'test-feature3',
                  options: { test: 3 },
                },
              },
            },
          ],
        },
      ),
    ).toEqual({
      type: 'test-type',
      with: {
        deserializer: {
          use: [
            {
              from: 'test-module',
              feature: 'test-feature3',
              options: { test: 3 },
            },
            {
              from: 'test-module',
              feature: 'test-feature',
              options: { test: 2 },
            },
            {
              from: 'test-module',
              feature: 'test-feature',
              options: { test: 1 },
            },
          ],
        },
      },
    });
  });
  it('returns schema without extension as is', () => {
    const schema: UcSchema = {
      type: 'test-type',
      with: {
        deserializer: {
          use: {
            from: 'test-module',
            feature: 'test-feature',
            options: { test: 1 },
          },
        },
      },
    };

    expect(ucSchema(schema)).toBe(schema);
  });
  it('leaves schema without per-tool instructions extension', () => {
    const schema: UcSchema = {
      type: 'test-type',
      with: {
        deserializer: {
          use: {
            from: 'test-module',
            feature: 'test-feature',
            options: { test: 1 },
          },
        },
      },
    };

    expect(
      ucSchema(schema, {
        with: [],
      }),
    ).toEqual(schema);
  });
});
