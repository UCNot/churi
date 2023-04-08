import { ListUcrxTemplate } from './list.ucrx-template.js';
import { MapUcrxTemplate } from './map.ucrx-template.js';
import { ucdConfigurePrimitive } from './ucd-configure-primitives.js';
import { UcdSetup } from './ucd-setup.js';
import { UnknownUcrxTemplate } from './unknown.ucrx-template.js';

export function ucdConfigureBasic(setup: UcdSetup): void {
  ucdConfigurePrimitive(setup);
  MapUcrxTemplate.configure(setup);
  ListUcrxTemplate.configure(setup);
  UnknownUcrxTemplate.configure(setup);
}
