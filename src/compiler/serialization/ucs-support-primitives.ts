import { EsSnippet, esline } from 'esgen';
import { UcSchema } from '../../schema/uc-schema.js';
import { UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcsCompiler } from './ucs-compiler.js';
import { UcsFunction } from './ucs-function.js';
import { UcsSignature } from './ucs.signature.js';

export function ucsSupportPrimitives(compiler: UcsCompiler): UccConfig {
  return {
    configure() {
      compiler
        .useUcsGenerator(BigInt, ucsWriteBigInt)
        .useUcsGenerator(Boolean, ucsWriteBoolean)
        .useUcsGenerator(Number, ucsWriteNumber)
        .useUcsGenerator(String, ucsWriteString);
    },
  };
}

function ucsWriteBigInt(
  _fn: UcsFunction,
  _schema: UcSchema,
  { writer, value }: UcsSignature.AllValues,
): EsSnippet {
  const writeBigInt = UC_MODULE_SERIALIZER.import('writeUcBigInt');

  return esline`await ${writeBigInt}(${writer}, ${value});`;
}

function ucsWriteBoolean(
  _fn: UcsFunction,
  _schema: UcSchema,
  { writer, value }: UcsSignature.AllValues,
): EsSnippet {
  const ucsTrue = UC_MODULE_SERIALIZER.import('UCS_TRUE');
  const ucsFalse = UC_MODULE_SERIALIZER.import('UCS_FALSE');

  return code => {
    code.write(
      esline`await ${writer}.ready;`,
      esline`${writer}.write(${value} ? ${ucsTrue} : ${ucsFalse});`,
    );
  };
}

function ucsWriteNumber(
  _fn: UcsFunction,
  _schema: UcSchema,
  { writer, value }: UcsSignature.AllValues,
): EsSnippet {
  const writeNumber = UC_MODULE_SERIALIZER.import('writeUcNumber');

  return esline`await ${writeNumber}(${writer}, ${value});`;
}

function ucsWriteString(
  _fn: UcsFunction,
  _schema: UcSchema,
  { writer, value }: UcsSignature.AllValues,
): EsSnippet {
  const writeString = UC_MODULE_SERIALIZER.import('writeUcString');

  return esline`await ${writeString}(${writer}, ${value});`;
}
