import { lazyValue, mayHaveProperties } from '@proc7ts/primitives';
import { UccBootstrap } from '../ucc-bootstrap.js';
import { UccFeature } from '../ucc-feature.js';
import {
  UccProcessor$ConstraintIssue,
  UccProcessor$ConstraintResolution,
} from './ucc-processor.constraint-issue.js';
import { UccProcessor$ConstraintMapper } from './ucc-processor.constraint-mapper.js';
import { UccProcessor$Current } from './ucc-processor.current.js';

export class UccProcessor$FeatureSet<in out TBoot extends UccBootstrap<TBoot>> {

  readonly #constraintMapper: UccProcessor$ConstraintMapper<TBoot>;
  readonly #resolutions = new Map<string, Promise<{ [key in string]: UccFeature<TBoot> }>>();
  readonly #enable: <TOptions>(
    feature: UccFeature<TBoot, TOptions>,
  ) => UccFeature.Handle<TOptions> | void;

  readonly #features = new Map<UccFeature<TBoot, never>, UccFeature$Entry>();

  #current: UccProcessor$Current = {};

  constructor(
    constraintMapper: UccProcessor$ConstraintMapper<TBoot>,
    enable: <TOptions>(feature: UccFeature<TBoot, TOptions>) => UccFeature.Handle<TOptions> | void,
  ) {
    this.#constraintMapper = constraintMapper;
    this.#enable = enable;
  }

  get constraintMapper(): UccProcessor$ConstraintMapper<TBoot> {
    return this.#constraintMapper;
  }

  get current(): UccProcessor$Current {
    return this.#current;
  }

  async resolveConstraint<TOptions>(
    issue: UccProcessor$ConstraintIssue<TOptions>,
  ): Promise<UccProcessor$ConstraintResolution<TBoot, TOptions>> {
    const {
      constraint: { use, from },
    } = issue;
    let resolveFeatures = this.#resolutions.get(from);

    if (!resolveFeatures) {
      resolveFeatures = import(from);
      this.#resolutions.set(from, resolveFeatures);
    }

    const { [use]: feature } = await resolveFeatures;

    if ((mayHaveProperties(feature) && 'uccEnable' in feature) || typeof feature === 'function') {
      return { issue, feature } as UccProcessor$ConstraintResolution<TBoot, TOptions>;
    }
    if (feature === undefined) {
      throw new ReferenceError(`No such schema processing feature: ${issue}`);
    } else {
      throw new ReferenceError(`Not a schema processing feature: ${issue}`);
    }
  }

  enableFeature<TOptions>(
    feature: UccFeature<TBoot, TOptions>,
  ): UccFeature.Handle<TOptions> | void {
    let entry = this.#features.get(feature) as UccFeature$Entry<TOptions> | undefined;

    if (!entry) {
      entry = {
        getHandle: lazyValue(() => this.runWithCurrent({}, () => this.#enable(feature))),
      };
      this.#features.set(feature, entry);
    }

    return entry.getHandle();
  }

  runWithCurrent<T>(current: UccProcessor$Current, action: () => T): T {
    const prev = this.#current;

    this.#current = current.processor ? current : { ...current, processor: prev.processor };

    try {
      return action();
    } finally {
      this.#current = prev;
    }
  }

}

interface UccFeature$Entry<in TOptions = never> {
  readonly getHandle: () => UccFeature.Handle<TOptions> | void;
}
