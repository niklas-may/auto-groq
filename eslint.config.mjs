import unjs from "eslint-config-unjs";

export default unjs({
  extends: ["eslint-config-unjs"],
  rules: {
    "unicorn/prevent-abbreviations": 0,
    "unicorn/no-null": 0,
    "unicorn/no-array-reduce": "off",
    "unicorn/prefer-spread": "off",
    "unicorn/prefer-string-slice": "off"
  },
});
