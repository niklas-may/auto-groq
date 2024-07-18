export const imageResolver = /* groq */ `
{
    "image": image.asset -> {
    url,
    'lqip': metadata.lqip,
    'ratio': metadata.dimensions.aspectRatio
  }
}
`;
