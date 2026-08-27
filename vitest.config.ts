import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve:{alias:{'@':fileURLToPath(new URL('./',import.meta.url))}},
  test:{environment:'node',setupFiles:['./test/setup.ts'],include:['test/**/*.test.ts'],clearMocks:true,pool:'threads',maxWorkers:1,fileParallelism:false},
});
