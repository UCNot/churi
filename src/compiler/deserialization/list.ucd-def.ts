import { CHURI_MODULE } from '../../impl/module-names.js';
import { UcList } from '../../schema/list/uc-list.js';
import { ucSchemaName } from '../../schema/uc-schema-name.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccArgs } from '../codegen/ucc-args.js';
import { UccSource } from '../codegen/ucc-code.js';
import { UccMethod } from '../codegen/ucc-method.js';
import { BaseUcrxTemplate } from '../rx/base.ucrx-template.js';
import { CustomUcrxTemplate } from '../rx/custom.ucrx-template.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxMethod } from '../rx/ucrx-method.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { UcrxArgs } from '../rx/ucrx.args.js';
import { UnsupportedUcSchemaError } from '../unsupported-uc-schema.error.js';
import { UcdLib } from './ucd-lib.js';

export class ListUcdDef<
  TItem = unknown,
  TItemSpec extends UcSchema.Spec<TItem> = UcSchema.Spec<TItem>,
> extends CustomUcrxTemplate<TItem[], UcList.Schema<TItem, TItemSpec>> {

  static get type(): string | UcSchema.Class {
    return 'list';
  }

  static createTemplate<TItem, TItemSpec extends UcSchema.Spec<TItem>>(
    lib: UcdLib,
    schema: UcList.Schema<TItem, TItemSpec>,
  ): UcrxTemplate<TItem[], UcList.Schema<TItem, TItemSpec>> {
    return new this(lib, schema);
  }

  #itemTemplate?: UcrxTemplate;
  #allocation?: ListUcdDef.Allocation;

  constructor(lib: UcdLib, schema: UcList.Schema<TItem, TItemSpec>) {
    super({
      lib,
      schema,
      args: ['set', 'context'],
    });
  }

  override get base(): BaseUcrxTemplate {
    return this.#isMatrix ? this.lib.voidUcrx : this.#getItemTemplate();
  }

  override get permitsSingle(): boolean {
    return false;
  }

  protected override discoverTypes(): Set<string> {
    if (!this.#isMatrix || this.#getItemTemplate().permitsSingle) {
      return new Set(this.#getItemTemplate().expectedTypes);
    }

    return super.discoverTypes();
  }

  protected override callSuperConstructor(
    base: BaseUcrxTemplate,
    args: UcrxArgs.ByName,
  ): UccSource | undefined {
    const { addItem } = this.#getAllocation();

    if (this.#isMatrix) {
      return;
    }

    return `super(${base.args.call({
      ...args,
      set: `item => ${addItem.call('this', { item: 'item' })}`,
    })});`;
  }

  protected override declareConstructor(args: UcrxArgs.ByName): UccSource;
  protected override declareConstructor({ set, context }: UcrxArgs.ByName): UccSource {
    return code => {
      const { context: contextVar, setList } = this.#getAllocation();

      code.write(`${contextVar} = ${context};`);

      if (!this.#isMatrix) {
        code.write(`${setList} = ${set};`);
      }
    };
  }

  protected override overrideMethods(): UcrxTemplate.MethodDecls | undefined {
    const allocation = this.#getAllocation();

    return allocation.isMatrix
      ? this.#declareMatrixMethods(allocation)
      : this.#declareListMethods(allocation);
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
    return !!this.#getItemTemplate().definedMethods.and;
  }

  #getAllocation(): ListUcdDef.Allocation {
    if (this.#allocation) {
      return this.#allocation;
    }

    const isMatrix = this.#isMatrix;
    const context = this.declarePrivate('context');
    const items = this.declarePrivate('items', '[]');
    const addItem = this.declarePrivateMethod(
      'addItem',
      new UccArgs('item'),
      ({ item }) => `${items}.push(${item})`,
    );
    const listCreated = this.declarePrivate('listCreated', '0');
    const isNull = this.#isNullableList ? this.declarePrivate('isNull', '0') : undefined;

    if (isMatrix) {
      const itemTemplate = this.#getItemTemplate();
      const itemRx = this.declarePrivate('_itemRx');

      return (this.#allocation = {
        isMatrix,
        context,
        setList: 'this.set',
        items,
        addItem,
        itemRx: itemTemplate.permitsSingle
          ? this.declarePrivateMethod<''>(
              'itemRx',
              [],
              () => `return ${itemRx} ??= `
                + itemTemplate.newInstance({ set: addItem.bind('this'), context })
                + ';',
            )
          : undefined,
        listCreated,
        isNull,
      });
    }

    return (this.#allocation = {
      isMatrix,
      context,
      setList: this.declarePrivate('setList'),
      items,
      addItem,
      listCreated,
      isNull,
    });
  }

  #getItemTemplate(): BaseUcrxTemplate {
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
        `${ucSchemaName(this.schema)}: Can not deserialize list item of type "${ucSchemaName(
          item,
        )}"`,
        { cause },
      );
    }
  }

  #declareListMethods(allocation: ListUcdDef.ListAllocation): UcrxTemplate.MethodDecls {
    const { context, listCreated, isNull } = allocation;
    const { lib } = this;
    const ucrxUnexpectedSingleItemError = lib.import(CHURI_MODULE, 'ucrxUnexpectedSingleItemError');
    const ucrxUnexpectedNullError = lib.import(CHURI_MODULE, 'ucrxUnexpectedNullError');

    return {
      and: () => code => {
        code.write(`return ${listCreated} = 1;`);
      },
      nul: isNull
        ? () => code => {
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
      end: () => code => {
        if (isNull) {
          code
            .write(`if (${isNull}) {`)
            .indent(this.storeNull(allocation))
            .write(`} else if (${listCreated}) {`);
        } else {
          code.write(`if (${listCreated}) {`);
        }

        code
          .indent(this.storeItems(allocation))
          .write(`} else {`)
          .indent(`${context}.error(${ucrxUnexpectedSingleItemError}(this));`)
          .write(`}`);
      },
    };
  }

  #declareMatrixMethods(allocation: ListUcdDef.MatrixAllocation): UcrxTemplate.MethodDecls {
    const { context, addItem, itemRx, listCreated, isNull } = allocation;
    const itemTemplate = this.#getItemTemplate();

    const coreMethods: {
      [key: string]: UcrxMethod.Body<any> | undefined;
    } = {};
    const custom: UcrxTemplate.Method<any>[] = [];

    if (itemRx) {
      for (const [key, method] of Object.entries(itemTemplate.definedMethods)) {
        if (method) {
          if (key in UcrxCore) {
            coreMethods[key] = this.#delegate(allocation);
          } else {
            custom.push({ method: method.method, body: this.#delegate(allocation) });
          }
        }
      }
    }

    return {
      ...coreMethods,
      nls: () => code => {
        const itemTemplate = this.#getItemTemplate();

        code.write(
          'return '
            + itemTemplate.newInstance({
              set: addItem.bind('this'),
              context,
            })
            + ';',
        );
      },
      and: () => code => {
        code.write(`return ${listCreated} = 1;`);
      },
      end: () => code => {
        if (isNull) {
          code
            .write(`if (${isNull}) {`)
            .indent(this.storeNull(allocation))
            .write(`} else if (${listCreated}) {`);
        } else {
          code.write(`if (${listCreated}) {`);
        }
        code.indent(this.storeItems(allocation)).write(`}`);
      },
      nul: this.#isNullable
        ? () => code => {
            code
              .write(`if (${listCreated}) {`)
              .indent(code => {
                if (this.#isNullableItem) {
                  code.write(this.addNull(allocation), `return 1;`);
                } else {
                  code.write(`return 0;`);
                }
              })
              .write(`}`)
              .write(code => {
                if (isNull) {
                  code.write(`return ${isNull} = 1;`);
                } else {
                  code.write(`return 0;`);
                }
              });
          }
        : undefined,
      custom,
    };
  }

  addNull(allocation: ListUcdDef.Allocation): UccSource;
  addNull({ addItem }: ListUcdDef.Allocation): UccSource {
    return addItem.call('this', { item: 'null' }) + ';';
  }

  storeItems(allocation: ListUcdDef.Allocation): UccSource;
  storeItems({ setList, items }: ListUcdDef.Allocation): UccSource {
    return `${setList}(${items});`;
  }

  storeNull(allocation: ListUcdDef.Allocation): UccSource;
  storeNull({ setList }: ListUcdDef.Allocation): UccSource {
    return `${setList}(null);`;
  }

  #delegate<TArg extends string>({
    itemRx,
    listCreated,
  }: ListUcdDef.MatrixAllocation): UcrxMethod.Body<TArg> {
    return (args, method) => code => {
      code
        .write(`if (${listCreated}) {`)
        .indent(`return ` + method.call(itemRx!.call('this'), args) + ';')
        .write('}')
        .write('return 0;');
    };
  }

}

export namespace ListUcdDef {
  export type Allocation = MatrixAllocation | ListAllocation;

  export interface ListAllocation {
    readonly isMatrix: false;
    readonly context: string;
    readonly setList: string;
    readonly items: string;
    readonly listCreated: string;
    readonly addItem: UccMethod<'item'>;
    readonly isNull?: string | undefined;
  }

  export interface MatrixAllocation {
    readonly isMatrix: true;
    readonly context: string;
    readonly setList: string;
    readonly items: string;
    readonly listCreated: string;
    readonly addItem: UccMethod<'item'>;
    readonly itemRx: UccMethod<''> | undefined;
    readonly isNull?: string | undefined;
  }
}
