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

  // 1. Compile TypeScript entry points with esbuild as self-contained IIFE
  const entryPoints = [
    {
      in: 'src/background/service-worker.ts',
      out: 'background/service-worker'
    },
    {
      in: 'src/content/content-script.ts',
      out: 'content/content-script'
    },
    {
      in: 'src/popup/popup.ts',
      out: 'popup/popup'
    },
    {
      in: 'src/options/options.ts',
      out: 'options/options'
    },
    {
      in: 'src/onboarding/onboarding.ts',
      out: 'onboarding/onboarding'
    }
  ];

  for (const entry of entryPoints) {
    // Build to dist/
    await esbuild.build({
      entryPoints: [entry.in],
      outfile: path.join(distDir, `${entry.out}.js`),
      bundle: true,
      format: 'iife',
      target: 'es2022',
      minify: !isWatch,
      sourcemap: isWatch ? 'inline' : false,
      treeShaking: true,
      legalComments: 'none'
    });

    // Also mirror to root folder so loading root directly works too!
    const rootOutFile = path.resolve(`${entry.out}.js`);
    const rootOutDir = path.dirname(rootOutFile);
    if (!fs.existsSync(rootOutDir)) fs.mkdirSync(rootOutDir, { recursive: true });
    fs.copyFileSync(path.join(distDir, `${entry.out}.js`), rootOutFile);

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

  // Copy CSS and HTML to dist/
  copyRecursive('src/content/content-style.css', path.join(distDir, 'content/content-style.css'));
  copyRecursive('src/popup/popup.html', path.join(distDir, 'popup/popup.html'));
  copyRecursive('src/popup/popup.css', path.join(distDir, 'popup/popup.css'));
  copyRecursive('src/styles', path.join(distDir, 'styles'));
  copyRecursive('src/options/options.html', path.join(distDir, 'options/options.html'));
  copyRecursive('src/options/options.css', path.join(distDir, 'options/options.css'));
  copyRecursive('src/onboarding/onboarding.html', path.join(distDir, 'onboarding/onboarding.html'));
  copyRecursive('src/onboarding/onboarding.css', path.join(distDir, 'onboarding/onboarding.css'));

  // Also mirror HTML and CSS to root folder so loading root directly works too!
  copyRecursive('src/content/content-style.css', path.resolve('content/content-style.css'));
  copyRecursive('src/popup/popup.html', path.resolve('popup/popup.html'));
  copyRecursive('src/popup/popup.css', path.resolve('popup/popup.css'));
  copyRecursive('src/styles', path.resolve('styles'));
  copyRecursive('src/options/options.html', path.resolve('options/options.html'));
  copyRecursive('src/options/options.css', path.resolve('options/options.css'));
  copyRecursive('src/onboarding/onboarding.html', path.resolve('onboarding/onboarding.html'));
  copyRecursive('src/onboarding/onboarding.css', path.resolve('onboarding/onboarding.css'));

  // Copy icons
  if (fs.existsSync('icons')) {
    copyRecursive('icons', path.join(distDir, 'icons'));
  }

  console.log('✅ Pastiq build complete! Output ready in both dist/ and root folder.');
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
