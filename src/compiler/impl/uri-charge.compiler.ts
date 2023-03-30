import { URI_CHARGE_MODULE } from '../../impl/module-names.js';
import { jsStringLiteral } from '../../impl/quote-property-key.js';
import { UcUnknown, ucUnknown } from '../../schema/unknown/uc-unknown.js';
import { UccArgs } from '../codegen/ucc-args.js';
import { UccSource } from '../codegen/ucc-code.js';
import { ListUcdDef } from '../deserialization/list.ucd-def.js';
import { MapUcdDef } from '../deserialization/map.ucd-def.js';
import { UcdLib } from '../deserialization/ucd-lib.js';
import { UnknownUcdDef } from '../deserialization/unknown.ucd-def.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxMethod } from '../rx/ucrx-method.js';
import { UcrxSetter, isUcrxSetter } from '../rx/ucrx-setter.js';

export class URIChargeUcdLib extends UcdLib<{ parseURICharge: UcUnknown.Schema }> {

  constructor() {
    super({
      schemae: { parseURICharge: ucUnknown() },
      definitions: [URIChargeMapUcdDef, URIChargeListUcdDef, URIChargeUnknownUcdDef],
    });
  }

}

class URIChargeListUcdDef extends ListUcdDef {}

class URIChargeMapUcdDef extends MapUcdDef {}

class URIChargeUnknownUcdDef extends UnknownUcdDef {

  protected override addValue<TArg extends string>(
    _allocation: UnknownUcdDef.Allocation,
    method: UcrxMethod<TArg>,
    target: string,
    args: UccArgs.ByName<TArg>,
  ): UccSource {
    if ((method as UcrxMethod<any>) === UcrxCore.nul) {
      return this.#addNull(UcrxCore.nul, target);
    }
    if (isUcrxSetter(method)) {
      return this.#addValue(method, target, args as UccArgs.ByName<UcrxSetter.Arg>);
    }

    // istanbul ignore next
    throw new TypeError(`Unsupported URICharge method: ${method}`);
  }

  #addNull(method: UcrxMethod<''>, target: string): UccSource {
    const type = jsStringLiteral(method.typeName!);
    const URICharge$Single = this.lib.import(URI_CHARGE_MODULE, 'URICharge$Single');

    return `return ${target}.any(new ${URICharge$Single}(null, ${type}));`;
  }

  #addValue(
    method: UcrxSetter,
    target: string,
    { value }: UccArgs.ByName<UcrxSetter.Arg>,
  ): UccSource {
    const type = jsStringLiteral(method.typeName!);
    const URICharge$Single = this.lib.import(URI_CHARGE_MODULE, 'URICharge$Single');
    const valueArgs = {
      value: `new ${URICharge$Single}(${value}, ${type})`,
    };

    return `return ${method.toMethod(this.lib).call(target, valueArgs)};`;
  }

}
