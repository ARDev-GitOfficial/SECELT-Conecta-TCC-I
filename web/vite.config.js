import { readFile } from 'node:fs/promises';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apkName = 'SECELT-Conecta-demo.apk';
const androidDownload = {
  name: 'secelt-android-download',
  apply: 'build',
  async generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: `downloads/${apkName}`,
      source: await readFile(new URL(`../${apkName}`, import.meta.url))
    });
  }
};

export default defineConfig({
  plugins: [react(), androidDownload],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4173',
      '/downloads/': 'http://localhost:4173'
    }
  }
});
