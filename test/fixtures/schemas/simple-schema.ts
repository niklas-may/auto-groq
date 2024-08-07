export const simpleSchema = {
  name: "simple",
  type: "document",
  fields: [
    {
      name: "stringL1_1",
      type: "string",
    },
    {
      name: "globalResolver",
      type: "localeString",
    },
    {
      name: "singleTypeReferenceWithFollow",
      type: "reference",
      to: [
        {
          type: "small",
          autogroq: {
            followReference: true,
          },
        },
      ],
    },
    {
      name: "multiTypeReferenceWithFollowSingleResolver",
      type: "reference",
      to: [
        {
          type: "small",
          autogroq: {
            followReference: true,
          },
        },
        {
          type: "other",
        },
      ],
    },
    {
      name: "multiTypeReferenceWithFollowMultiResolver",
      type: "reference",
      to: [
        {
          type: "small",
          autogroq: {
            followReference: true,
          },
        },
        {
          type: "smallAlt",
          autogroq: {
            followReference: true,
          },
        },
      ],
    },
    {
      name: "referenceNoFollow",
      type: "reference",
      to: [
        {
          type: "small",
        },
      ],
    },
    {
      type: "array",
      name: "arrayWithMultipleTypes",
      of: [
        {
          name: "globalResolver",
          type: "localeString",
        },
        {
          type: "object",
          name: "obj3",
          fields: [
            {
              name: "globalResolver",
              type: "localeString",
            },
            {
              name: "obj3_string_2",
              type: "string",
            },
          ],
        },
      ],
    },
    {
      type: "array",
      name: "arrayWithOneType",
      of: [
        {
          name: "globalResolver",
          type: "localeString",
        },
      ],
    },
    {
      type: "array",
      name: "arrayWithOneObjectType",
      of: [
        {
          name: "inlineResolver",
          type: "object",
          autogroq: '{ "{{name}}_new": {{name}} }',
        },
      ],
    },
    {
      type: "object",
      name: "nestedObject",
      fields: [
        {
          name: "obj1_string_2",
          type: "string",
        },
        {
          type: "object",
          name: "objectChild",
          fields: [
            {
              name: "inlineResolver",
              type: "string",
              autogroq: '{ "{{name}}_property": {{name}} }',
            },
            {
              name: "obj2_string_2",
              type: "string",
            },
          ],
        },
      ],
    },
  ],
};
