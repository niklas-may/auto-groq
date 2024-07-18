import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: ["./src/app", "./src/cli"],
  rollup: {
    emitCJS: true
  },
  declaration: true,
});
