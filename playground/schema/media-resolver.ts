export const mediaResolver = /* groq */ `
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
`;