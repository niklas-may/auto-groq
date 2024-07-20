import { describe, expect, it, afterEach } from "vitest";
import { File, FileService } from "../src/lib/file";
import { existsSync, promises, rmSync } from "node:fs";
import path from "node:path";
import { glob } from "glob";
import { Context } from "src/lib/context";

describe("[FileService]", () => {
  const ctx = new Context(
    {
      schemas: {},
      resolvers: {},
      queries: {},
    },
    { outPath: "./test/fixtures/.autogroq"},
  );
  const { outPath } = ctx.options;

  afterEach(async () => {
    rmSync(path.resolve(ctx.options.outPath), { recursive: true, force: true });
  });

  it("should wirte file to disk", async () => {
    const service = new FileService(ctx);
   
    const file = new File({ name: "test", directory: "test", content: "// Test file"});
    service.set(file);
    await service.flush();

    expect(existsSync(service.resolveFilePath(file))).toBe(true);
  });

  it("flag new file as dirty", async () => {
    const service = new FileService(ctx);

    const file = new File({ name: "test", directory: "test", content: "// Test file"});
    service.set(file)
    const dirty = await service.isDirty(file);

    expect(dirty).toBe(true);
  });

  it("flag file as not dirty once written", async () => {
    const service = new FileService(ctx);
    
    const file = new File({ name: "test", directory: "test", content: "// Test file"});
    service.set(file)
    await service.flush();
    const isDirty = await service.isDirty(file);

    expect(isDirty).toBe(false);
  });

  it("flag file as dirty after update", async () => {
    const service = new FileService(ctx);
    
    const file = new File({ name: "test", directory: "test", content: "// Test file"});
    await service.flush();
    file.content = "// Updated file";
    const isDirty = await service.isDirty(file);

    expect(isDirty).toBe(true);
  });

  it("should remove files that are not in the current store", async () => {
    const service = new FileService(ctx);
    
    await promises.mkdir(outPath, { recursive: true });
    await promises.mkdir(path.join(outPath, "externalFolder"), { recursive: true });
    await promises.writeFile(path.join(outPath, "external.ts"), "// external", { encoding: "utf8" });
    
    const file = new File({ name: "file", directory: "test", content: "// Test file"});
    service.set(file)
    await service.flush();
    const files = await glob(`${outPath}/**/*`);
    
    expect(files.length).toBe(2);
    expect(service.resolveFilePath(file).endsWith(files[1])).toBe(true);
  });
});
