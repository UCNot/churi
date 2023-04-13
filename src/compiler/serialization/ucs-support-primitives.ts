import { SERIALIZER_MODULE } from '../../impl/module-names.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccSource } from '../codegen/ucc-code.js';
import { UcsFunction } from './ucs-function.js';
import { UcsSetup } from './ucs-setup.js';

export function ucsSupportPrimitives(setup: UcsSetup): void {
  setup
    .useUcsGenerator(BigInt, ucsWriteBigInt)
    .useUcsGenerator(Boolean, ucsWriteBoolean)
    .useUcsGenerator(Number, ucsWriteNumber)
    .useUcsGenerator(String, ucsWriteString);
}

function ucsWriteBigInt(fn: UcsFunction, _schema: UcSchema, value: string): UccSource {
  const { lib, args } = fn;
  const writeBigInt = lib.import(SERIALIZER_MODULE, 'writeUcBigInt');

  return `await ${writeBigInt}(${args.writer}, ${value});`;
}

function ucsWriteBoolean(fn: UcsFunction, _schema: UcSchema, value: string): UccSource {
  const { lib, args } = fn;
  const ucsTrue = lib.import(SERIALIZER_MODULE, 'UCS_TRUE');
  const ucsFalse = lib.import(SERIALIZER_MODULE, 'UCS_FALSE');

  return code => {
    code.write(
      `await ${args.writer}.ready;`,
      `${args.writer}.write(${value} ? ${ucsTrue} : ${ucsFalse});`,
    );
  };
}

function ucsWriteNumber(fn: UcsFunction, _schema: UcSchema, value: string): UccSource {
  const { lib, args } = fn;
  const writeNumber = lib.import(SERIALIZER_MODULE, 'writeUcNumber');

  return `await ${writeNumber}(${args.writer}, ${value});`;
}

function ucsWriteString(fn: UcsFunction, _schema: UcSchema, value: string): UccSource {
  const { lib, args } = fn;
  const writeString = lib.import(SERIALIZER_MODULE, 'writeUcString');

  return `await ${writeString}(${args.writer}, ${value});`;
}
