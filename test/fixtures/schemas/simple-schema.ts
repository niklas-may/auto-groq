export const simpleSchema = {
  name: "root",
  type: "document",
  fields: [
    {
      name: "stringL1_1",
      type: "string",
    },
    {
      name: "stringL1_2",
      type: "localeString",
    },
    {
      name: "obj1_string_x",
      type: "myObject",
    },
    {
      type: "array",
      name: "arrayWithMultipleTypes",
      of: [
        {
          name: "customComplex",
          type: "localeString",
        },
        {
          name: "customComplex2",
          type: "localeString",
        },
        {
          name: "obj1_string_x",
          type: "myObject",
        },
        {
          name: "hello",
          type: "string",
        },
        {
          type: "object",
          name: "obj3",
          fields: [
            {
              name: "obj3_string_1",
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
          name: "oneField",
          type: "localeString",
        },
      ],
    },
    {
      type: "array",
      name: "arrayWithOneObjectType",
      of: [
        {
          name: "objectType",
          type: "object",
          resolver: '{ "{{name}}_new": {{name}} }',
        },
      ],
    },
    {
      type: "object",
      name: "obj1Missing",
      fields: [
        {
          name: "obj1_string_2",
          type: "string",
        },
        {
          type: "object",
          name: "obj2",
          fields: [
            {
              name: "obj2_string_1",
              type: "string",
              resolver: '{ "{{name}}_property": {{name}} }',
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
