// @flow
'use strict';

const fs = require('fs');
const {promisify} = require('util');
const writeFilesAtomic = require('./');
const writeFileAtomic = promisify(require('write-file-atomic'));
const tempy = require('tempy');
const unlink = promisify(fs.unlink);
const onExit = require('signal-exit');

async function main() {
  let files = [];
  let fileContents = '0123456789\n'.repeat(10000);

  for (let i = 0; i < 10000; i++) {
    files.push({
      filePath: tempy.file(),
      fileContents,
    });
  }

  onExit(() => {
    files.map(file => unlink(file.filePath));
  });

  console.time('write-files-atomic');
  await writeFilesAtomic(files);
  console.timeEnd('write-files-atomic');

  console.time('write-file-atomic');
  await Promise.all(files.map(async file => {
    await writeFileAtomic(file.filePath, file.fileContents, { fsync: false });
  }));
  console.timeEnd('write-file-atomic');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
