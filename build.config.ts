import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: ["./src/main", "./src/cli"],
  rollup: {
    emitCJS: true,
  },
  declaration: true,
});
