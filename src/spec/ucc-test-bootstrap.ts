import { UccBootstrap } from '../compiler/bootstrap/ucc-bootstrap.js';
import { UccFeature } from '../compiler/bootstrap/ucc-feature.js';
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

export function ucTestRecordBroken(options?: unknown): UcOmniConstraints {
  return {
    deserializer: {
      use: ucTestProcessFeatureRecord.name,
      from: SPEC_MODULE,
      with: options,
    },
  };
}

export function ucTestProcessSchemaRecord(boot: UccTestBootstrap): UccFeature.Handle<unknown> {
  return {
    constrain({ options }) {
      recordUcTestData(boot, options);
    },
  };
}

export function ucTestProcessFeatureRecord(boot: UccTestBootstrap): void {
  recordUcTestData(boot);
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

export function ucTestProcessSubRecord(boot: UccTestBootstrap): UccFeature.Handle<unknown> {
  return {
    constrain() {
      boot.enable(ucTestProcessFeatureRecord);
    },
  };
}

export function recordUcTestData(boot: UccTestBootstrap, options?: unknown): void {
  boot.record({
    processor: boot.currentProcessor,
    schema: boot.currentSchema,
    presentation: boot.currentPresentation,
    constraint: boot.currentConstraint,
    options,
  });
}
