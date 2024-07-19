import { Config, Options } from "./config";
import { FileService } from "./file";
import { ResolverContextModule } from "./resolver";
import { SchemaContextModule } from "./schema";

export interface IContextModule {
  context: Context;
}

export class Context {
  resolver = new ResolverContextModule(this);
  schema = new SchemaContextModule(this);
  file = new FileService(this);

  constructor(
    public config: Config,
    public options: Options,
  ) {}
}
