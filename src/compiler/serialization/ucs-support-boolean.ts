import { EsSnippet, esline } from 'esgen';
import { UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcsFormatterSignature } from './ucs-formatter.js';
import { UcsSetup } from './ucs-setup.js';

export function ucsSupportBoolean(setup: UcsSetup): UccConfig {
  return {
    configure() {
      setup.formatWith('charge', Boolean, ucsWriteBoolean);
    },
  };
}

function ucsWriteBoolean({ writer, value }: UcsFormatterSignature.AllValues): EsSnippet {
  return code => {
    const ucsTrue = UC_MODULE_SERIALIZER.import('UCS_TRUE');
    const ucsFalse = UC_MODULE_SERIALIZER.import('UCS_FALSE');

    code.write(
      esline`await ${writer}.ready;`,
      esline`${writer}.write(${value} ? ${ucsTrue} : ${ucsFalse});`,
    );
  };
}
