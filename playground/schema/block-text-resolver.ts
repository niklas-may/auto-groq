export const blockTextResolver = /* groq */ `
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
`;
const mediaResolver = /* groq */ `
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
