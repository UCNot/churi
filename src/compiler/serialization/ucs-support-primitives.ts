import { SERIALIZER_MODULE } from '../../impl/module-names.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode, UccSource } from '../codegen/ucc-code.js';
import { ucsCheckConstraints } from '../impl/ucs-check-constraints.js';
import { UcsFunction } from './ucs-function.js';
import { UcsSetup } from './ucs-setup.js';

export function ucsSupportPrimitives(setup: UcsSetup): void {
  setup
    .useUcsGenerator(BigInt, ucsWriteBigInt)
    .useUcsGenerator(Boolean, ucsWriteBoolean)
    .useUcsGenerator(Number, ucsWriteNumber)
    .useUcsGenerator(String, ucsWriteString);
}

function ucsWriteBigInt(fn: UcsFunction, schema: UcSchema, value: string): UccSource {
  const { lib, args } = fn;
  const writeBigInt = lib.import(SERIALIZER_MODULE, 'writeUcBigInt');

  return ucsCheckConstraints(fn, schema, value, `await ${writeBigInt}(${args.writer}, ${value});`);
}

function ucsWriteBoolean(fn: UcsFunction, schema: UcSchema, value: string): UccSource {
  const { lib, args } = fn;
  const ucsTrue = lib.import(SERIALIZER_MODULE, 'UCS_TRUE');
  const ucsFalse = lib.import(SERIALIZER_MODULE, 'UCS_FALSE');

  return ucsCheckConstraints(fn, schema, value, function writeBoolean(code: UccCode) {
    code.write(
      `await ${args.writer}.ready;`,
      `${args.writer}.write(${value} ? ${ucsTrue} : ${ucsFalse});`,
    );
  });
}

function ucsWriteNumber(fn: UcsFunction, schema: UcSchema, value: string): UccSource {
  const { lib, args } = fn;
  const writeNumber = lib.import(SERIALIZER_MODULE, 'writeUcNumber');

  return ucsCheckConstraints(fn, schema, value, `await ${writeNumber}(${args.writer}, ${value});`);
}

function ucsWriteString(fn: UcsFunction, schema: UcSchema, value: string): UccSource {
  const { lib, args } = fn;
  const writeString = lib.import(SERIALIZER_MODULE, 'writeUcString');

  return ucsCheckConstraints(fn, schema, value, `await ${writeString}(${args.writer}, ${value});`);
}
