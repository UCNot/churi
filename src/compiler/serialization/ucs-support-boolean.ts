import { EsSnippet, esline } from 'esgen';
import { UcBoolean } from '../../schema/boolean/uc-boolean.js';
import { UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcsCompiler } from './ucs-compiler.js';
import { UcsFunction } from './ucs-function.js';
import { UcsSignature } from './ucs.signature.js';

export function ucsSupportBoolean(compiler: UcsCompiler): UccConfig {
  return {
    configure() {
      compiler.useUcsGenerator(Boolean, ucsWriteBoolean);
    },
  };
}

function ucsWriteBoolean(
  _fn: UcsFunction,
  _schema: UcBoolean.Schema,
  { writer, value }: UcsSignature.AllValues,
): EsSnippet {
  return code => {
    const ucsTrue = UC_MODULE_SERIALIZER.import('UCS_TRUE');
    const ucsFalse = UC_MODULE_SERIALIZER.import('UCS_FALSE');

    code.write(
      esline`await ${writer}.ready;`,
      esline`${writer}.write(${value} ? ${ucsTrue} : ${ucsFalse});`,
    );
  };
}
