import {
  EsArg,
  EsField,
  EsFieldHandle,
  EsMemberVisibility,
  EsMethod,
  EsMethodHandle,
  EsProperty,
  EsPropertyHandle,
  EsSignature,
  EsSnippet,
  esline,
} from 'esgen';
import { UcList } from '../../schema/list/uc-list.js';
import { ucModelName } from '../../schema/uc-model-name.js';
import { UcModel } from '../../schema/uc-schema.js';
import { UC_MODULE_CHURI } from '../impl/uc-modules.js';
import { ucSchemaTypeSymbol } from '../impl/uc-schema-symbol.js';
import { ucSchemaVariant } from '../impl/uc-schema-variant.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxMethod } from '../rx/ucrx-method.js';
import { UcrxClass, UcrxClassSignature } from '../rx/ucrx.class.js';
import { UnsupportedUcSchemaError } from '../unsupported-uc-schema.error.js';
import { UcdSetup } from './ucd-setup.js';

export class ListUcrxClass<
  TItem = unknown,
  TItemModel extends UcModel<TItem> = UcModel<TItem>,
> extends UcrxClass<UcrxClassSignature.Args, TItem[], UcList.Schema<TItem, TItemModel>> {

  static configureSchemaDeserializer(setup: UcdSetup.Any, { item }: UcList.Schema): void {
    setup.useUcrxClass('list', (lib, schema: UcList.Schema) => new this(lib, schema));
    setup.processModel(item);
  }

  readonly #itemClass: UcrxClass;
  readonly #isMatrix: boolean;

  readonly #context: EsFieldHandle;
  readonly #items: EsFieldHandle;
  readonly #addItem: EsMethodHandle<{ item: EsArg }>;
  readonly #listCreated: EsFieldHandle;
  readonly #isNull: EsFieldHandle | undefined;
  readonly #setList: EsSnippet;
  readonly #setListField: EsFieldHandle | undefined;
  readonly #itemRx: EsPropertyHandle | undefined;

  constructor(lib: UcrxLib, schema: UcList.Schema<TItem, TItemModel>) {
    let itemClass: UcrxClass;

    const { item } = schema;

    try {
      itemClass = lib.ucrxClassFor(item);
    } catch (cause) {
      throw new UnsupportedUcSchemaError(
        item,
        `${ucSchemaTypeSymbol(schema)}: Can not deserialize list item of type "${ucModelName(
          item,
        )}"`,
        { cause },
      );
    }

    const isMatrix = itemClass.isMemberOverridden(UcrxCore.and);

    super({
      schema,
      typeName: 'List' + ucSchemaVariant(schema) + 'Of' + itemClass.typeName,
      baseClass: isMatrix ? lib.baseUcrx : itemClass,
      classConstructor: {
        args: UcrxClassSignature,
      },
    });

    this.#itemClass = itemClass;
    this.#isMatrix = isMatrix;

    this.#context = new EsField('context', { visibility: EsMemberVisibility.Private }).declareIn(
      this,
    );
    this.#items = new EsField('items', { visibility: EsMemberVisibility.Private }).declareIn(this, {
      initializer: () => '[]',
    });
    this.#addItem = this.#declareAddItem();
    this.#listCreated = new EsField('listCreated', {
      visibility: EsMemberVisibility.Private,
    }).declareIn(this, { initializer: () => '0' });
    this.#isNull = this.#isNullableList
      ? new EsField('isNull', { visibility: EsMemberVisibility.Private }).declareIn(this, {
          initializer: () => '0',
        })
      : undefined;

    const [setList, setListField] = this.#declareSetList();

    this.#setList = setList;
    this.#setListField = setListField;

    this.#itemRx = this.#declareItemRx();

    this.#declareConstructor();

    if (isMatrix) {
      this.#declareMatrixMethods();
    } else {
      this.#declareListMethods();
    }
  }

  get itemClass(): UcrxClass {
    return this.#itemClass;
  }

  #declareAddItem(): EsMethodHandle<{ item: EsArg }> {
    return new EsMethod('addItem', {
      args: { item: {} },
      visibility: EsMemberVisibility.Private,
    }).declareIn(this, {
      body: ({
        member: {
          args: { item },
        },
      }) => esline`${this.#items.get('this')}.push(${item});`,
    });
  }

  #declareSetList(): [EsSnippet, EsFieldHandle?] {
    if (this.#isMatrix) {
      return [`this.set`];
    }

    const setList = new EsField('setList', { visibility: EsMemberVisibility.Private }).declareIn(
      this,
    );

    return [setList.get('this'), setList];
  }

  #declareItemRx(): EsPropertyHandle | undefined {
    if (!this.#isMatrix || !this.itemClass.permitsSingle) {
      return;
    }

    const itemRxState = new EsField('_itemRx', {
      visibility: EsMemberVisibility.Private,
    }).declareIn(this);

    return new EsProperty('itemRx', { visibility: EsMemberVisibility.Private }).declareIn(this, {
      get: () => esline`return ${itemRxState.get('this')} ??= ${this.itemClass.instantiate({
          set: esline`item => ${this.#addItem.call('this', { item: 'item' })}`,
          context: this.#context.get('this'),
        })};`,
    });
  }

  #declareConstructor(): void {
    this.declareConstructor({
      body:
        ({
          member: {
            args: { set, context },
          },
        }) => code => {
          code.line(
            'super',
            this.baseClass!.classConstructor.signature.call({
              set: this.#isMatrix
                ? set
                : esline`item => ${this.#addItem.call('this', { item: 'item' })}`,
              context,
            }),
            ';',
          );

          code.line(this.#context.set('this', context), ';');

          if (this.#setListField) {
            code.line(this.#setListField.set('this', set), ';');
          }
        },
    });
  }

  override get permitsSingle(): boolean {
    return false;
  }

  protected createNullItem(): EsSnippet {
    return 'null';
  }

  protected createList(): EsSnippet {
    return this.#items.get('this');
  }

  protected createNullList(): EsSnippet {
    return 'null';
  }

  protected override discoverTypes(types: Set<string>): void {
    if (!this.#isMatrix || this.itemClass.permitsSingle) {
      for (const type of this.itemClass.supportedTypes) {
        types.add(type);
      }
    }

    super.discoverTypes(types);
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

  #declareListMethods(): void {
    const ucrxRejectSingleItem = UC_MODULE_CHURI.import('ucrxRejectSingleItem');
    const ucrxRejectNull = UC_MODULE_CHURI.import('ucrxRejectNull');
    const listCreated = this.#listCreated;
    const isNull = this.#isNull;

    UcrxCore.and.declareIn(this, {
      body: () => esline`return ${listCreated.set('this', '1')};`,
    });

    if (isNull) {
      UcrxCore.nul.declareIn(this, {
        body:
          ({
            member: {
              args: { reject },
            },
          }) => code => {
            code
              .write(esline`if (${listCreated.get('this')}) {`)
              .indent(code => {
                code.line(isNull.set('this', '0'), ';');
                if (this.#isNullableItem) {
                  code.write(esline`return super.nul(${reject});`);
                } else {
                  code.write(esline`return ${reject}(${ucrxRejectNull}(this));`);
                }
              })
              .write(`}`)
              .write(esline`return ${isNull.set('this', '1')};`);
          },
      });
    }

    UcrxCore.end.declareIn(this, {
      body:
        ({
          member: {
            args: { reject },
          },
        }) => code => {
          if (isNull) {
            code
              .write(esline`if (${isNull.get('this')}) {`)
              .indent(esline`${this.#setList}(${this.createNullList()});`)
              .write(esline`} else if (${listCreated.get('this')}) {`);
          } else {
            code.write(esline`if (${listCreated.get('this')}) {`);
          }

          code
            .indent(esline`${this.#setList}(${this.createList()});`)
            .write(`} else {`)
            .indent(esline`${reject}(${ucrxRejectSingleItem}(this));`)
            .write(`}`);
        },
    });
  }

  #declareMatrixMethods(): void {
    const { itemClass } = this;
    const context = this.#context;
    const listCreated = this.#listCreated;
    const isNull = this.#isNull;
    const itemRx = this.#itemRx;

    UcrxCore.nls.declareIn(this, {
      body: () => esline`return ${itemClass.instantiate({
          set: esline`item => ${this.#addItem.call('this', { item: 'item' })}`,
          context: context.get('this'),
        })};`,
    });
    UcrxCore.and.declareIn(this, {
      body: () => esline`return ${listCreated.set('this', '1')};`,
    });
    UcrxCore.end.declareIn(this, {
      body: () => code => {
        if (isNull) {
          code
            .write(esline`if (${isNull.get('this')}) {`)
            .indent(esline`${this.#setList}(${this.createNullList()});`)
            .write(esline`} else if (${listCreated.get('this')}) {`);
        } else {
          code.write(esline`if (${listCreated.get('this')}) {`);
        }
        code.indent(esline`${this.#setList}(${this.createList()});`).write(`}`);
      },
    });
    if (this.#isNullable) {
      UcrxCore.nul.declareIn(this, {
        body:
          ({
            member: {
              args: { reject },
            },
          }) => code => {
            code
              .write(esline`if (${listCreated.get('this')}) {`)
              .indent(code => {
                if (this.#isNullableItem) {
                  code
                    .line(this.#addItem.call('this', { item: this.createNullItem() }), ';')
                    .write(`return 1;`);
                } else {
                  const ucrxRejectNull = UC_MODULE_CHURI.import('ucrxRejectNull');

                  code.write(esline`return ${reject}(${ucrxRejectNull}(this));`);
                }
              })
              .write(`}`)
              .write(code => {
                if (isNull) {
                  code.write(esline`return ${isNull.set('this', '1')};`);
                } else {
                  const ucrxRejectNull = UC_MODULE_CHURI.import('ucrxRejectNull');

                  code.write(esline`return ${reject}(${ucrxRejectNull}(this));`);
                }
              });
          },
      });
    }

    if (itemRx) {
      for (const { member } of itemClass.members()) {
        if (
          itemClass.isMemberOverridden(member)
          && member instanceof UcrxMethod
          && !this.findMember(member)?.declared
        ) {
          this.#delegate(member, itemRx);
        }
      }
    }
  }

  #delegate<TArgs extends EsSignature.Args>(
    method: UcrxMethod<TArgs>,
    itemRx: EsPropertyHandle,
  ): void {
    method.declareIn(this, {
      body:
        ({ getHandle, member: { args } }) => code => {
          code
            .write(esline`if (${this.#listCreated.get('this')}) {`)
            .indent(
              esline`return ${getHandle().call(
                itemRx.get('this'),
                args as EsSignature.ValuesOf<EsSignature.Args> as EsSignature.ValuesOf<TArgs>,
              )};`,
            )
            .write('}')
            .write('return 0;');
        },
    });
  }

}
