import defu from "defu";
import { Config, Options, UserOptions } from "./config";
import { FileService } from "./file";
import { ResolverService } from "./resolver";
import { SchemaService } from "./schema";

export interface IContextModule {
  context: Context;
}

export class Context {
  config!: Config;
  options!: Options;

  resolver = new ResolverService(this);
  schema = new SchemaService(this);
  file = new FileService(this);

  constructor(config: Config, options?: UserOptions) {
    this.setConfig(config);
    this.setOptions(options);
  }

  setConfig(config?: Config) {
    const defaults: Config = {
      queries: {},
      schemas: {},
    };

    this.config = defu(defaults, config);
  }

  setOptions(options?: UserOptions) {
    const defaults: Options = {
      outPath: "./.autogroq",
      inlineResolver: true,
      defaultExtenstion: "ts",
    };

    this.options = defu(options, defaults);
  }
}
