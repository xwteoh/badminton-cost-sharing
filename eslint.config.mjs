import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      // Security Rules
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
      "no-alert": "error",
      "no-console": "warn", // Allow console in development, warn in production
      
      // Financial Application Rules
      "no-floating-decimal": "error", // Require leading/trailing decimals
      "radix": "error", // Require radix for parseInt
      "no-implicit-coercion": ["error", { "boolean": false }],
      
      // TypeScript Rules for Financial Data
      "@typescript-eslint/no-explicit-any": "error",
      // Unsafe rules disabled for now - require complex parserOptions setup
      // "@typescript-eslint/no-unsafe-assignment": "error",
      // "@typescript-eslint/no-unsafe-member-access": "error", 
      // "@typescript-eslint/no-unsafe-call": "error",
      // "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/prefer-as-const": "error",
      "@typescript-eslint/no-unused-vars": ["error", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_" 
      }],
      
      // React Security Rules
      "react/no-danger": "error",
      "react/no-danger-with-children": "error",
      "react/jsx-no-script-url": "error",
      "react/jsx-no-target-blank": "error",
      
      // Mobile-First Rules
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/no-noninteractive-element-interactions": "error",
      // Touch target spacing enforced via design system (44px+ minimum)
      
      // Performance Rules
      "react-hooks/exhaustive-deps": "error",
      "react/jsx-no-bind": ["warn", { "allowArrowFunctions": true }],
      
      // Code Quality Rules
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-template": "error",
      "no-param-reassign": ["error", { "props": true }],
      "no-magic-numbers": ["warn", { 
        "ignore": [0, 1, -1, 2, 10, 100, 1000],
        "ignoreArrayIndexes": true,
        "detectObjects": false
      }],
      
      // Import Rules
      "import/no-default-export": "off", // Next.js requires default exports for pages
      "import/prefer-default-export": "off",
      "import/order": ["error", {
        "groups": [
          "builtin",
          "external", 
          "internal",
          "parent",
          "sibling",
          "index"
        ],
        "newlines-between": "always",
        "alphabetize": { "order": "asc" }
      }],
      
      // Naming Conventions for Financial App - relaxed for Next.js components
      "@typescript-eslint/naming-convention": [
        "error",
        {
          "selector": "variableLike",
          "format": ["camelCase", "PascalCase"], // Allow PascalCase for React components
          "leadingUnderscore": "allow"
        },
        {
          "selector": "function",
          "format": ["camelCase", "PascalCase"] // Allow PascalCase for React components
        },
        {
          "selector": "typeLike",
          "format": ["PascalCase"]
        },
        {
          "selector": "interface",
          "format": ["PascalCase"],
          "custom": {
            "regex": "^I[A-Z]",
            "match": false
          }
        },
        {
          "selector": "enum",
          "format": ["PascalCase"]
        },
        {
          "selector": "enumMember",
          "format": ["UPPER_CASE"]
        }
      ]
    }
  },
  {
    // Specific rules for financial calculation files
    files: ["**/lib/calculations/**/*.{ts,tsx}", "**/utils/money/**/*.{ts,tsx}"],
    rules: {
      "no-magic-numbers": ["error", { 
        "ignore": [0, 1, -1], // Only allow these basic numbers
        "ignoreArrayIndexes": false,
        "detectObjects": true
      }],
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "prefer-const": "error",
      "no-var": "error"
    }
  },
  {
    // Relaxed rules for configuration files
    files: ["*.config.{js,ts,mjs}", "next.config.{js,ts}"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-var-requires": "off"
    }
  },
  {
    // Strict rules for Supabase integration files
    files: ["**/lib/supabase/**/*.{ts,tsx}", "**/hooks/use*supabase*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "error",
      "no-console": ["error", { "allow": ["error"] }] // Only allow console.error
    }
  },
  {
    // Security-focused rules for auth files
    files: ["**/auth/**/*.{ts,tsx}", "**/middleware.{ts,tsx}"],
    rules: {
      "no-console": ["error", { "allow": ["error"] }],
      "@typescript-eslint/no-explicit-any": "error",
      "no-eval": "error",
      "no-new-func": "error"
    }
  }
];

export default eslintConfig;
