import { UcDeserializer } from '../schema/uc-deserializer.js';
import { UcError, UcErrorInfo } from '../schema/uc-error.js';
import { UcToken } from '../syntax/uc-token.js';
import { ucdUnrecognizedEntityError } from './impl/ucd-errors.js';
import { UcdEntityHandler } from './ucd-entity-handler.js';
import { UcdRx } from './ucd-rx.js';

export abstract class UcdReader {

  readonly #onError: (error: UcErrorInfo) => void;
  readonly #onEntity: UcdEntityHandler;

  constructor(options?: UcDeserializer.Options);

  constructor({
    onError = UcDeserializer$throwOnError,
    onEntity = UcDeserializer$errorOnEntity,
  }: UcDeserializer.Options = {}) {
    this.#onError = onError;
    this.#onEntity = onEntity;
  }

  abstract hasNext(): boolean;

  abstract current(): UcToken | undefined;

  abstract prev(): readonly UcToken[];

  error(error: UcErrorInfo): void {
    this.#onError(error);
  }

  abstract read(rx: UcdRx): Promise<void> | void;

  entity(rx: UcdRx, entity: readonly UcToken[]): void {
    this.#onEntity(this, rx, entity);
  }

  abstract next(): Promise<UcToken | undefined> | UcToken | undefined;

  abstract find(
    matcher: (token: UcToken) => boolean | null | undefined,
  ): Promise<UcToken | undefined> | UcToken | undefined;

  abstract consume(): UcToken[];

  abstract consumePrev(): UcToken[];

  abstract skip(): void;

  abstract omitPrev(): void;

  abstract done(): void;

}

function UcDeserializer$throwOnError(error: unknown): never {
  throw UcError.create(error);
}

function UcDeserializer$errorOnEntity(
  reader: UcdReader,
  _rx: UcdRx,
  entity: readonly UcToken[],
): void {
  reader.error(ucdUnrecognizedEntityError(entity));
}
