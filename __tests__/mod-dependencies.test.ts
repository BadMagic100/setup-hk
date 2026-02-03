import type { ModDependency } from '../src/mod-dependencies.js';
import { readFile as readFileMock } from '../__fixtures__/fsPromises.js';

import { test, expect, jest } from '@jest/globals';

jest.unstable_mockModule('fs/promises', () => ({ readFile: readFileMock }));

const { parse } = await import('../src/mod-dependencies.js');

const filePlaceholder = 'ModDependencies.txt';

afterEach(() => {
  readFileMock.mockClear();
});

test('returns empty dependency list without file', async () => {
  expect(await parse()).toEqual([]);
});

test('parses mod with only name', async () => {
  readFileMock.mockResolvedValue('MyMod');

  const expected: ModDependency = {
    modName: 'MyMod',
  };

  expect(await parse(filePlaceholder)).toEqual([expected]);
});

test('parses mod with alias', async () => {
  readFileMock.mockResolvedValue('MyMod as MM');

  const expected: ModDependency = {
    modName: 'MyMod',
    alias: 'MM',
  };

  expect(await parse(filePlaceholder)).toEqual([expected]);
});

test('parses mod with link', async () => {
  readFileMock.mockResolvedValue('MyMod from https://foo.bar/MyMod.zip');

  const expected: ModDependency = {
    modName: 'MyMod',
    url: 'https://foo.bar/MyMod.zip',
  };

  expect(await parse(filePlaceholder)).toEqual([expected]);
});

test('parses mod with alias and link', async () => {
  readFileMock.mockResolvedValue('MyMod as MM from https://foo.bar/MyMod.zip');

  const expected: ModDependency = {
    modName: 'MyMod',
    alias: 'MM',
    url: 'https://foo.bar/MyMod.zip',
  };

  expect(await parse(filePlaceholder)).toEqual([expected]);
});

test('skips full-line comment, comment part of token', async () => {
  readFileMock.mockResolvedValue(
    "#I don't really want to have dependencies right now",
  );

  expect(await parse(filePlaceholder)).toEqual([]);
});

test('skips full-line comment, comment own token', async () => {
  readFileMock.mockResolvedValue(
    "# I don't really want to have dependencies right now",
  );

  expect(await parse(filePlaceholder)).toEqual([]);
});

test('skips partial-line comment', async () => {
  readFileMock.mockResolvedValue(
    'MyMod #could add an alias or link using as or from',
  );

  const expected: ModDependency = {
    modName: 'MyMod',
  };

  expect(await parse(filePlaceholder)).toEqual([expected]);
});

test('fails to parse with late alias', async () => {
  readFileMock.mockResolvedValue('MyMod from https://foo.bar/MyMod.zip as MM');

  await expect(parse(filePlaceholder)).rejects.toThrow("unexpected 'as'");
});
