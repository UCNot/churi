import { UccConfig } from '../compiler/processor/ucc-config.js';
import { UccSetup } from '../compiler/processor/ucc-setup.js';
import { SPEC_MODULE } from '../impl/module-names.js';
import { UcOmniConstraints } from '../schema/uc-constraints.js';

export interface UccTestSetup extends UccSetup<UccTestSetup> {
  record(value: unknown): void;
}

export const WrongFeature = 'WrongFeature';

export function ucTestRecord(options?: unknown): UcOmniConstraints {
  return {
    deserializer: {
      use: ucTestProcessSchemaRecord.name,
      from: SPEC_MODULE,
      with: options,
    },
  };
}

export function ucTestProcessSchemaRecord(setup: UccTestSetup): UccConfig<unknown> {
  return {
    configureSchema(_, options) {
      recordUcTestData(setup, options);
    },
  };
}

export function ucTestProcessFeatureRecord(setup: UccTestSetup): UccConfig<unknown> {
  return {
    configure(options) {
      recordUcTestData(setup, options);
    },
  };
}

export function ucTestSubRecord(options?: unknown): UcOmniConstraints {
  return {
    deserializer: {
      use: ucTestProcessSubRecord.name,
      from: SPEC_MODULE,
      with: options,
    },
  };
}

export function ucTestProcessSubRecord(setup: UccTestSetup): UccConfig<unknown> {
  return {
    configureSchema(_, options) {
      setup.enable(ucTestProcessFeatureRecord, options);
    },
  };
}

export function recordUcTestData(setup: UccTestSetup, options: unknown): void {
  setup.record({
    processor: setup.currentProcessor,
    schema: setup.currentSchema,
    presentation: setup.currentPresentation,
    constraint: setup.currentConstraint,
    options,
  });
}
