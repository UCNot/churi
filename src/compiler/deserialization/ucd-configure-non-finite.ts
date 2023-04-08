import { DESERIALIZER_MODULE } from '../../impl/module-names.js';
import { UcdEntityConfig, UcdEntitySetup } from './ucd-entity-setup.js';
import { UcdSetup } from './ucd-setup.js';

export function ucdConfigureNonFinite(setup: UcdSetup): void {
  setup
    .handleEntity('!Infinity', createUcdNonFinite('ucrxInfinity'))
    .handleEntity('!-Infinity', createUcdNonFinite('ucrxNegativeInfinity'))
    .handleEntity('!NaN', createUcdNonFinite('ucrxNaN'));
}

function createUcdNonFinite(reader: string): UcdEntityConfig {
  return ({ lib, prefix, suffix }: UcdEntitySetup) => `${prefix}${lib.import(DESERIALIZER_MODULE, reader)}${suffix}`;
}
