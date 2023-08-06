import { UccBootstrap } from '../compiler/bootstrap/ucc-bootstrap.js';
import { UccConfig } from '../compiler/bootstrap/ucc-config.js';
import { SPEC_MODULE } from '../impl/module-names.js';
import { UcOmniConstraints } from '../schema/uc-constraints.js';

export interface UccTestBootstrap extends UccBootstrap<UccTestBootstrap> {
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

export function ucTestProcessSchemaRecord(boot: UccTestBootstrap): UccConfig<unknown> {
  return {
    configureSchema(_, options) {
      recordUcTestData(boot, options);
    },
  };
}

export function ucTestProcessFeatureRecord(boot: UccTestBootstrap): UccConfig<unknown> {
  return {
    configure(options) {
      recordUcTestData(boot, options);
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

export function ucTestProcessSubRecord(boot: UccTestBootstrap): UccConfig<unknown> {
  return {
    configureSchema(_, options) {
      boot.enable(ucTestProcessFeatureRecord, options);
    },
  };
}

export function recordUcTestData(boot: UccTestBootstrap, options: unknown): void {
  boot.record({
    processor: boot.currentProcessor,
    schema: boot.currentSchema,
    presentation: boot.currentPresentation,
    constraint: boot.currentConstraint,
    options,
  });
}
