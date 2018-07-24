# write-files-atomic

> Write many files atomically

- Creates temporary files with file contents
- Moves them all at once using `rename()`
- Automatically cleans up after itself
- Optimized to be as fast as possible
- Doesn't break file watchers
- Doesn't swallow errors
- Includes Flow types

## Install

```
yarn add write-files-atomic
```

## Usage

```js
const writeFilesAtomic = require('write-files-atomic');

await writeFilesAtomic([
  { filePath: './foo.txt', fileContents: '...foo...' },
  { filePath: './bar.txt', fileContents: '...bar...' },
  { filePath: './baz.txt', fileContents: '...baz...' },
]);
```

## API

```ts
type Files = Array<{
  filePath: string,
  fileContents: string | Buffer,
  encoding?: string, // default 'utf8'
  mode?: number,
  chown?: { uid: number, gid: number }, // default `fs.stat` of existing file
}>;

declare function writeFilesAtomic(files: Files): Promise<void>;
```
