export const linkResolver = /* groq */ `
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
`;
