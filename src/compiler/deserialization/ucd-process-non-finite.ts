import { ucdInfinity, ucdNaN, ucdNegativeInfinity } from '../../deserializer/ucd-non-finite.js';
import { UccConfig } from '../bootstrap/ucc-config.js';
import { UC_MODULE_DESERIALIZER } from '../impl/uc-modules.js';
import { UcdBootstrap } from './ucd-bootstrap.js';
import { UcdHandlerFeature, UcdHandlerSetup } from './ucd-handler-feature.js';

export function ucdProcessNonFinite(boot: UcdBootstrap): UccConfig {
  return {
    configure() {
      boot
        .handleEntity('Infinity', handleUcdNonFinite(ucdInfinity.name))
        .handleEntity('-Infinity', handleUcdNonFinite(ucdNegativeInfinity.name))
        .handleEntity('NaN', handleUcdNonFinite(ucdNaN.name));
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
