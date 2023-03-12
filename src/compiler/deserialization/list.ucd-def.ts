import { lazyValue } from '@proc7ts/primitives';
import { CHURI_MODULE } from '../../impl/module-names.js';
import { UcList } from '../../schema/uc-list.js';
import { ucSchemaName } from '../../schema/uc-schema-name.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../ucc-code.js';
import { UccNamespace } from '../ucc-namespace.js';
import { uccInitProperty } from '../ucc-object-init.js';
import { UnsupportedUcSchemaError } from '../unsupported-uc-schema.error.js';
import { ucdCreateUcrx, UcdUcrx, UcdUcrxLocation } from './ucd-ucrx.js';

export class ListUcdDef<
  TItem = unknown,
  TItemSpec extends UcSchema.Spec<TItem> = UcSchema.Spec<TItem>,
> {

  static get type(): string | UcSchema.Class {
    return 'list';
  }

  static initRx<TItem, TItemSpec extends UcSchema.Spec<TItem>>(
    location: UcdUcrxLocation<TItem[], UcList.Schema<TItem, TItemSpec>>,
  ): UcdUcrx {
    return location.schema.initRx?.(location) ?? new this(location).initRx();
  }

  readonly #location: UcdUcrxLocation<TItem[], UcList.Schema<TItem, TItemSpec>>;
  readonly #ns: UccNamespace;

  readonly #varListCreated = lazyValue(() => this.#ns.name('listCreated'));
  readonly #varItems = lazyValue(() => this.#ns.name('items'));
  readonly #varIsNull = lazyValue(() => this.#ns.name('isNull'));
  readonly #varAddItem = lazyValue(() => this.#ns.name('addItem'));

  constructor(location: UcdUcrxLocation<TItem[], UcList.Schema<TItem, TItemSpec>>) {
    this.#location = location;
    this.#ns = location.ns.nest();
  }

  get schema(): UcList.Schema<TItem, TItemSpec> {
    return this.location.schema;
  }

  get location(): UcdUcrxLocation<TItem[], UcList.Schema<TItem, TItemSpec>> {
    return this.#location;
  }

  get #isNullableList(): boolean | undefined {
    return this.schema.nullable;
  }

  get #isNullableItem(): boolean | undefined {
    return this.schema.item.nullable;
  }

  get #isNullable(): boolean | undefined {
    return this.#isNullableList || this.#isNullableItem;
  }

  initRx(): UcdUcrx {
    const itemRx = this.#itemRx();

    if (itemRx.properties.ls) {
      return this.#initMatrixRx(itemRx);
    }

    return this.#initListRx(itemRx);
  }

  #itemRx(): UcdUcrx {
    const {
      location: { fn },
      schema: { item },
    } = this;

    try {
      return fn.initRx({ ns: this.#ns, schema: item, setter: this.#varAddItem() });
    } catch (cause) {
      throw new UnsupportedUcSchemaError(
        item,
        `${fn.name}: Can not deserialize list item of type "${ucSchemaName(item)}"`,
        { cause },
      );
    }
  }

  #initListRx(itemRx: UcdUcrx): UcdUcrx {
    const listCreated = this.#varListCreated();
    const isNull = this.#varIsNull();
    const items = this.#varItems();
    let addNull: string | undefined;
    const {
      location: {
        fn: {
          lib,
          args: { reader },
        },
        setter,
      },
    } = this;
    const ucrxUnexpectedSingleItemError = lib.import(CHURI_MODULE, 'ucrxUnexpectedSingleItemError');
    const ucrxUnexpectedNullError = lib.import(CHURI_MODULE, 'ucrxUnexpectedNullError');

    if (this.#isNullableList && itemRx.properties.nul) {
      addNull = this.#ns.name('addNull');
    }

    return {
      init: code => {
        code.write(this.#init());
        if (itemRx.init) {
          code.write(itemRx.init);
        }
        if (addNull) {
          code.write(uccInitProperty(itemRx.properties.nul!, `const ${addNull} = `, ';', 'nul'));
        }
      },
      properties: {
        ...itemRx.properties,
        em: (prefix, suffix) => code => {
          code.write(`${prefix}() => ${listCreated} = 1${suffix}`);
        },
        ls: (prefix, suffix) => code => {
          code
            .write(`${prefix.asMethod()}{`)
            .indent(code => {
              if (this.#isNullableList) {
                code
                  .write(`if (${isNull}) {`)
                  .indent(`${setter}(null);`)
                  .write(`} else if (${listCreated}) {`);
              } else {
                code.write(`if (${listCreated}) {`);
              }

              code
                .indent(`${setter}(${items});`)
                .write(`} else {`)
                .indent(`${reader}.error(${ucrxUnexpectedSingleItemError}(this));`)
                .write(`}`);
            })
            .write(`}${suffix}`);
        },
        nul: this.#isNullableList
          ? (prefix, suffix) => code => {
              code
                .write(`${prefix.asMethod()}{`)
                .indent(code => {
                  code
                    .write(`if (${listCreated}) {`)
                    .indent(code => {
                      code.write(`${isNull} = 0;`);
                      if (addNull) {
                        code.write(`return ${addNull}();`);
                      } else {
                        code.write(`${reader}.error(${ucrxUnexpectedNullError}(this));`);
                      }
                    })
                    .write(`} else {`)
                    .indent(`${isNull} = 1;`)
                    .write(`}`)
                    .write('return 1;');
                })
                .write(`}${suffix}`);
            }
          : itemRx.properties.nul,
      },
    };
  }

  #initMatrixRx(itemRx: UcdUcrx): UcdUcrx {
    const listCreated = this.#varListCreated();
    const isNull = this.#varIsNull();
    const items = this.#varItems();
    const {
      location: {
        fn: {
          lib,
          args: { reader },
        },
        setter,
      },
    } = this;
    const ucrxUnexpectedNullError = lib.import(CHURI_MODULE, 'ucrxUnexpectedNullError');

    return {
      init: this.#init(),
      properties: {
        nls: (prefix, suffix) => code => {
          code
            .write(`${prefix.asMethod()}{`)
            .indent(code => {
              code.write(ucdCreateUcrx(itemRx, { prefix: 'return ', suffix: ';' }));
            })
            .write(`}${suffix}`);
        },
        em: (prefix, suffix) => code => {
          if (this.#isNullableItem && this.#isNullableList) {
            code
              .write(`${prefix.asMethod()}{`)
              .indent(code => {
                code
                  .write(`if (!${listCreated}) {`)
                  .indent(code => {
                    code
                      .write(`${listCreated} = 1;`)
                      .write(`if (${isNull}) {`)
                      .indent(`${isNull} = 0;`, `${items}.push(null);`)
                      .write(`}`);
                  })
                  .write(`}`)
                  .write(`return 1;`);
              })
              .write(`}${suffix}`);
          } else {
            code.write(`${prefix}() => ${listCreated} = 1${suffix}`);
          }
        },
        ls: (prefix, suffix) => code => {
          code
            .write(`${prefix.asMethod()}{`)
            .indent(code => {
              if (this.#isNullableList) {
                code
                  .write(`if (${isNull}) {`)
                  .indent(`${setter}(null);`)
                  .write(`} else if (${listCreated}) {`);
              } else {
                code.write(`if (${listCreated}) {`);
              }
              code.indent(`${setter}(${items});`).write(`}`);
            })
            .write(`}${suffix}`);
        },
        nul: this.#isNullable
          ? (prefix, suffix) => code => {
              code
                .write(`${prefix.asMethod()}{`)
                .indent(code => {
                  code
                    .write(`if (${listCreated}) {`)
                    .indent(code => {
                      if (this.#isNullableList && !this.#isNullableItem) {
                        code.write(`${isNull} = 1;`);
                      }
                      if (this.#isNullableItem) {
                        code.write(`${items}.push(null);`);
                      } else {
                        code.write(`${reader}.error(${ucrxUnexpectedNullError}(this));`);
                      }
                    })
                    .write(`} else {`)
                    .indent(code => {
                      if (this.#isNullableList) {
                        code.write(`${isNull} = 1;`);
                      } else {
                        code.write(`${reader}.error(${ucrxUnexpectedNullError}(this));`);
                      }
                    })
                    .write(`}`)
                    .write(`return 1;`);
                })
                .write(`}${suffix}`);
            }
          : undefined,
      },
    };
  }

  #init(): UccCode.Source {
    const items = this.#varItems();

    return code => {
      code
        .write(`let ${this.#varListCreated()} = 0;`, `const ${items} = [];`)
        .write(`const ${this.#varAddItem()} = value => {`)
        .indent(`${items}.push(value);`, `return 1;`)
        .write(`};`);

      if (this.#isNullableList) {
        code.write(`let ${this.#varIsNull()} = 0;`);
      }
    };
  }

}
