import { lazyValue } from '@proc7ts/primitives';
import { escapeJsString } from '../../impl/quote-property-key.js';
import { ucSchemaName } from '../../schema/uc-schema-name.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../ucc-code.js';
import { UccNamespace } from '../ucc-namespace.js';
import { UnsupportedUcSchemaError } from '../unsupported-uc-schema.error.js';
import { MapUcdDef } from './map.ucd-def.js';

export class EntryUcdDef {

  readonly #mapDef: MapUcdDef;
  readonly #key: string | null;
  readonly #schema: UcSchema;
  readonly #ns: UccNamespace;
  readonly #argMap = lazyValue(() => this.ns.name('map'));
  readonly #argKey = lazyValue(() => this.ns.name('key'));
  readonly #argValue = lazyValue(() => this.ns.name('value'));
  readonly #varEntrySetter = lazyValue(() => this.ns.name('setEntry'));

  constructor(mapDef: MapUcdDef, key: string | null, schema: UcSchema) {
    this.#mapDef = mapDef;
    this.#key = key;
    this.#schema = schema;
    this.#ns = mapDef.location.fn.lib.ns.nest();
  }

  get mapDef(): MapUcdDef {
    return this.#mapDef;
  }

  get key(): string | null {
    return this.#key;
  }

  get schema(): UcSchema {
    return this.#schema;
  }

  get ns(): UccNamespace {
    return this.#ns;
  }

  createRx(args: EntryUcdDef.RxArgs): UccCode.Source;

  createRx({ prefix, suffix, map, key }: EntryUcdDef.RxArgs): UccCode.Source {
    const setEntry = this.#varEntrySetter();
    const value = this.#argValue();

    return code => {
      code
        .write(`const ${setEntry} = ${value} => {`)
        .indent(this.setEntry(`${map}[0]`, key, value), 'return 1;')
        .write(`};`)
        .write(this.#deserialize(prefix, suffix, setEntry));
    };
  }

  #deserialize(prefix: string, suffix: string, setEntry: string): UccCode.Source {
    const {
      schema,
      mapDef: {
        location: { fn },
      },
    } = this;

    try {
      return fn.deserialize(schema, {
        setter: setEntry,
        prefix,
        suffix,
      });
    } catch (cause) {
      const entryName = this.key != null ? `entry "${escapeJsString(this.key)}"` : 'extra entry';

      throw new UnsupportedUcSchemaError(
        schema,
        `${fn.name}: Can not deserialize ${entryName} of type "${ucSchemaName(schema)}"`,
        { cause },
      );
    }
  }

  setEntry(map: string, key: string, value: string): UccCode.Source {
    return `${map}[${key}] = ${value};`;
  }

  declare(prefix: string, suffix: string): UccCode.Source {
    return code => {
      code.write(`${prefix}{`).indent(this.#rx(), this.#use()).write(`}${suffix}`);
    };
  }

  #rx(): UccCode.Source {
    const reader = this.mapDef.location.fn.args.reader;
    const map = this.#argMap();
    const key = this.#argKey();

    return code => {
      code
        .write(`rx(${reader}, ${map}, ${key}) {`)
        .indent(code => {
          code.write(
            this.createRx({
              prefix: 'return ',
              suffix: ';',
              reader,
              map,
              key,
            }),
          );
        })
        .write(`},`);
    };
  }

  #use(): UccCode.Source {
    return `use: ` + (this.key == null || this.schema.optional ? '0' : '1') + `,`;
  }

}

export namespace EntryUcdDef {
  export interface RxArgs {
    readonly prefix: string;
    readonly suffix: string;
    readonly reader: string;
    readonly map: string;
    readonly key: string;
  }
}
