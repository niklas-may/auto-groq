import { describe, it } from "vitest";
import { App } from "../src/app";
import { createConfig } from "../src/lib/config";

const s = {
  type: "document",
  name: "project",
  title: "Project",
  fields: [
    {
      name: "title",
      title: "Title",
      description: "Only used as an internal reference.",
      type: "string",
    },
    { name: "displayTitle", type: "blockText" },
    { name: "text", title: "Text", type: "projectBlocks" },
    {
      name: "gallery",
      type: "array",
      of: [
        { type: "media", name: "media" },
        { type: "image", name: "image" },
      ],
      options: { layout: "grid" },
    },
    { name: "fullWidthGallery", type: "boolean", initialValue: false },
    {
      name: "url",
      title: "Website Url",
      type: "url",
      initialValue: " ",
    },
  ],
  preview: {
    select: {
      title: "title",
      thumb: "gallery",
      subtitle: "displayTitle",
      description: "text",
    },
  },
};

const blockTextResolver = /* groq */`
{{name}}[]{
  ...,
  _type == 'linkButton' => {
    text,
    type == 'Custom Url' => {
        "silly": true,
        'url': url
    },
    type == 'project' => {
        'url': project -> url
    },
    !defined(text) => {
        "text": *[_type == 'uiCopy'][0].learnMore
    }
  },
  markDefs[]{
    ...,
    _type == 'link' => {
        type,
        type == 'url' => {
            'url': url
        },
        type == 'project' => {
            'url': project -> url
        },
        type == 'page' => {
            'pageType': page -> _type,
            'slug': page -> slug.current
        }
    }
  }
}
`
const mediaResolver = /* groq */`
{
  _type,
  type,
  type == "image" => {
    "image": image.asset -> {
    url,
    'lqip': metadata.lqip,
    'ratio': metadata.dimensions.aspectRatio
  },
  crop,
  hotspot
  },
  type == "video" => {
    "player": player.asset -> {
      "playbackId": playbackId,
      "ratio": data.aspect_ratio,
      thumbTime

    },
    "mood": mood.asset -> {
    "playbackId": playbackId,
    "ratio": data.aspect_ratio
    }
  }
}
`

const imageResolver = /* groq */ `
{
    "image": image.asset -> {
    url,
    'lqip': metadata.lqip,
    'ratio': metadata.dimensions.aspectRatio
  }
}
`

const linkResolver = /* groq */`
{
  text,
  type == 'Custom Url' => {
    'url': url
  },
  type == 'project' => {
    'url': project -> url
  },
  !defined(text) => {
    "text": *[_TYPE == 'UICOPY'][0].LEARNMORE
  }
}
`

describe("[Playground]", () => {
  it("App should work", async () => {
    const { config, options } = createConfig(
      {
        schemas: {
          project: s,
        },
        resolvers: {
          blockText: blockTextResolver,
          media: mediaResolver,
          link: linkResolver,
          image: imageResolver
        },
        queries: {
          getProjectById: ({ project }) => `
          *[_id == $id] {
              ${project.projection} 
          }`,
        },
      },
      { outPath: "./.autogroq/playgound" },
    );

    const app = new App(config, options);
    await app.run();
  });
});
