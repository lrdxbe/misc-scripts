import { config } from "dotenv";
import { promises as fsp } from "node:fs";
import { basename, dirname, join } from "node:path";
import { exit } from "node:process";
import { isDirectory, isNonNullable } from "./utils";

config();

const __dirname = import.meta.dirname;

// Input
const BASE_DIR = process.env.LOONEY_ENTRY;

if (!BASE_DIR) {
  console.error("No LOONEY_ENTRY");
  exit(1);
}

const filelist = await fsp.readdir(BASE_DIR, { recursive: false });

const fileRegex = /Looney Tunes - \[S([0-9]{4})x[0-9]+\] - .+\.mkv/;

const filesWithYear = filelist
  .map((file) => {
    const matches = fileRegex.exec(file);
    const year = matches?.[1];
    return {
      file: join(BASE_DIR, file),
      year: year,
    };
  })
  .filter((data) => data.year);

const years = filesWithYear.map(({ year }) => year).filter(isNonNullable);

const uniqueYears = new Set(years);

for (const item of filesWithYear) {
  if (item.year) {
    if (!(await isDirectory(join(BASE_DIR, item.year)))) {
      await fsp.mkdir(join(BASE_DIR, item.year));
    }
    const fileName = basename(item.file);
    const folderName = dirname(item.file);
    const newName = join(folderName, item.year, fileName);
    await fsp.rename(item.file, newName);
  }
}
