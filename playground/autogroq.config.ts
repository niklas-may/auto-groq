import { createConfig } from "../src/lib/config";
import { projectSchema } from "./schema/project-schema";
import { blockTextResolver } from "./schema/block-text-resolver";
import { imageResolver } from "./schema/image-resolver";
import { linkResolver } from "./schema/link-resolver";
import { mediaResolver } from "./schema/media-resolver";

export default createConfig(
  {
    schemas: {
      project: projectSchema,
    },
    resolvers: {
      blockText: blockTextResolver,
      image: imageResolver,
      link: linkResolver,
      media: mediaResolver
    },
    queries: {
      getProjectById: (schemas) => `
        *[_id == $id] {
          ${schemas.project.projection}
        }`,
      getProjects: (schemas) => `
        *[_type == "project"] {
          ${schemas.project.projection}
        }`,
    },
  },
  { output: "./playground/.autogroq" },
);
