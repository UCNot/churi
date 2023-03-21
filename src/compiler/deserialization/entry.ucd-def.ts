import { lazyValue } from '@proc7ts/primitives';
import { escapeJsString } from '../../impl/quote-property-key.js';
import { ucSchemaName } from '../../schema/uc-schema-name.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccArgs } from '../codegen/ucc-args.js';
import { UccCode } from '../codegen/ucc-code.js';
import { UccNamespace } from '../codegen/ucc-namespace.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { UnsupportedUcSchemaError } from '../unsupported-uc-schema.error.js';
import { MapUcdDef } from './map.ucd-def.js';

export class EntryUcdDef {

  readonly #mapDef: MapUcdDef;
  readonly #key: string | null;
  readonly #schema: UcSchema;
  readonly #ns: UccNamespace;
  readonly #argValue = lazyValue(() => this.ns.name('value'));
  readonly #varEntrySetter = lazyValue(() => this.ns.name('setEntry'));

  constructor(mapDef: MapUcdDef, key: string | null, schema: UcSchema) {
    this.#mapDef = mapDef;
    this.#key = key;
    this.#schema = schema;
    this.#ns = mapDef.lib.ns.nest();
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

  createRx({ args: { map, key, context }, prefix, suffix }: EntryUcdDef.RxArgs): UccCode.Source {
    const setEntry = this.#varEntrySetter();
    const value = this.#argValue();

    return code => {
      code
        .write(`const ${setEntry} = ${value} => {`)
        .indent(this.setEntry(`${map}[0]`, key, value))
        .write(`};`)
        .write(
          this.getTemplate().newInstance({ args: { set: setEntry, context }, prefix, suffix }),
        );
    };
  }

  getTemplate(): UcrxTemplate {
    const { schema, mapDef } = this;

    try {
      return mapDef.lib.ucrxTemplateFor(schema);
    } catch (cause) {
      const entryName = this.key != null ? `entry "${escapeJsString(this.key)}"` : 'extra entry';

      throw new UnsupportedUcSchemaError(
        schema,
        `${ucSchemaName(mapDef.schema)}: Can not deserialize ${entryName} of type "${ucSchemaName(
          schema,
        )}"`,
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
    const args = UccEntryDef$args.declare(this.mapDef.lib.ns.nest());

    return code => {
      code
        .write(`rx(${args}) {`)
        .indent(code => {
          code.write(
            this.createRx({
              args: args.args,
              prefix: 'return ',
              suffix: ';',
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

const UccEntryDef$args = new UccArgs<'context' | 'map' | 'key'>('context', 'map', 'key');

export namespace EntryUcdDef {
  export interface RxArgs {
    readonly args: {
      readonly context: string;
      readonly map: string;
      readonly key: string;
    };
    readonly prefix: string;
    readonly suffix: string;
  }
}
