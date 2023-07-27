import { esline } from 'esgen';
import { UcInteger } from '../../schema/numeric/uc-integer.js';
import { UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcsSetup } from './ucs-setup.js';

export function ucsSupportInteger(
  setup: UcsSetup,
  target: UcInteger.Schema,
): UccConfig<UcInteger.Variant | undefined> {
  return {
    configure({ string = 'parse' } = {}) {
      setup.formatWith('charge', target, ({ writer, value }) => code => {
        const writeAsIs = UC_MODULE_SERIALIZER.import('ucsWriteAsIs');

        if (string === 'serialize') {
          const ucsApostrophe = UC_MODULE_SERIALIZER.import('UCS_APOSTROPHE');

          code
            .write(esline`await ${writer}.ready;`)
            .write(esline`${writer}.write(${ucsApostrophe});`);
        }

        code.write(esline`await ${writeAsIs}(${writer}, ${value}.toFixed(0));`);
      });
    },
  };
}
