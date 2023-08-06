import { lazyValue, mayHaveProperties } from '@proc7ts/primitives';
import { UccBootstrap } from '../ucc-bootstrap.js';
import { UccFeature } from '../ucc-feature.js';
import { UccProcessor$ConstraintIssue } from './ucc-processor.constraint-issue.js';
import { UccProcessor$Current } from './ucc-processor.current.js';
import { UccProcessor$Profiler } from './ucc-processor.profiler.js';

export class UccProcessor$Config<in out TBoot extends UccBootstrap<TBoot>> {

  readonly #profiler: UccProcessor$Profiler<TBoot>;
  readonly #resolutions = new Map<string, Promise<{ [key in string]: UccFeature<TBoot> }>>();
  readonly #enable: <TOptions>(
    feature: UccFeature<TBoot, TOptions>,
  ) => UccFeature.Handle<TOptions> | void;

  readonly #features = new Map<UccFeature<TBoot, never>, UccFeature$Entry>();

  #current: UccProcessor$Current = {};

  constructor(
    profiler: UccProcessor$Profiler<TBoot>,
    enable: <TOptions>(feature: UccFeature<TBoot, TOptions>) => UccFeature.Handle<TOptions> | void,
  ) {
    this.#profiler = profiler;
    this.#enable = enable;
  }

  get boot(): TBoot {
    return this.#profiler.boot;
  }

  get profiler(): UccProcessor$Profiler<TBoot> {
    return this.#profiler;
  }

  get current(): UccProcessor$Current {
    return this.#current;
  }

  async resolveFeature(issue: UccProcessor$ConstraintIssue): Promise<UccFeature<TBoot>> {
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
      return feature;
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
