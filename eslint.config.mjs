import next from "eslint-config-next";

const eslintConfig = [
  {
    ignores: ["**/.next/**", "**/node_modules/**", "**/out/**", "**/build/**"],
  },
  ...next,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-console": "off",
    },
  },
];

export default eslintConfig;
