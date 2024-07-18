import { config } from "dotenv";
import { createReadStream, promises as fsp } from "node:fs";
import { basename, dirname, join } from "node:path";
import { exit } from "node:process";
import readline from "readline";
import { isNonNullable } from "./utils";

config();

const __dirname = import.meta.dirname;

// Input
const BASE_DIR = process.env.LOONEY_ENTRY;

if (!BASE_DIR) {
  console.error("No LOONEY_ENTRY");
  exit(1);
}

const filelist = await fsp.readdir(BASE_DIR, { recursive: true });

const filesByFolder = filelist
  .reduce<{ folderName: string; list: string[] }[]>((acc, item) => {
    if (item.indexOf(".mkv") == -1) {
      return acc;
    }
    const folder = dirname(item);
    const file = basename(item);
    const latestItem = acc.at(-1);
    if (!latestItem || latestItem.folderName !== folder) {
      acc.push({ folderName: folder, list: [file] });
    } else {
      latestItem.list.push(file);
    }
    return acc;
  }, [])
  .sort((a, b) => a.folderName.localeCompare(b.folderName));

// Rename list

const fileStream = createReadStream(join(__dirname, "torename.csv"));
const renameList: string[] = [];

const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity,
});
// Note: we use the crlfDelay option to recognize all instances of CR LF
// ('\r\n') in input.txt as a single line break.

for await (const line of rl) {
  renameList.push(line);
}

// Matches

const originalFilePattern = /(.+) \([0-9]{4}\)\.mkv/;

const titleNames = filesByFolder
  .map((folder) =>
    folder.list.map((file) => {
      const matches = originalFilePattern.exec(file);
      if (!matches || matches?.length < 2) {
        console.warn("Could find not a match for ", folder.folderName, file);
        return null;
      }
      const filmName = matches[1];
      const newName = renameList.find(
        (listItem) => listItem.indexOf(filmName) !== -1
      );
      return {
        folder: folder.folderName,
        original: file,
        new: newName,
      };
    })
  )
  .flat()
  .filter(isNonNullable);

// Renaming

for (const renameItem of titleNames) {
  if (renameItem?.new) {
    await fsp.rename(
      join(BASE_DIR, renameItem.folder, renameItem.original),
      join(BASE_DIR, renameItem.folder, renameItem.new)
    );
  }
}
