import { CHURI_MODULE } from '../../impl/module-names.js';
import { UcList } from '../../schema/uc-list.js';
import { ucSchemaName } from '../../schema/uc-schema-name.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { UcrxArgs } from '../rx/ucrx.args.js';
import { UccArgs } from '../ucc-args.js';
import { UccCode } from '../ucc-code.js';
import { UccMethodRef } from '../ucc-method-ref.js';
import { UnsupportedUcSchemaError } from '../unsupported-uc-schema.error.js';
import { UcdLib } from './ucd-lib.js';

export class ListUcdDef<
  TItem = unknown,
  TItemSpec extends UcSchema.Spec<TItem> = UcSchema.Spec<TItem>,
> extends UcrxTemplate<TItem[], UcList.Schema<TItem, TItemSpec>> {

  static get type(): string | UcSchema.Class {
    return 'list';
  }

  static createTemplate<TItem, TItemSpec extends UcSchema.Spec<TItem>>(
    lib: UcdLib,
    schema: UcList.Schema<TItem, TItemSpec>,
  ): UcrxTemplate<TItem[], UcList.Schema<TItem, TItemSpec>> {
    return schema.createTemplate?.(lib, schema) ?? new this(lib, schema);
  }

  #itemTemplate?: UcrxTemplate;
  #allocation?: ListUcdDef.Allocation;

  constructor(lib: UcdLib, schema: UcList.Schema<TItem, TItemSpec>) {
    const deserializer = lib.deserializerFor(schema);

    super({
      lib,
      schema,
      base: () => this.#detectBase(),
      className: deserializer.name + '$rx',
      args: ['set', 'context'],
      methods: () => this.#declareMethods(),
    });
  }

  protected override declareConstructor(args: UcrxArgs.ByName): UccCode.Source<UccCode>;
  protected override declareConstructor({ context }: UcrxArgs.ByName): UccCode.Source<UccCode> {
    return code => {
      const { context: contextVar, itemRx, addItem } = this.#getAllocation();
      const itemTemplate = this.#getItemTemplate();

      code.write(
        `${contextVar} = ${context};`,
        itemTemplate.newInstance({
          args: { set: `this.${addItem.name}.bind(this)`, context },
          prefix: `${itemRx} = `,
          suffix: ';',
        }),
      );
    };
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

  get #isMatrix(): boolean {
    return !!this.#getItemTemplate().definedMethods.ls;
  }

  #getAllocation(): ListUcdDef.Allocation {
    if (this.#allocation) {
      return this.#allocation;
    }

    const items = this.declarePrivate('items', '[]');

    return (this.#allocation = {
      context: this.declarePrivate('context'),
      itemRx: this.#isMatrix ? this.declarePrivate('itemRx') : undefined,
      items,
      addItem: this.declarePrivateMethod(
        'addItem',
        new UccArgs('item'),
        ({ item }) => `${items}.push(${item})`,
      ),
      listCreated: this.declarePrivate('listCreated', '0'),
      isNull: this.#isNullableList ? this.declarePrivate('isNull', '0') : undefined,
    });
  }

  #getItemTemplate(): UcrxTemplate {
    if (this.#itemTemplate) {
      return this.#itemTemplate;
    }

    const {
      schema: { item },
    } = this;

    try {
      return (this.#itemTemplate = this.lib.ucrxTemplateFor(item));
    } catch (cause) {
      throw new UnsupportedUcSchemaError(
        item,
        `${this.className}: Can not deserialize list item of type "${ucSchemaName(item)}"`,
        { cause },
      );
    }
  }

  #detectBase(): UcrxTemplate {
    return this.#isMatrix ? this.lib.voidUcrx : this.#getItemTemplate();
  }

  #declareMethods(): UcrxTemplate.MethodDecls {
    const allocation = this.#getAllocation();

    return allocation.itemRx != null
      ? this.#declareMatrixMethods(allocation)
      : this.#declareListMethods(allocation);
  }

  #declareListMethods({
    context,
    items,
    listCreated,
    isNull,
  }: ListUcdDef.ListAllocation): UcrxTemplate.MethodDecls {
    const { lib } = this;
    const ucrxUnexpectedSingleItemError = lib.import(CHURI_MODULE, 'ucrxUnexpectedSingleItemError');
    const ucrxUnexpectedNullError = lib.import(CHURI_MODULE, 'ucrxUnexpectedNullError');

    return {
      em: _location => code => {
        code.write(`return ${listCreated} = 1;`);
      },
      ls: _location => code => {
        if (isNull) {
          code
            .write(`if (${isNull}) {`)
            .indent(`this.set(null);`)
            .write(`} else if (${listCreated}) {`);
        } else {
          code.write(`if (${listCreated}) {`);
        }

        code
          .indent(`this.set(${items});`)
          .write(`} else {`)
          .indent(`${context}.error(${ucrxUnexpectedSingleItemError}(this));`)
          .write(`}`);
      },
      nul: isNull
        ? _location => code => {
            code
              .write(`if (${listCreated}) {`)
              .indent(code => {
                code.write(`${isNull} = 0;`);
                if (this.#isNullableItem) {
                  code.write(`return super.nul();`);
                } else {
                  code.write(`${context}.error(${ucrxUnexpectedNullError}(this));`);
                }
              })
              .write(`}`)
              .write(`return ${isNull} = 1;`);
          }
        : undefined,
    };
  }

  #declareMatrixMethods({
    context,
    itemRx,
    items,
    listCreated,
    isNull,
  }: ListUcdDef.MatrixAllocation): UcrxTemplate.MethodDecls {
    const { lib } = this;
    const ucrxUnexpectedNullError = lib.import(CHURI_MODULE, 'ucrxUnexpectedNullError');

    return {
      nls: _location => code => {
        code.write(`return ${itemRx};`);
      },
      em: _location => code => {
        if (this.#isNullableItem && this.#isNullableList) {
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
        } else {
          code.write(`return ${listCreated} = 1;`);
        }
      },
      ls: _location => code => {
        if (this.#isNullableList) {
          code
            .write(`if (${isNull}) {`)
            .indent(`this.set(null);`)
            .write(`} else if (${listCreated}) {`);
        } else {
          code.write(`if (${listCreated}) {`);
        }
        code.indent(`this.set(${items});`).write(`}`);
      },
      nul: this.#isNullable
        ? _location => code => {
            code
              .write(`if (${listCreated}) {`)
              .indent(code => {
                if (this.#isNullableList && !this.#isNullableItem) {
                  code.write(`${isNull} = 1;`);
                }
                if (this.#isNullableItem) {
                  code.write(`${items}.push(null);`);
                } else {
                  code.write(`${context}.error(${ucrxUnexpectedNullError}(this));`);
                }
              })
              .write(`} else {`)
              .indent(code => {
                if (this.#isNullableList) {
                  code.write(`${isNull} = 1;`);
                } else {
                  code.write(`${context}.error(${ucrxUnexpectedNullError}(this));`);
                }
              })
              .write(`}`)
              .write(`return 1;`);
          }
        : undefined,
    };
  }

}

export namespace ListUcdDef {
  export type Allocation = MatrixAllocation | ListAllocation;

  export interface ListAllocation {
    readonly context: string;
    readonly itemRx?: undefined;
    readonly items: string;
    readonly listCreated: string;
    readonly addItem: UccMethodRef<'item'>;
    readonly isNull?: string | undefined;
  }

  export interface MatrixAllocation {
    readonly context: string;
    readonly itemRx: string;
    readonly items: string;
    readonly listCreated: string;
    readonly addItem: UccMethodRef<'item'>;
    readonly isNull?: string | undefined;
  }
}
