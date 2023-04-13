import { SERIALIZER_MODULE } from '../../impl/module-names.js';
import { UcList } from '../../schema/list/uc-list.js';
import { ucNullable } from '../../schema/uc-nullable.js';
import { ucOptional } from '../../schema/uc-optional.js';
import { ucSchemaName } from '../../schema/uc-schema-name.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccSource } from '../codegen/ucc-code.js';
import { UnsupportedUcSchemaError } from '../unsupported-uc-schema.error.js';
import { UcsFunction } from './ucs-function.js';
import { UcsSetup } from './ucs-setup.js';

export function ucsSupportList(setup: UcsSetup, schema: UcList.Schema): void;
export function ucsSupportList(setup: UcsSetup, { item }: UcList.Schema): void {
  setup.useUcsGenerator('list', ucsWriteList).processSchema(item);
}

function ucsWriteList<TItem, TItemSpec extends UcSchema.Spec<TItem>>(
  fn: UcsFunction,
  schema: UcList.Schema<TItem, TItemSpec>,
  value: string,
  asItem: string,
): UccSource {
  const { lib, ns, args } = fn;
  const openingParenthesis = lib.import(SERIALIZER_MODULE, 'UCS_OPENING_PARENTHESIS');
  const closingParenthesis = lib.import(SERIALIZER_MODULE, 'UCS_CLOSING_PARENTHESIS');
  const emptyList = lib.import(SERIALIZER_MODULE, 'UCS_EMPTY_LIST');
  const comma = lib.import(SERIALIZER_MODULE, 'UCS_COMMA');
  const itemSchema = schema.item.optional
    ? ucOptional(ucNullable(schema.item), false) // Write `undefined` items as `null`
    : schema.item;
  const itemValue = ns.name(`${value}$item`);
  const itemWritten = ns.name(`${value}$itemWritten`);

  return code => {
    code
      .write(`let ${itemWritten} = false;`)
      .write(`for (const ${itemValue} of ${value}) {`)
      .indent(code => {
        code.write(
          `await ${args.writer}.ready;`,
          `${args.writer}.write(${itemWritten} || !${asItem} ? ${comma} : ${openingParenthesis});`,
          `${itemWritten} = true;`,
        );
        try {
          code.write(fn.serialize(itemSchema, itemValue, '1'));
        } catch (cause) {
          throw new UnsupportedUcSchemaError(
            itemSchema,
            `${fn.name}: Can not serialize list item of type "${ucSchemaName(itemSchema)}"`,
            { cause },
          );
        }
      })
      .write(`}`)
      .write(`if (${asItem}) {`)
      .indent(
        `await ${args.writer}.ready;`,
        `${args.writer}.write(${itemWritten} ? ${closingParenthesis} : ${emptyList});`,
      )
      .write(`} else if (!${itemWritten}) {`)
      .indent(`await ${args.writer}.ready;`, `${args.writer}.write(${comma});`)
      .write(`}`);
  };
}
