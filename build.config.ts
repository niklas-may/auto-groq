import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: ["./src/app"],
  rollup: {
    emitCJS: true
  },
  declaration: true,
});
