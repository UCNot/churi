import { UC_MODULE_DESERIALIZER } from '../impl/uc-modules.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcdHandlerFeature, UcdHandlerSetup } from './ucd-handler-feature.js';
import { UcdSetup } from './ucd-setup.js';

export function ucdSupportNonFinite(setup: UcdSetup): UccConfig {
  return {
    configure() {
      setup
        .handleEntity('Infinity', handleUcdNonFinite('ucdInfinity'))
        .handleEntity('-Infinity', handleUcdNonFinite('ucdNegativeInfinity'))
        .handleEntity('NaN', handleUcdNonFinite('ucdNaN'));
    },
  };
}

function handleUcdNonFinite(reader: string): UcdHandlerFeature {
  return ({ register, refer }: UcdHandlerSetup) => {
    const readEntity = UC_MODULE_DESERIALIZER.import(reader);

    refer(readEntity);

    return register(readEntity);
  };
}
