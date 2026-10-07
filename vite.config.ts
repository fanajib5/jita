import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';

const commitHash = execSync('git rev-parse HEAD').toString().trim();
const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/jita/',
  define: {
    'import.meta.env.VITE_COMMIT_HASH': JSON.stringify(commitHash),
    'import.meta.env.VITE_COMMIT_BRANCH': JSON.stringify(branch),
  },
});
