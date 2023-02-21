import { beforeEach, describe, expect, it } from '@jest/globals';
import { UccNamespace } from './compiler/ucc-namespace.js';

describe('UccAliases', () => {
  let aliases: UccNamespace;

  beforeEach(() => {
    aliases = new UccNamespace();
  });

  it('uses name as alias for the first one', () => {
    expect(aliases.name('test')).toBe('test');
  });
  it('assigns counter to aliases', () => {
    aliases.name('test');

    expect(aliases.name('test')).toBe('test$0');
    expect(aliases.name('test')).toBe('test$1');
    expect(aliases.name('test')).toBe('test$2');
  });
  it('assigns counter to aliases with $', () => {
    aliases.name('test$a');

    expect(aliases.name('test$a')).toBe('test$a$0');
    expect(aliases.name('test$a')).toBe('test$a$1');
    expect(aliases.name('test$a')).toBe('test$a$2');
  });
  it('resolves conflicts', () => {
    aliases.name('test');
    aliases.name('test$0');

    expect(aliases.name('test')).toBe('test$1');
    expect(aliases.name('test$1')).toBe('test$2');
  });
});
