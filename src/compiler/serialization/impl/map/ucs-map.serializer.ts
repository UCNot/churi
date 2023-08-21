import { EsScope, EsSnippet, EsVarSymbol, esEscapeString, esMemberAccessor, esline } from 'esgen';
import { UcMap } from '../../../../schema/map/uc-map.js';
import { ucModelName } from '../../../../schema/uc-model-name.js';
import { ucNullable } from '../../../../schema/uc-nullable.js';
import { ucOptional } from '../../../../schema/uc-optional.js';
import { UcModel, UcSchema } from '../../../../schema/uc-schema.js';
import { ucsWriteAsIs } from '../../../../serializer/ucs-write-asis.js';
import { UnsupportedUcSchemaError } from '../../../common/unsupported-uc-schema.error.js';
import { UC_MODULE_SERIALIZER } from '../../../impl/uc-modules.js';
import { UcsFormatterContext, UcsFormatterSignature } from '../../ucs-formatter.js';
import { UcsLib } from '../../ucs-lib.js';
import { ucsCheckCharge } from '../ucs-format-charge.js';
import { UcsMapEntryIdx } from './ucs-map-entry-idx.js';
import { ucsMapKeys } from './ucs-map-keys.js';

export abstract class UcsMapSerializer<
  TEntriesModel extends UcMap.EntriesModel,
  TExtraModel extends UcModel | false,
