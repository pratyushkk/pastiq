import fs from 'fs';
import path from 'path';
import esbuild from 'esbuild';

const isWatch = process.argv.includes('--watch');

async function build() {
  console.log('⚡ Building Pastiq Chrome Extension...');

  const distDir = path.resolve('dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // 1. Compile TypeScript entry points with esbuild
  const entryPoints = [
    {
      in: 'src/background/service-worker.ts',
      out: 'background/service-worker',
      format: 'esm'
    },
    {
      in: 'src/content/content-script.ts',
      out: 'content/content-script',
      format: 'iife'
    },
    {
      in: 'src/popup/popup.ts',
      out: 'popup/popup',
      format: 'esm'
    },
    {
      in: 'src/options/options.ts',
      out: 'options/options',
      format: 'esm'
    },
    {
      in: 'src/onboarding/onboarding.ts',
      out: 'onboarding/onboarding',
      format: 'esm'
    }
  ];

  for (const entry of entryPoints) {
    await esbuild.build({
      entryPoints: [entry.in],
      outfile: path.join(distDir, `${entry.out}.js`),
      bundle: true,
      format: entry.format,
      target: 'es2022',
      minify: !isWatch,
      sourcemap: isWatch ? 'inline' : false,
      treeShaking: true,
      legalComments: 'none'
    });
    console.log(`  ✓ Compiled ${entry.out}.js`);
  }

  // 2. Copy static files
  function copyRecursive(src, dest) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
      for (const item of fs.readdirSync(src)) {
        copyRecursive(path.join(src, item), path.join(dest, item));
      }
    } else {
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(src, dest);
    }
  }

  // Copy manifest
  fs.copyFileSync('manifest.json', path.join(distDir, 'manifest.json'));

  // Copy CSS and HTML
  copyRecursive('src/content/content-style.css', path.join(distDir, 'content/content-style.css'));
  copyRecursive('src/popup/popup.html', path.join(distDir, 'popup/popup.html'));
  copyRecursive('src/popup/popup.css', path.join(distDir, 'popup/popup.css'));
  copyRecursive('src/styles', path.join(distDir, 'styles'));
  copyRecursive('src/options/options.html', path.join(distDir, 'options/options.html'));
  copyRecursive('src/options/options.css', path.join(distDir, 'options/options.css'));
  copyRecursive('src/onboarding/onboarding.html', path.join(distDir, 'onboarding/onboarding.html'));
  copyRecursive('src/onboarding/onboarding.css', path.join(distDir, 'onboarding/onboarding.css'));

  // Copy icons
  if (fs.existsSync('icons')) {
    copyRecursive('icons', path.join(distDir, 'icons'));
  }

  console.log('✅ Pastiq build complete! Output located in dist/');
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
