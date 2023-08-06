import { UcdBootstrap } from '../compiler/deserialization/ucd-bootstrap.js';
import { UC_MODULE_SPEC } from '../compiler/impl/uc-modules.js';
import { UcrxContext } from '../rx/ucrx-context.js';
import { Ucrx } from '../rx/ucrx.js';

export function readMetaMap(context: UcrxContext, rx: Ucrx): 0 | 1 {
  const { meta } = context;

  for (const attr of meta.attributes()) {
    const entityRx = rx.for(attr.name, context)!;

    if (entityRx) {
      for (const value of meta.getAll(attr)) {
        entityRx.and(context);
        entityRx.str(String(value), context);
      }

      entityRx.end(context);
    } else if (entityRx == null) {
      return 0;
    }
  }

  return rx.map(context);
}

export function ucdProcessMetaMapEntity(boot: UcdBootstrap): void {
  boot.handleEntity('meta-map', ({ register }) => code => {
    code.write(register(UC_MODULE_SPEC.import(readMetaMap.name)));
  });
}
