import { describe, expect, it } from '@jest/globals';
import { UcSchema, ucSchema } from './uc-schema.js';

describe('ucSchema', () => {
  it('merges schema constraints', () => {
    expect(
      ucSchema(
        {
          type: 'test-type',
          where: {
            deserializer: {
              use: 'test-feature',
              from: 'test-module',
              with: { test: 1 },
            },
          },
        },
        {
          where: [
            {
              deserializer: {
                use: 'test-feature',
                from: 'test-module',
                with: { test: 2 },
              },
            },
            {
              deserializer: {
                use: 'test-feature3',
                from: 'test-module',
                with: { test: 3 },
              },
            },
          ],
        },
      ),
    ).toEqual({
      type: 'test-type',
      where: {
        deserializer: [
          {
            use: 'test-feature',
            from: 'test-module',
            with: { test: 1 },
          },
          {
            use: 'test-feature',
            from: 'test-module',
            with: { test: 2 },
          },
          {
            use: 'test-feature3',
            from: 'test-module',
            with: { test: 3 },
          },
        ],
      },
    });
  });
  it('merges schema presentations', () => {
    expect(
      ucSchema(
        {
          type: 'test-type',
          within: {
            charge: {
              deserializer: {
                use: 'test-feature',
                from: 'test-module',
                with: { test: 1 },
              },
            },
          },
        },
        {
          within: {
            charge: {
              deserializer: [
                {
                  use: 'test-feature',
                  from: 'test-module',
                  with: { test: 2 },
                },
                {
                  use: 'test-feature3',
                  from: 'test-module',
                  with: { test: 3 },
                },
              ],
            },
          },
        },
      ),
    ).toEqual({
      type: 'test-type',
      within: {
        charge: {
          deserializer: [
            {
              use: 'test-feature',
              from: 'test-module',
              with: { test: 1 },
            },
            {
              use: 'test-feature',
              from: 'test-module',
              with: { test: 2 },
            },
            {
              use: 'test-feature3',
              from: 'test-module',
              with: { test: 3 },
            },
          ],
        },
      },
    });
  });
  it('returns schema without extension as is', () => {
    const schema: UcSchema = {
      type: 'test-type',
      where: {
        deserializer: {
          use: 'test-feature',
          from: 'test-module',
          with: { test: 1 },
        },
      },
    };

    expect(ucSchema(schema)).toBe(schema);
  });
  it('leaves the schema without constraints extension', () => {
    const schema: UcSchema = {
      type: 'test-type',
      where: {
        deserializer: {
          use: 'test-feature',
          from: 'test-module',
          with: { test: 1 },
        },
      },
    };

    expect(
      ucSchema(schema, {
        where: [],
      }),
    ).toEqual(schema);
  });
});
