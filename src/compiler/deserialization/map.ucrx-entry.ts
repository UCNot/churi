import { lazyValue } from '@proc7ts/primitives';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccArgs } from '../codegen/ucc-args.js';
import { UccSource } from '../codegen/ucc-code.js';
import { UccNamespace } from '../codegen/ucc-namespace.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { MapUcrxTemplate } from './map.ucrx-template.js';

export class MapUcrxEntry {

  readonly #mapDef: MapUcrxTemplate;
  readonly #key: string | null;
  readonly #schema: UcSchema;
  readonly #ns: UccNamespace;
  readonly #argValue = lazyValue(() => this.ns.name('value'));
  readonly #varEntrySetter = lazyValue(() => this.ns.name('setEntry'));

  constructor(mapDef: MapUcrxTemplate, key: string | null, schema: UcSchema) {
    this.#mapDef = mapDef;
    this.#key = key;
    this.#schema = schema;
    this.#ns = mapDef.lib.ns.nest();
  }

  get mapDef(): MapUcrxTemplate {
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

  createRx(args: MapUcrxEntry.RxArgs): UccSource;

  createRx({ args: { map, key, context }, prefix, suffix }: MapUcrxEntry.RxArgs): UccSource {
    const setEntry = this.#varEntrySetter();
    const value = this.#argValue();

    return code => {
      code
        .write(`const ${setEntry} = ${value} => {`)
        .indent(this.setEntry(`${map}[0]`, key, value))
        .write(`};`)
        .write(prefix + this.getTemplate().newInstance({ set: setEntry, context }) + suffix);
    };
  }

  getTemplate(): UcrxTemplate {
    return this.mapDef.entryTemplate(this.key, this.schema);
  }

  setEntry(map: string, key: string, value: string): UccSource {
    return `${map}[${key}] = ${value};`;
  }

  declare(init: (value: UccSource) => UccSource): UccSource {
    return init(code => {
      code.write(`{`).indent(this.#rx(), this.#use(), '').write(`}`);
    });
  }

  #rx(): UccSource {
    const args = UcdEntryArgs.declare(this.mapDef.lib.ns.nest());

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

  #use(): UccSource {
    return `use: ` + (this.key == null || this.schema.optional ? '0' : '1') + `,`;
  }

}

const UcdEntryArgs = /*#__PURE__*/ new UccArgs<MapUcrxEntry.Arg>('context', 'map', 'key');

export namespace MapUcrxEntry {
  export type Arg = 'context' | 'map' | 'key';
  export interface RxArgs {
    readonly args: UccArgs.ByName<Arg>;
    readonly prefix: string;
    readonly suffix: string;
  }
}
