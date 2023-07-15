import {
  EsArg,
  EsCode,
  EsFunction,
  EsScopeKind,
  EsSignature,
  EsSnippet,
  esEscapeString,
  esline,
} from 'esgen';
import { UcMap } from '../../schema/map/uc-map.js';
import { ucModelName } from '../../schema/uc-model-name.js';
import { UcModel, UcSchema } from '../../schema/uc-schema.js';
import { UnsupportedUcSchemaError } from '../common/unsupported-uc-schema.error.js';
import { ucSchemaTypeSymbol } from '../impl/uc-schema-symbol.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxClass } from '../rx/ucrx.class.js';
import { MapUcrxClass, MapUcrxStore } from './map.ucrx.class.js';

export class MapUcrxEntry {

  static ucrxClass<TEntriesModel extends UcMap.EntriesModel, TExtraModel extends UcModel | false>(
    lib: UcrxLib,
    mapSchema: UcMap.Schema<TEntriesModel, TExtraModel>,
    key: string | null,
    entrySchema: UcSchema,
  ): UcrxClass {
    try {
      return lib.ucrxClassFor(entrySchema);
    } catch (cause) {
      const entryName = key != null ? `entry "${esEscapeString(key)}"` : 'extra entry';

      throw new UnsupportedUcSchemaError(
        entrySchema,
        `${ucSchemaTypeSymbol(mapSchema)}: Can not deserialize ${entryName} of type "${ucModelName(
          entrySchema,
        )}"`,
        { cause },
      );
    }
  }

  readonly #mapClass: MapUcrxClass;
  readonly #key: string | null;
  readonly #schema: UcSchema;
  #ucrxClass?: UcrxClass;

  constructor(mapClass: MapUcrxClass, key: string | null, schema: UcSchema) {
    this.#mapClass = mapClass;
    this.#key = key;
    this.#schema = schema;
  }

  get mapClass(): MapUcrxClass {
    return this.#mapClass;
  }

  get key(): string | null {
    return this.#key;
  }

  get schema(): UcSchema {
    return this.#schema;
  }

  get ucrxClass(): UcrxClass {
    return (this.#ucrxClass ??= this.mapClass.entryUcrxFor(this.key, this.schema));
  }

  instantiate(store: MapUcrxStore, args: MapUcrxEntrySignature.Values): EsSnippet;

  instantiate(store: MapUcrxStore, { slot, key }: MapUcrxEntrySignature.Values): EsSnippet {
    const setEntry = new EsFunction('setEntry', { value: {} });

    return this.ucrxClass.instantiate({
      set: setEntry.lambda(({ args: { value } }) => store.setEntry(esline`${slot}[0]`, key, value)),
    });
  }

  declare(store: MapUcrxStore): EsSnippet {
    return code => {
      code.multiLine(code => {
        code.write(`{`).indent(this.#rx(store), this.#use()).write(`}`);
      });
    };
  }

  #rx(mapStore: MapUcrxStore): EsSnippet {
    return code => {
      code.scope({ kind: EsScopeKind.Function, ns: {} }, code => {
        code
          .line(`rx`, MapUcrxEntrySignature.declare(), ` {`)
          .indent(code => {
            code.line(`return `, this.instantiate(mapStore, MapUcrxEntrySignature.args), `;`);
          })
          .write(`},`);
      });
    };
  }

  #use(): EsSnippet {
    if (!this.mapClass.hasRequired) {
      return EsCode.none;
    }

    return `use: ` + (this.key == null || this.schema.optional ? '0' : '1') + `,`;
  }

}

export const MapUcrxEntrySignature: MapUcrxEntrySignature = /*#__PURE__*/ new EsSignature({
  slot: {},
  key: {},
});

export type MapUcrxEntrySignature = EsSignature<MapUcrxEntrySignature.Args>;

export namespace MapUcrxEntrySignature {
  export type Args = {
    readonly slot: EsArg;
    readonly key: EsArg;
  };
  export type Values = EsSignature.ValuesOf<Args>;
}
