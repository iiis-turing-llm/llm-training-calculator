import { defineConfig } from 'umi';

export default defineConfig({
  title: 'LLM Training Calculator',
  nodeModulesTransform: {
    type: 'none',
  },
  history: {
    type: 'hash'
  },
  base: '/',
  publicPath: '/',
  hash: true,
  routes: [
    { path: '/', component: '@/pages/index' },
  ],
  fastRefresh: {},
  proxy: {
    '/llm_training': {
      target: 'http://localhost:8000',
      // target: 'http://192.168.201.203:8000',
      changeOrigin: true,
      pathRewrite: { '^/api': '/api' },
    },
  },
});
