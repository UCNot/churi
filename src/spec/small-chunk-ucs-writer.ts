import { UcdMemory } from '../deserializer/ucd-memory.js';
import { UcsWriter } from '../serializer/ucs-writer.js';

export class SmallChunkUcsWriter extends UcsWriter {

  readonly #memory = new UcdMemory(4);

  override get memory(): UcdMemory {
    return this.#memory;
  }

}
