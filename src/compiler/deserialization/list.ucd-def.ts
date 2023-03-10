import { DESERIALIZER_MODULE } from '../../impl/module-names.js';
import { UcList } from '../../schema/uc-list.js';
import { ucSchemaName } from '../../schema/uc-schema-name.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccNamespace } from '../ucc-namespace.js';
import { UnsupportedUcSchemaError } from '../unsupported-uc-schema.error.js';
import { ucdInitUcrx, UcdUcrx, UcdUcrxLocation } from './ucd-ucrx.js';

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

  constructor(location: UcdUcrxLocation<TItem[], UcList.Schema<TItem, TItemSpec>>) {
    this.#location = location;
    this.#ns = location.fn.ns.nest();
  }

  get schema(): UcList.Schema<TItem, TItemSpec> {
    return this.location.schema;
  }

  get location(): UcdUcrxLocation<TItem[], UcList.Schema<TItem, TItemSpec>> {
    return this.#location;
  }

  initRx(): UcdUcrx {
    const {
      lib,
      args: { reader },
    } = this.location.fn;

    const { nullable, item } = this.schema;
    const { fn, setter } = this.location;
    const addItem = this.#ns.name('addItem');
    const readUcList = lib.import(DESERIALIZER_MODULE, 'readUcList');

    return (prefix, suffix) => code => {
      const nullableFlag = (nullable ? 1 : 0) | (item.nullable ? 2 : 0);

      code.write(`${prefix}${readUcList}(${reader}, ${setter}, ${addItem} => {`);

      try {
        code.indent(
          ucdInitUcrx(fn.initRx({ schema: item, setter: addItem }), {
            prefix: 'return ',
            suffix: ';',
          }),
        );
      } catch (cause) {
        throw new UnsupportedUcSchemaError(
          item,
          `${fn.name}: Can not deserialize list item of type "${ucSchemaName(item)}"`,
          { cause },
        );
      }

      code.write('}' + (nullableFlag ? `, ${nullableFlag}` : ``) + ')' + suffix);
    };
  }

}
