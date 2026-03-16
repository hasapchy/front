import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'

export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    rules: {
      'vue/no-v-model-argument': 'off',
      'vue/no-v-for-template-key': 'off',
    },
  },
]
