import { EsSnippet, esline } from 'esgen';
import { UcSchema } from '../../schema/uc-schema.js';
import { UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcsCompiler } from './ucs-compiler.js';
import { UcsFunction } from './ucs-function.js';
import { ucsSupportNumber } from './ucs-support-number.js';
import { ucsSupportString } from './ucs-support-string.js';
import { UcsSignature } from './ucs.signature.js';

export function ucsSupportPrimitives(compiler: UcsCompiler): UccConfig {
  return {
    configure() {
      compiler.useUcsGenerator(BigInt, ucsWriteBigInt).useUcsGenerator(Boolean, ucsWriteBoolean);
      ucsSupportNumber(compiler, Number).configure({});
      ucsSupportString(compiler, String).configure({});
    },
  };
}

function ucsWriteBigInt(
  _fn: UcsFunction,
  _schema: UcSchema,
  { writer, value }: UcsSignature.AllValues,
): EsSnippet {
  const writeBigInt = UC_MODULE_SERIALIZER.import('ucsWriteBigInt');

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
