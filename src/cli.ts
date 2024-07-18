import path from "node:path";
import { defineCommand, runMain } from "citty";
import { loadConfig } from "c12";
import pkg from "./../package.json" assert { type: "json" };
import { App } from "./app";

const generate = defineCommand({
  meta: {
    name: "generate",
    description: "Generate Groq queries.",
  },
  args: {
    config: {
      type: "string",
      description: "Path to config file",
      required: false,
    },
    watch: {
      type: "boolean",
      description: "Watch for changes",
      required: false,
    },
  },
  run: async ({ args }) => {
    const configPath = path.resolve((args?.c as string) ?? process.cwd());
    const c = await loadConfig({
      name: "autogroq",
      cwd: configPath,
      jitiOptions: { debug: true },
    });

    const app = new App(c.config.config, c.config.options);
    await app.run();
  },
});

const main = defineCommand({
  meta: {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
  },
  subCommands: {
    generate,
  },
});

runMain(main);
