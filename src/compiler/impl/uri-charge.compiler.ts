import { URICharge } from '../../charge/uri-charge.js';
import { CHURI_MODULE, URI_CHARGE_MODULE } from '../../impl/module-names.js';
import { jsStringLiteral } from '../../impl/quote-property-key.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { ucUnknown } from '../../schema/unknown/uc-unknown.js';
import { UccArgs } from '../codegen/ucc-args.js';
import { UccSource } from '../codegen/ucc-code.js';
import { EntryUcdDef } from '../deserialization/entry.ucd-def.js';
import { ListUcdDef } from '../deserialization/list.ucd-def.js';
import { MapUcdDef } from '../deserialization/map.ucd-def.js';
import { UcdLib } from '../deserialization/ucd-lib.js';
import { UnknownUcdDef } from '../deserialization/unknown.ucd-def.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxMethod } from '../rx/ucrx-method.js';
import { UcrxSetter, isUcrxSetter } from '../rx/ucrx-setter.js';

export class URIChargeUcdLib extends UcdLib<{ parseURICharge: UcSchema<URICharge> }> {

  constructor() {
    super({
      schemae: { parseURICharge: ucUnknown() as UcSchema<URICharge> },
      definitions: [URIChargeMapUcdDef, URIChargeListUcdDef, URIChargeUcdDef],
    });
  }

}

class URIChargeListUcdDef extends ListUcdDef {

  override addNull({ addItem }: ListUcdDef.Allocation): UccSource {
    const URICharge$Single = this.lib.import(URI_CHARGE_MODULE, 'URICharge$Single');

    return addItem.call('this', { item: `new ${URICharge$Single}(null, 'null')` }) + ';';
  }

  override storeItems({ setList, items }: ListUcdDef.Allocation): UccSource {
    const URICharge$List = this.lib.import(URI_CHARGE_MODULE, 'URICharge$List');

    return `${setList}(new ${URICharge$List}(${items}));`;
  }

}

class URIChargeMapUcdDef extends MapUcdDef {

  override createEntry(key: string | null, schema: UcSchema<unknown>): URIChargeEntryUcdDef {
    return new URIChargeEntryUcdDef(this, key, schema);
  }

  override allocateMap(prefix: string, suffix: string): UccSource {
    return `${prefix}new Map()${suffix}`;
  }

  override storeMap(setter: string, { map }: MapUcdDef.Allocation): UccSource {
    const URICharge$Map = this.lib.import(URI_CHARGE_MODULE, 'URICharge$Map');

    return `${setter}(new ${URICharge$Map}(${map}[0]));`;
  }

}

class URIChargeEntryUcdDef extends EntryUcdDef {

  override setEntry(map: string, key: string, value: string): UccSource {
    return `${map}.set(${key}, ${value});`;
  }

}

class URIChargeUcdDef extends UnknownUcdDef {

  protected override setValue<TArg extends string>(
    _allocation: UnknownUcdDef.Allocation,
    method: UcrxMethod<TArg>,
    args: UccArgs.ByName<TArg>,
  ): UccSource {
    switch (method as UcrxMethod<any>) {
      case UcrxCore.ent:
        return this.#setEntity(UcrxCore.ent, args as UccArgs.ByName<UcrxSetter.Arg>);
      case UcrxCore.nul:
        return this.#setNull();
      default:
        if (isUcrxSetter(method)) {
          return this.#setValue(method, args as UccArgs.ByName<UcrxSetter.Arg>);
        }

        // istanbul ignore next
        throw new TypeError(`Unsupported URICharge method: ${method}`);
    }
  }

  #setValue(method: UcrxSetter, { value }: UccArgs.ByName<UcrxSetter.Arg>): UccSource {
    const type = jsStringLiteral(method.typeName!);
    const URICharge$Single = this.lib.import(URI_CHARGE_MODULE, 'URICharge$Single');

    return `return ${method.toMethod(this.lib).call('super', {
      value: `new ${URICharge$Single}(${value}, ${type})`,
    })};`;
  }

  #setEntity(method: UcrxSetter, { value }: UccArgs.ByName<UcrxSetter.Arg>): UccSource {
    const type = jsStringLiteral(method.typeName!);
    const UcEntity = this.lib.import(CHURI_MODULE, 'UcEntity');
    const printUcTokens = this.lib.import(CHURI_MODULE, 'printUcTokens');
    const URICharge$Single = this.lib.import(URI_CHARGE_MODULE, 'URICharge$Single');

    return `return this.any(new ${URICharge$Single}(new ${UcEntity}(${printUcTokens}(${value})), ${type}));`;
  }

  #setNull(): UccSource {
    const URICharge$Single = this.lib.import(URI_CHARGE_MODULE, 'URICharge$Single');

    return `return this.any(new ${URICharge$Single}(null, 'null'));`;
  }

  protected override addItem<TArg extends string>(
    allocation: UnknownUcdDef.Allocation,
    method: UcrxMethod<TArg>,
    args: UccArgs.ByName<TArg>,
  ): UccSource {
    if ((method as UcrxMethod<any>) === UcrxCore.nul) {
      return this.#addNull(allocation);
    }
    if (isUcrxSetter(method)) {
      return this.#addValue(allocation, method, args as UccArgs.ByName<UcrxSetter.Arg>);
    }

    // istanbul ignore next
    throw new TypeError(`Unsupported URICharge method: ${method}`);
  }

  #addValue(
    { listRx }: UnknownUcdDef.Allocation,
    method: UcrxSetter,
    args: UccArgs.ByName<UcrxSetter.Arg>,
  ): UccSource {
    return `return ${method.toMethod(this.lib).call(listRx, args)};`;
  }

  #addNull({ listRx }: UnknownUcdDef.Allocation): UccSource {
    return `return ${listRx}.nul();`;
  }

}