> {

  readonly #writer: EsSnippet;
  readonly #value: EsSnippet;
  readonly #schema: UcMap.Schema<TEntriesModel, TExtraModel>;
  readonly #context: UcsFormatterContext;
  #lib!: UcsLib;
  #isFirst!: boolean;
  #mayBeFirst!: boolean;
  #entryIdx!: UcsMapEntryIdx;

  constructor(
    args: UcsFormatterSignature.AllValues,
    schema: UcMap.Schema<TEntriesModel, TExtraModel>,
    context: UcsFormatterContext,
  );

  constructor(
    { writer, value }: UcsFormatterSignature.AllValues,
    schema: UcMap.Schema<TEntriesModel, TExtraModel>,
    context: UcsFormatterContext,
  ) {
    this.#writer = writer;
    this.#value = value;
    this.#schema = schema;
    this.#context = context;
  }

  get context(): UcsFormatterContext {
    return this.#context;
  }

  get lib(): UcsLib {
    return this.#lib;
  }

  write(): EsSnippet {
    this.#isFirst = true;
    this.#mayBeFirst = true;
    this.#entryIdx = new UcsMapEntryIdx();

    const { entries, extra } = this.#schema;

    return (code, scope) => {
      this.#lib = scope.get(UcsLib);

      code.write(this.#entryIdx.declare());

      const entryList = Object.entries<UcSchema>(entries);

      if (entryList.length) {
        code.write(this.#writeEntries(entryList));
      }
      if (extra) {
        code.write(this.#writeExtraEntries(scope, extra));
      }

      code.write(this.#writeEnd());
    };
  }

  #writeEntries(entryList: [string, UcSchema][]): EsSnippet {
    const entryValue = new EsVarSymbol('entryValue');

    return code => {
      code.write(entryValue.let());

      for (const [entryKey, entrySchema] of entryList) {
        code.write(
          esline`${entryValue} = ${this.#value}${esMemberAccessor(entryKey).accessor};`,
          this.#writeEntry(entryKey, entryValue, entrySchema),
        );
      }
    };
  }

  #writeEntry(entryKey: string, value: EsSnippet, entrySchema: UcSchema): EsSnippet {
    const writer = this.#writer;
    const writePrefix = this.#writeEntryPrefix(entryKey, entrySchema);
    const writeValue = this.writeEntryValue(
      {
        writer,
        value,
        asItem: '0',
      },
      entryKey,
      entrySchema,
    );

    return code => {
      code.write(
        ucsCheckCharge(
          {
            writer,
            value,
          },
          entrySchema,
          code => {
            code.write(writePrefix, writeValue);
          },
          {
            onNull: code => {
              code.write(
                writePrefix,
                esline`await ${writer}.ready;`,
                esline`${writer}.write(${this.null()});`,
              );
            },
          },
        ),
      );
    };
  }

  #writeEntryPrefix(entryKey: string, entrySchema: UcSchema): EsSnippet {
    const writer = this.#writer;

    if (this.#isFirst) {
      const firstPrefix = this.firstEntryPrefix(entryKey);

      this.#isFirst = false;
      this.#mayBeFirst = !!entrySchema.optional;

      const increment = this.#entryIdx.requireIf(this.#mayBeFirst).increment();

      return code => {
        code.write(
          esline`await ${writer}.ready;`,
          esline`${writer}.write(${firstPrefix});`,
          increment,
        );
      };
    }

    const prefix = this.nextEntryPrefix(entryKey);

    if (this.#mayBeFirst) {
      const firstPrefix = this.firstEntryPrefix(entryKey);
      const postIncrement = this.#entryIdx.postIncrement();

      this.#mayBeFirst = !!entrySchema.optional;

      return code => {
        code.write(
          esline`await ${writer}.ready;`,
          esline`${writer}.write(${postIncrement} ? ${prefix} : ${firstPrefix});`,
        );
      };
    }

    const increment = this.#entryIdx.increment();

    return code => {
      code.write(esline`await ${writer}.ready;`, esline`${writer}.write(${prefix});`, increment);
    };
  }

  protected abstract firstEntryPrefix(entryKey: string): EsSnippet;

  protected abstract nextEntryPrefix(entryKey: string): EsSnippet;

  protected writeEntryValue(
    args: UcsFormatterSignature.AllValues,
    entryKey: string,
    entrySchema: UcSchema,
  ): EsSnippet {
    return this.#context.format(
      ucOptional(ucNullable(entrySchema, false), false),
      args,
      (schema, context) => {
        throw new UnsupportedUcSchemaError(
          schema,
          `${context}: Can not serialize entry "${esEscapeString(entryKey)}" of type "${ucModelName(
            schema,
          )}"`,
        );
      },
    );
  }

  #writeExtraEntries(scope: EsScope, extraSchema: UcSchema): EsSnippet {
    const names = scope.ns.names.nest();
    const extraKey = names.reserveName('extraKey');
    const extraValue = names.reserveName('extraValue');
    const keys = ucsMapKeys(this.lib, this.#schema);
    const writeExtra = this.#writeExtraEntry(extraKey, extraValue, extraSchema);

    return code => {
      code
        .write(esline`for (const [${extraKey}, ${extraValue}] of Object.entries(${this.#value})) {`)
        .indent(code => {
          if (keys) {
            // Explicit keys specified. Filter them out.
            code
              .write(esline`if (!(${extraKey} in ${keys})) {`)
              .indent(writeExtra)
              .write('}');
          } else {
            // No explicit keys. No need to check.
            code.write(writeExtra);
          }
        })
        .write('}');
    };
  }

  #writeExtraEntry(extraKey: EsSnippet, value: EsSnippet, extraSchema: UcSchema): EsSnippet {
    const writer = this.#writer;
    const writePrefix = this.#writeExtraPrefix(extraKey);
    const writeValue = this.writeExtraValue(
      {
        writer,
        value,
        asItem: '0',
      },
      extraSchema,
    );

    return code => {
      code.write(
        ucsCheckCharge(
          {
            writer,
            value,
          },
          extraSchema,
          code => {
            code.write(writePrefix, writeValue);
          },
          {
            onNull: code => {
              code.write(
                writePrefix,
                esline`await ${writer}.ready;`,
                esline`${writer}.write(${this.null()});`,
              );
            },
          },
        ),
      );
    };
  }

  #writeExtraPrefix(extraKey: EsSnippet): EsSnippet {
    const writeAsIs = UC_MODULE_SERIALIZER.import(ucsWriteAsIs.name);
    const prefix = this.nextExtraPrefix(extraKey);

    if (!this.#mayBeFirst) {
      return esline`await ${writeAsIs}(${this.#writer}, ${prefix});`;
    }

    const firstPrefix = this.firstExtraPrefix(extraKey);
    const postIncrement = this.#entryIdx.postIncrement();

    return esline`await ${writeAsIs}(${
      this.#writer
    }, ${postIncrement} ? ${prefix}: ${firstPrefix});`;
  }

  protected abstract firstExtraPrefix(extraKey: EsSnippet): EsSnippet;

  protected abstract nextExtraPrefix(extraKey: EsSnippet): EsSnippet;

  protected writeExtraValue(
    args: UcsFormatterSignature.AllValues,
    extraSchema: UcSchema,
  ): EsSnippet {
    return this.#context.format(extraSchema, args, (schema, context) => {
      throw new UnsupportedUcSchemaError(
        schema,
        `${context}: Can not serialize extra entry of type "${ucModelName(schema)}"`,
      );
    });
  }

  #writeEnd(): EsSnippet {
    const writer = this.#writer;
    const end = this.endOfMap();

    if (this.#mayBeFirst) {
      const emptyMap = this.emptyMap();
      const hasEntries = this.#entryIdx.get();

      return code => {
        code.write(
          esline`await ${writer}.ready;`,
          esline`${writer}.write(${hasEntries} ? ${end} : ${emptyMap});`,
        );
      };
    }

    return code => {
      code.write(esline`await ${writer}.ready;`, esline`${writer}.write(${end});`);
    };
  }

  protected abstract null(): EsSnippet;

  protected abstract endOfMap(): EsSnippet;

  protected abstract emptyMap(): EsSnippet;

}
