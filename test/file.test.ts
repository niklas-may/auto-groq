import { describe, expect, it, afterEach } from "vitest";
import { Options } from "../src/lib/config";
import { FileService } from "../src/lib/file";
import { existsSync, promises, rmSync } from "node:fs";
import path from "node:path";
import { glob } from "glob";

describe("[FileService]", () => {
  const options: Options = {
    inlineResolver: false,
    outPath: "./test/fixtures/.autogroq",
  };

  afterEach(async () => {
    rmSync(options.outPath, { recursive: true, force: true });
  });

  it("should wirte file to disk", async () => {
    const service = new FileService(options);
    const file = service.getOrCreate({ name: "test", path: options.outPath, extension: "ts" });

    file.content = "// Test file";
    await service.flush();
    expect(existsSync(file.fullPath)).toBe(true);
  });

  it("flag new file as dirty", async () => {
    const service = new FileService(options);
    const file = service.getOrCreate({ name: "test", path: options.outPath, extension: "ts" });

    file.content = "// Test file";
    const dirty = await file.checkIsDirty();
    expect(dirty).toBe(true);
  });

  it("flag file as not dirty once written", async () => {
    const service = new FileService(options);
    const file = service.getOrCreate({ name: "test", path: options.outPath, extension: "ts" });

    file.content = "// Test file";
    await service.flush();
    await file.checkIsDirty();
    expect(file.dirty).toBe(false);
  });

  it("flag file as dirty after update", async () => {
    const service = new FileService(options);
    const file = service.getOrCreate({ name: "test", path: options.outPath, extension: "ts" });

    file.content = "// Test file";
    await service.flush();
    file.content = "// Updated file";
    await file.checkIsDirty();
    expect(file.dirty).toBe(true);
  });

  it("should remove files that are not in the current store", async () => {
    const service = new FileService(options);

    await promises.mkdir(options.outPath, { recursive: true });
    await promises.mkdir(path.join(options.outPath, "externalFolder"), { recursive: true });
    await promises.writeFile(path.join(options.outPath, "external.ts"), "// external", { encoding: "utf8" });
    const file = service.getOrCreate({ name: "test", path: options.outPath, extension: "ts" });

    file.content = "// Test file";
    await service.flush();
    const files = await glob(`${options.outPath}/**/*`);
    expect(files.length).toBe(1);
    expect(file.fullPath.endsWith(files[0])).toBe(true);
  });
});
