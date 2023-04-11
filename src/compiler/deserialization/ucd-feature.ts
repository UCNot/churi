import { UcdSetup } from './ucd-setup.js';

/**
 * Deserializer feature.
 *
 * Configures deserializer when called.
 */
export type UcdFeature =
  | ((this: void, setup: UcdSetup) => void)
  | { configureDeserializer(setup: UcdSetup): void };
