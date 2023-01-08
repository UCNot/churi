import { beforeEach, describe, expect, it } from '@jest/globals';
import { UccAliases } from './compiler/ucc-aliases.js';

describe('UccAliases', () => {
  let aliases: UccAliases;

  beforeEach(() => {
    aliases = new UccAliases();
  });

  it('uses name as alias for the first one', () => {
    expect(aliases.aliasFor('test')).toBe('test');
  });
  it('assigns counter to aliases', () => {
    aliases.aliasFor('test');

    expect(aliases.aliasFor('test')).toBe('test$0');
    expect(aliases.aliasFor('test')).toBe('test$1');
    expect(aliases.aliasFor('test')).toBe('test$2');
  });
  it('assigns counter to aliases with $', () => {
    aliases.aliasFor('test$a');

    expect(aliases.aliasFor('test$a')).toBe('test$a$0');
    expect(aliases.aliasFor('test$a')).toBe('test$a$1');
    expect(aliases.aliasFor('test$a')).toBe('test$a$2');
  });
  it('resolves conflicts', () => {
    aliases.aliasFor('test');
    aliases.aliasFor('test$0');

    expect(aliases.aliasFor('test')).toBe('test$1');
    expect(aliases.aliasFor('test$1')).toBe('test$2');
  });
});
