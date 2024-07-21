import path from "node:path";
import * as prettier from "prettier";
import { glob } from "glob";
import { existsSync, promises, mkdirSync } from "node:fs";
import kebabCase from "lodash/kebabCase";
import { Context, IContextModule } from "./context";

interface IFile {
  directory: string;
  name: string;
  extension?: string;
  content?: string;
}

export class File implements IFile {
  extension: string;
  content: string;
  name: string;
  directory: string;

  contentOnDisk: string | undefined = undefined;

  constructor(file: IFile) {
    this.name = file.name;
    this.content = file.content ?? "";
    this.extension = file.extension ?? "";
    this.directory = file.directory;
  }

  get fullName() {
    return [this.directory, this.name, this.extension].filter(Boolean).join("-");
  }
}

export class FileService implements IContextModule {
  data: Map<string, File> = new Map();
  filesWriten = 0;
  touchedFiles = new Set<string>();
  intital = true;

  constructor(public context: Context) {}

  set(file: File): File {
    this.touchedFiles.add(file.fullName);
    const currentFile = this.data.get(file.fullName);
    if (currentFile) file.contentOnDisk = currentFile.contentOnDisk;
    return this.data.set(file.fullName, file).get(file.fullName) as File;
  }

  async isDirty(file: File) {
    if (!file.contentOnDisk) {
      const exists = existsSync(this.resolveFilePath(file));
      if (!exists) {
        file.contentOnDisk = "";
        return true;
      }
      file.contentOnDisk = await promises.readFile(this.resolveFilePath(file), "utf8");
    }
    const dirty = file.contentOnDisk !== file.content;
    if (dirty) {
      file.contentOnDisk = undefined;
    }
    return dirty;
  }

  resolveFilePath(file: IFile) {
    const extension = file.extension === "" ? this.context.options.defaultExtenstion : file.extension;
    const name = `${kebabCase(file.name)}.${extension}`;
    return path.resolve(path.join(this.context.options.output, file.directory, name));
  }

  async flush() {
    this.filesWriten = 0;
    await Promise.all([...this.data].map(([_, file]) => this.writeFile(file)));

    if (this.intital) {
      await this.initialCleanup();
      this.intital = false;
    } else {
      this.cleanup();
    }
  }

  private async initialCleanup() {
    const dirs: string[] = [];
    const files: string[] = [];

    const currentFiles = await glob(`${path.resolve(this.context.options.output)}/**/*`, { stat: true, withFileTypes: true });
    for (const f of currentFiles) {
      f.isDirectory() ? dirs.push(f.fullpath()) : files.push(f.fullpath());
    }

    const dataFilePaths = new Set(Array.from(this.data).map(([_, file]) => this.resolveFilePath(file)));
    for (const filePath of files) {
      if (!dataFilePaths.has(filePath)) {
        await promises.unlink(filePath);
      }
    }

    for (const d of dirs) {
      const exists = [...this.data].some(([_, file]) => this.resolveFilePath(file).startsWith(d));
      if (!exists) {
        await promises.rmdir(d);
      }
    }
  }

  private async cleanup() {
    for (const [_, f] of this.data) {
      if (!this.touchedFiles.has(f.fullName)) {
        await promises.unlink(this.resolveFilePath(f));
      }
    }
    this.touchedFiles.clear();
  }

  private async writeFile(file: File) {
    const filePath = this.resolveFilePath(file);
    mkdirSync(path.dirname(filePath), { recursive: true });

    file.content = await prettier.format(file.content, { parser: "babel-ts" });
    const isDirty = await this.isDirty(file);
    if (!isDirty) return;

    file.contentOnDisk = file.content;
    this.filesWriten++;

    return await promises.writeFile(filePath, file.content);
  }
}
