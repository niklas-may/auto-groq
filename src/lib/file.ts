import path from "node:path";
import * as prettier from "prettier";
import { glob } from "glob";
import { existsSync, promises, mkdirSync } from "node:fs";
import { Options } from "./config";
import { kebabCase } from "lodash";

interface IFilePath {
  extension: string;
  name: string;
  path: string;
}

export class File implements IFilePath {
  extension: string;
  content: string;
  name: string;
  path: string;

  private fileContent: string | undefined = undefined;
  dirty = true;

  constructor(config: { extension: string; content?: string; name: string; path: string }) {
    this.content = config.content ?? "";
    this.extension = config.extension;
    this.name = config.name;
    this.path = config.path;
  }

  get fileName() {
    return File.createFileName(this);
  }

  get fullPath() {
    return File.createFullPath(this);
  }

  static createFileName(file: IFilePath) {
    return `${kebabCase(file.name)}.${file.extension}`;
  }

  static createFullPath(file: IFilePath) {
    return path.resolve(path.join(file.path, File.createFileName(file)));
  }

  async checkIsDirty() {
    if (!this.fileContent) {
      const exists = existsSync(this.fullPath);
      if (!exists) {
        this.dirty = true;
        this.fileContent = "";
        return this.dirty;
      }
      this.fileContent = await promises.readFile(this.fullPath, "utf8");
    }
    this.dirty = this.fileContent !== this.content;
    if (this.dirty) {
      this.fileContent = undefined;
    }
    return this.dirty;
  }
}

export class FileService {
  store: Map<string, File> = new Map();
  interceptor: Array<(f: File) => File> = [];

  touchedFiles = new Set<string>();
  private flushed = false;

  constructor(private options: Options) {}

  getOrCreate(filePath: IFilePath): File {
    const fp = File.createFullPath(filePath);
    this.touchedFiles.add(fp);
    return this.store.get(fp) ?? this.add(new File(filePath));
  }

  private add(file: File): File {
    this.store.set(file.fullPath, file);
    return this.store.get(file.fullPath)!;
  }

  async flush() {
    await Promise.all(
      [...this.store].map(([_, f]) => {
        const file = this.interceptor.reduce((acc, interceptor) => interceptor(acc), f);
        return this.writeFile(file);
      }),
    );

    if (this.flushed) {
      this.cleanupFlush();
    } else {
      await this.cleanup();
      this.flushed = true;
    }
  }

  private async cleanup() {
    const dirs: string[] = [];
    const files: string[] = [];

    const currentFiles = await glob(`${path.resolve(this.options.outPath)}/**/*`, { stat: true, withFileTypes: true });
    for (const f of currentFiles) {
      f.isDirectory() ? dirs.push(f.fullpath()) : files.push(f.fullpath());
    }

    for (const f of files) {
      if (!this.store.get(f)) {
        await this.deleteFile(f);
      }
    }

    for (const d of dirs) {
      const exists = [...this.store].some(([_, v]) => v.fullPath.startsWith(d));
      if (!exists) {
        await promises.rmdir(d);
      }
    }
  }

  private cleanupFlush() {
    for (const [_, f] of this.store) {
      if (!this.touchedFiles.has(f.fullPath)) {
        this.deleteFile(f.fullPath);
      }
    }
    this.touchedFiles.clear();
  }

  private async deleteFile(path: string) {
    return promises.unlink(path);
  }

  private async writeFile(file: File) {
    mkdirSync(file.path, { recursive: true });

    file.content = await prettier.format(file.content, { parser: "babel-ts" });
    const isDirty = await file.checkIsDirty();
    if (!isDirty) return;

    return await promises.writeFile(file.fullPath, file.content);
  }
}
