/**
 * Unit tests for config validation
 */

import { describe, it, expect } from 'vitest';
import { validateSchemaName } from './index';

describe('validateSchemaName', () => {
  describe('Valid schema names', () => {
    it('accepts lowercase letters', () => {
      expect(validateSchemaName('myschema')).toBe('myschema');
    });

    it('accepts uppercase letters', () => {
      expect(validateSchemaName('MYSCHEMA')).toBe('MYSCHEMA');
    });

    it('accepts mixed case', () => {
      expect(validateSchemaName('MySchema')).toBe('MySchema');
    });

    it('accepts names starting with underscore', () => {
      expect(validateSchemaName('_schema')).toBe('_schema');
    });

    it('accepts names with underscores', () => {
      expect(validateSchemaName('my_schema_name')).toBe('my_schema_name');
    });

    it('accepts names with numbers (not at start)', () => {
      expect(validateSchemaName('schema123')).toBe('schema123');
      expect(validateSchemaName('my_schema_2')).toBe('my_schema_2');
    });

    it('accepts single letter names', () => {
      expect(validateSchemaName('a')).toBe('a');
      expect(validateSchemaName('Z')).toBe('Z');
      expect(validateSchemaName('_')).toBe('_');
    });

    it('accepts common schema names', () => {
      expect(validateSchemaName('vue_parse')).toBe('vue_parse');
      expect(validateSchemaName('express_prisma')).toBe('express_prisma');
      expect(validateSchemaName('react_koa')).toBe('react_koa');
      expect(validateSchemaName('svelte_hono')).toBe('svelte_hono');
    });
  });

  describe('Invalid schema names', () => {
    it('rejects names starting with numbers', () => {
      expect(() => validateSchemaName('123schema')).toThrow(
        /Invalid schema name.*must start with a letter or underscore/
      );
    });

    it('rejects names with hyphens', () => {
      expect(() => validateSchemaName('my-schema')).toThrow(
        /Invalid schema name.*must start with a letter or underscore/
      );
    });

    it('rejects names with spaces', () => {
      expect(() => validateSchemaName('my schema')).toThrow(
        /Invalid schema name.*must start with a letter or underscore/
      );
    });

    it('rejects names with special characters', () => {
      expect(() => validateSchemaName('my$schema')).toThrow(
        /Invalid schema name.*must start with a letter or underscore/
      );
      expect(() => validateSchemaName('my.schema')).toThrow(
        /Invalid schema name.*must start with a letter or underscore/
      );
      expect(() => validateSchemaName('my@schema')).toThrow(
        /Invalid schema name.*must start with a letter or underscore/
      );
    });

    it('rejects names with SQL injection attempts', () => {
      expect(() => validateSchemaName("schema'; DROP TABLE users; --")).toThrow(
        /Invalid schema name.*must start with a letter or underscore/
      );
      expect(() => validateSchemaName('schema"; DELETE FROM *; --')).toThrow(
        /Invalid schema name.*must start with a letter or underscore/
      );
    });

    it('rejects empty strings', () => {
      expect(() => validateSchemaName('')).toThrow(
        /Invalid schema name.*must start with a letter or underscore/
      );
    });

    it('rejects names with parentheses', () => {
      expect(() => validateSchemaName('schema()')).toThrow(
        /Invalid schema name.*must start with a letter or underscore/
      );
    });

    it('rejects names with semicolons', () => {
      expect(() => validateSchemaName('schema;')).toThrow(
        /Invalid schema name.*must start with a letter or underscore/
      );
    });

    it('rejects names with SQL keywords and symbols', () => {
      expect(() => validateSchemaName('DROP TABLE')).toThrow(
        /Invalid schema name.*must start with a letter or underscore/
      );
    });
  });

  describe('Error messages', () => {
    it('provides descriptive error message', () => {
      expect(() => validateSchemaName('invalid-name')).toThrow(/Invalid schema name: invalid-name/);
      expect(() => validateSchemaName('invalid-name')).toThrow(/must start with a letter or underscore/);
      expect(() => validateSchemaName('invalid-name')).toThrow(/contain only alphanumeric characters and underscores/);
    });
  });
});
