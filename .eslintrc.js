module.exports = {
  "env": {
    "browser": true,
    "es6": true,
    "node": true
  },
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "tsconfig.eslint.json",
    "sourceType": "module"
  },
  "extends": [        
    "plugin:import/errors",
    "plugin:import/warnings"
  ],
  "plugins": [
    "@typescript-eslint/eslint-plugin",
    "import"
  ],
  "rules": {
    "@typescript-eslint/consistent-type-definitions": "error",
    "@typescript-eslint/explicit-member-accessibility": [
      "off",
      {
        "accessibility": "explicit"
      }
    ],
    "@typescript-eslint/indent": [
      "warn",
      2
    ],
    "@typescript-eslint/member-delimiter-style": [
      "error",
      {
        "multiline": {
          "delimiter": "semi",
          "requireLast": true
        },
        "singleline": {
          "delimiter": "semi",
          "requireLast": false
        }
      }
    ],
    "@typescript-eslint/member-ordering": "warn",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-empty-interface": "error",
    "@typescript-eslint/no-inferrable-types": "error",
    "@typescript-eslint/no-misused-new": "error",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-use-before-define": "error",
    "@typescript-eslint/prefer-function-type": "error",
    "@typescript-eslint/quotes": [
      "warn",
      "double"
    ],
    "@typescript-eslint/semi": [
      "error",
      "always"
    ],
    "@typescript-eslint/type-annotation-spacing": "error",
    "@typescript-eslint/unified-signatures": "error",
    "arrow-body-style": "warn",
    "camelcase": "off",
    "constructor-super": "error",
    "curly": "error",
    "dot-notation": "off",
    "eol-last": "error",
    "eqeqeq": [
      "error",
      "smart"
    ],
    "guard-for-in": "error",
    "id-blacklist": "off",
    "id-match": "off",
    "max-len": [
      "error",
      {
        "code": 140
      }
    ],
    "no-bitwise": "error",
    "no-caller": "error",
    "no-console": [
      "error",
      {
        "allow": [
          "log",
          "warn",
          "dir",
          "timeLog",
          "assert",
          "clear",
          "count",
          "countReset",
          "group",
          "groupEnd",
          "table",
          "dirxml",
          "error",
          "groupCollapsed",
          "Console",
          "profile",
          "profileEnd",
          "timeStamp",
          "context"
        ]
      }
    ],
    "no-debugger": "error",
    "no-empty": "off",
    "no-eval": "error",
    "no-fallthrough": "error",
    "no-new-wrappers": "error",
    "no-restricted-imports": [
      "error",
      "rxjs/Rx"
    ],
    "no-shadow": [
      "error",
      {
        "hoist": "all"
      }
    ],
    "no-throw-literal": "error",
    "no-trailing-spaces": "off",
    "no-undef-init": "error",
    "no-underscore-dangle": "off",
    "no-unused-expressions": "error",
    "no-unused-labels": "error",
    "no-var": "error",
    "prefer-const": "error",
    "radix": "error",
    "spaced-comment": "off",        
    "import/no-unresolved": "off"
  }
};
