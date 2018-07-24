// @flow
'use strict';

const fs = require('graceful-fs');
const path = require('path');
const onExit = require('signal-exit');
const {promisify} = require('util');
const tempy = require('tempy');

const fsStat = promisify(fs.stat);
const fsRealpath = promisify(fs.realpath);
const fsWriteFile = promisify(fs.writeFile);
const fsChown = promisify(fs.chown);
const fsChmod = promisify(fs.chmod);
const fsRename = promisify(fs.rename);
const fsUnlink = promisify(fs.unlink);

let activeTempPaths = new Set();

function cleanup() {
  for (let tempPath of activeTempPaths) {
    try { fs.unlinkSync(tempPath); } catch (err) {}
  }
  activeTempPaths = new Set();
}

/*::
type File = {
  filePath: string,
  fileContents: string | Buffer,
  encoding?: string,
  mode?: number,
  chown?: { uid: number, gid: number },
};
*/

async function writeFilesAtomic(files /*: Array<File> */) {
  let removeOnExit = onExit(cleanup);

  try {
    let results = await Promise.all(files.map(async file => {
      let filePath = path.resolve(file.filePath);
      let tempPath = tempy.file();
      let realPath;

      try {
        realPath = await fsRealpath(filePath);
      } catch (err) {
        if (err.code === 'ENOENT') {
          realPath = filePath;
        } else {
          throw err;
        }
      }

      let mode = file.mode;
      let chown = file.chown;

      if (!mode || !chown) {
        try {
          let stats = await fsStat(realPath);
          if (!mode) mode = stats.mode;
          if (!chown && process.getuid) {
            chown = { uid: stats.uid, gid: stats.gid };
          }
        } catch (err) {
          if (err.code !== 'ENOENT') {
            throw err;
          }
        }
      }

      activeTempPaths.add(tempPath);

      let fileContents = file.fileContents;
      let encoding = file.encoding || 'utf8';

      return { tempPath, realPath, fileContents, encoding, mode, chown };
    }));

    await Promise.all(results.map(async file => {
      await fsWriteFile(file.tempPath, file.fileContents, {
        mode: file.mode,
        encoding: file.encoding,
      });

      if (file.chown) {
        await fsChown(file.tempPath, file.chown.uid, file.chown.gid);
      }
    }));

    await Promise.all(results.map(async file => {
      await fsRename(file.tempPath, file.realPath);
      activeTempPaths.delete(file.tempPath);
    }));
  } catch (err) {
    cleanup();
    throw err;
  } finally {
    removeOnExit();
  }
}

module.exports = writeFilesAtomic;
