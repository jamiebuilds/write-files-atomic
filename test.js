'use strict';

const test = require('ava');
const fs = require('fs');
const path = require('path');
const fixturez = require('fixturez');
const {promisify} = require('util');
const writeFilesAtomic = require('./');

const f = fixturez(__dirname);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const symlink = promisify(fs.symlink);
const stat = promisify(fs.stat);

test('writes files', async t => {
  let tempDir = f.temp();

  let foo = path.join(tempDir, 'foo.txt');
  let bar = path.join(tempDir, 'bar.txt');

  await writeFilesAtomic([
    { filePath: foo, fileContents: 'foo' },
    { filePath: bar, fileContents: 'bar' },
  ]);

  t.is(await readFile(foo, 'utf8'), 'foo');
  t.is(await readFile(bar, 'utf8'), 'bar');
});

test('writes buffers', async t => {
  let foo = path.join(f.temp(), 'foo.txt');

  await writeFilesAtomic([
    { filePath: foo, fileContents: Buffer.from('foo') },
  ]);

  t.is(await readFile(foo, 'utf8'), 'foo');
});

test('existing files', async t => {
  let foo = path.join(f.temp(), 'foo.txt');

  await writeFile(foo, 'original');

  await writeFilesAtomic([
    { filePath: foo, fileContents: 'updated' },
  ]);

  t.is(await readFile(foo, 'utf8'), 'updated');
});

test('preserves symlinks', async t => {
  let foo = path.join(f.temp(), 'foo.txt');
  let bar = path.join(f.temp(), 'bar.txt');

  await writeFile(foo, 'original');
  await symlink(foo, bar);

  await writeFilesAtomic([
    { filePath: bar, fileContents: 'updated' },
  ]);

  t.is(await readFile(foo, 'utf8'), 'updated');
  t.is(await readFile(bar, 'utf8'), 'updated');
});

test('chmod', async t => {
  let foo = path.join(f.temp(), 'foo.txt');

  await writeFilesAtomic([
    { filePath: foo, fileContents: 'foo', mode: parseInt('741', 8) }
  ]);

  let stats = await stat(foo);

  t.is(stats.mode, parseInt('100741', 8));
});

test('chown', async t => {
  let foo = path.join(f.temp(), 'foo.txt');
  let bar = path.join(f.temp(), 'bar.txt');
  let uid = 420;
  let gid = 430;

  await writeFilesAtomic([
    { filePath: foo, fileContents: 'foo', chown: { uid, gid } },
    { filePath: bar, fileContents: 'bar' },
  ]);

  let fooStats = await stat(foo);
  let barStats = await stat(bar);

  // how to test...
});
