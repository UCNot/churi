import { DESERIALIZER_MODULE } from '../../impl/module-names.js';
import { UcList } from '../../schema/uc-list.js';
import { ucSchemaName } from '../../schema/uc-schema-name.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../ucc-code.js';
import { UccNamespace } from '../ucc-namespace.js';
import { UnsupportedUcSchemaError } from '../unsupported-uc-schema.error.js';
import { UcdTypeDef } from './ucd-type-def.js';

export class ListUcdDef<
  TItem = unknown,
  TItemSpec extends UcSchema.Spec<TItem> = UcSchema.Spec<TItem>,
> implements UccCode.Fragment {

  static get type(): string | UcSchema.Class {
    return 'list';
  }

  static deserialize<TItem, TItemSpec extends UcSchema.Spec<TItem>>(
    schema: UcList.Schema<TItem, TItemSpec>,
    location: UcdTypeDef.Location,
  ): UccCode.Source {
    return schema.deserialize?.(schema, location) ?? new this(schema, location);
  }

  readonly #schema: UcList.Schema<TItem, TItemSpec>;
  readonly #location: UcdTypeDef.Location;

  readonly #ns: UccNamespace;

  constructor(schema: UcList.Schema<TItem, TItemSpec>, location: UcdTypeDef.Location) {
    this.#schema = schema;
    this.#location = location;
    this.#ns = location.fn.ns.nest();
  }

  get schema(): UcList.Schema<TItem, TItemSpec> {
    return this.#schema;
  }

  get location(): UcdTypeDef.Location {
    return this.#location;
  }

  toCode(): UccCode.Source {
    const {
      lib,
      args: { reader },
    } = this.location.fn;

    const { nullable, item } = this.schema;
    const { fn, setter, prefix, suffix } = this.location;
    const listRx = this.#ns.name('listRx');
    const addItem = this.#ns.name('addItem');
    const readUcList = lib.import(DESERIALIZER_MODULE, 'readUcList');

    return code => {
      const nullableFlag = (nullable ? 1 : 0) | (item.nullable ? 2 : 0);

      code.write(`const ${listRx} = ${readUcList}(${reader}, ${setter}, ${addItem} => {`);

      try {
        code.indent(fn.deserialize(item, { setter: addItem, prefix: 'return ', suffix: ';' }));
      } catch (cause) {
        throw new UnsupportedUcSchemaError(
          item,
          `${fn.name}: Can not deserialize list item of type "${ucSchemaName(item)}"`,
          { cause },
        );
      }

      code
        .write(nullableFlag ? `}, ${nullableFlag});` : `});`)
        .write(`${prefix}${listRx}.rx${suffix}`)
        .write(`${listRx}.end();`);
    };
  }

}
