import {
  EsClass,
  EsMethod,
  EsMethodDeclaration,
  EsMethodHandle,
  EsMethodInit,
  EsSignature,
} from 'esgen';

export class UcrxMethod<
  out TArgs extends EsSignature.Args = EsSignature.Args,
  out TMod = unknown,
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

}

export interface UcrxMethod<
  out TArgs extends EsSignature.Args = EsSignature.Args,
  out TMod = unknown,
> extends EsMethod<TArgs> {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __applyMod__?(mod: TMod): TMod;
}

export interface UcrxMethodInit<out TArgs extends EsSignature.Args = EsSignature.Args>
  extends EsMethodInit<TArgs> {
  readonly stub: EsMethodDeclaration<TArgs>;
  readonly typeName?: string | undefined;
}
