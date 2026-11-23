import { defineConfig } from 'vite';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Gives the service worker a cache name that changes with every build, so nobody
// has to remember to bump it by hand. Asset file names are hashed by Vite already.
function swCacheStamp() {
  return {
    name: 'sw-cache-stamp',
    apply: 'build',
    closeBundle() {
      const p = 'dist/sw.js';
      if (!existsSync(p)) return;
      const id = createHash('sha1').update(readFileSync('dist/index.html')).digest('hex').slice(0, 8);
      writeFileSync(p, readFileSync(p, 'utf8').replace(/budget-cockpit-v\d+/, 'budget-cockpit-' + id));
    },
  };
}

export default defineConfig({
  base: './',            // works on GitHub Pages sub-paths and inside the mobile apps
  publicDir: 'public',   // config.js, boot-guard.js, sw.js, manifest, icons, policy pages
  build: { outDir: 'dist', target: 'es2020', sourcemap: false },
  plugins: [swCacheStamp()],
});
