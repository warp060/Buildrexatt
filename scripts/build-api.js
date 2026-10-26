import esbuild from 'esbuild';
import fs from 'fs';

async function build() {
  if (!fs.existsSync('api')) {
    fs.mkdirSync('api', { recursive: true });
  }

  await esbuild.build({
    entryPoints: ['server/serverless.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    outfile: 'api/index.js',
    banner: {
      js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
    },
  });

  fs.copyFileSync('api/index.js', 'api/[...path].js');
  console.log('✅ Serverless API bundled successfully: api/index.js & api/[...path].js');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
