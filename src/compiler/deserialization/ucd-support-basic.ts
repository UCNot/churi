import { ListUcrxTemplate } from './list.ucrx-template.js';
import { MapUcrxTemplate } from './map.ucrx-template.js';
import { UcdSetup } from './ucd-feature.js';
import { ucdSupportPrimitives } from './ucd-support-primitives.js';
import { UnknownUcrxTemplate } from './unknown.ucrx-template.js';

export function ucdSupportBasic(setup: UcdSetup): void {
  setup
    .enable(ucdSupportPrimitives)
    .enable(MapUcrxTemplate)
    .enable(ListUcrxTemplate)
    .enable(UnknownUcrxTemplate);
}
