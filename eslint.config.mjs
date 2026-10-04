import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Client pages fetch data on mount via useEffect → setState in the
      // async callback. This rule treats that as a sync cascade and floods
      // every admin/portal page with false positives.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
