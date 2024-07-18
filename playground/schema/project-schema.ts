
export const projectSchema = {
  type: "document",
  name: "project",
  title: "Project",
  fields: [
    {
      name: "title",
      title: "Title ",
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
