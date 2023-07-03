import {
  EsClass,
  EsMemberRef,
  EsMethod,
  EsMethodDeclaration,
  EsMethodHandle,
  EsMethodInit,
  EsSignature,
  EsSnippet,
} from 'esgen';
import { UcrxClass } from './ucrx.class.js';

export class UcrxMethod<
  out TArgs extends EsSignature.Args = EsSignature.Args,
  out TMod extends UcrxBeforeMod<TArgs> = UcrxBeforeMod<TArgs>,
> extends EsMethod<TArgs> {

  readonly #stub: EsMethodDeclaration<TArgs>;
  readonly #typeName: string | undefined;

  constructor(requestedName: string, init: UcrxMethodInit<TArgs>) {
    super(requestedName, init);

    const { stub, typeName } = init;

    this.#stub = stub;
    this.#typeName = typeName;
  }

  get stub(): EsMethodDeclaration<TArgs> {
    return this.#stub;
  }

  get typeName(): string | undefined {
    return this.#typeName;
  }

  declareStub(hostClass: EsClass): EsMethodHandle<TArgs> {
    return this.declareIn(hostClass, this.stub);
  }

  overrideIn(
    ucrxClass: UcrxClass.Any,
    declaration: EsMethodDeclaration<TArgs>,
  ): EsMethodHandle<TArgs> {
    return this.declareIn(ucrxClass, {
      ...declaration,
      body: (member, hostClass) => code => {
        const mods = ucrxClass.methodModifiersOf(this);

        for (const { before } of mods) {
          code.write(
            before(member as EsMemberRef<UcrxMethod<TArgs>, EsMethodHandle<TArgs>>, ucrxClass),
          );
        }

        code.write(declaration.body(member, hostClass));
      },
    });
  }

}

export interface UcrxMethod<
  out TArgs extends EsSignature.Args = EsSignature.Args,
  out TMod extends UcrxBeforeMod<TArgs> = UcrxBeforeMod<TArgs>,
> extends EsMethod<TArgs> {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __applyMod__?(mod: TMod): TMod;
}

export interface UcrxMethodInit<out TArgs extends EsSignature.Args = EsSignature.Args>
  extends EsMethodInit<TArgs> {
  readonly stub: EsMethodDeclaration<TArgs>;
  readonly typeName?: string | undefined;
}

export interface UcrxBeforeMod<TArgs extends EsSignature.Args> {
  before(
    member: EsMemberRef<UcrxMethod<TArgs>, EsMethodHandle<TArgs>>,
    ucrxClass: UcrxClass.Any,
  ): EsSnippet;
}
