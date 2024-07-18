import { promises as fsp } from "node:fs";
export const isNonNullable = <T>(item: T): item is NonNullable<T> =>
  item != null;

export const isDirectory = (file: string) =>
  fsp
    .stat(file)
    .then((stats) => stats.isDirectory())
    .catch(() => false);
