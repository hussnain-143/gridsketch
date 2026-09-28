const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateAll() {
  const assetsDir = path.join(__dirname, '..', 'assets', 'svgs');
  const androidResDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
  const iosAppIconDir = path.join(__dirname, '..', 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
  const iosSplashDir = path.join(__dirname, '..', 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset');
  const publicDir = path.join(__dirname, '..', 'public');

  const legacySvg = fs.readFileSync(path.join(assetsDir, 'v2_legacy.svg'));
  const adaptiveFgSvg = fs.readFileSync(path.join(assetsDir, 'v2_adaptive_fg.svg'));
  const splashPortSvg = fs.readFileSync(path.join(assetsDir, 'v2_splash_port.svg'));
  const splashLandSvg = fs.readFileSync(path.join(assetsDir, 'v2_splash_land.svg'));

  console.log('Rendering Android Launcher Icons...');
  const iconDensities = [
    { dir: 'mipmap-mdpi', size: 48, fgSize: 108 },
    { dir: 'mipmap-hdpi', size: 72, fgSize: 162 },
    { dir: 'mipmap-xhdpi', size: 96, fgSize: 216 },
    { dir: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
    { dir: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
  ];

  for (const d of iconDensities) {
    const targetDir = path.join(androidResDir, d.dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    // ic_launcher.png (legacy full icon)
    await sharp(legacySvg)
      .resize(d.size, d.size)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // ic_launcher_round.png
    await sharp(legacySvg)
      .resize(d.size, d.size)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    // ic_launcher_foreground.png (adaptive icon foreground)
    await sharp(adaptiveFgSvg)
      .resize(d.fgSize, d.fgSize)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    console.log(`Generated ${d.dir} icons (size: ${d.size}x${d.size}, fg: ${d.fgSize}x${d.fgSize})`);
  }

  console.log('Rendering Android Splash Screens...');
  const splashDensities = [
    { dir: 'drawable', w: 480, h: 800, svg: splashPortSvg },
    { dir: 'drawable-port-mdpi', w: 320, h: 480, svg: splashPortSvg },
    { dir: 'drawable-port-hdpi', w: 480, h: 800, svg: splashPortSvg },
    { dir: 'drawable-port-xhdpi', w: 720, h: 1280, svg: splashPortSvg },
    { dir: 'drawable-port-xxhdpi', w: 960, h: 1600, svg: splashPortSvg },
    { dir: 'drawable-port-xxxhdpi', w: 1280, h: 1920, svg: splashPortSvg },
    { dir: 'drawable-land-mdpi', w: 480, h: 320, svg: splashLandSvg },
    { dir: 'drawable-land-hdpi', w: 800, h: 480, svg: splashLandSvg },
    { dir: 'drawable-land-xhdpi', w: 1280, h: 720, svg: splashLandSvg },
    { dir: 'drawable-land-xxhdpi', w: 1600, h: 960, svg: splashLandSvg },
    { dir: 'drawable-land-xxxhdpi', w: 1920, h: 1280, svg: splashLandSvg },
  ];

  for (const s of splashDensities) {
    const targetDir = path.join(androidResDir, s.dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    await sharp(s.svg)
      .resize(s.w, s.h, { fit: 'cover' })
      .png()
      .toFile(path.join(targetDir, 'splash.png'));

    console.log(`Generated ${s.dir}/splash.png (${s.w}x${s.h})`);
  }

  console.log('Rendering iOS Icons & Splash Screens...');
  if (fs.existsSync(iosAppIconDir)) {
    await sharp(legacySvg)
      .resize(1024, 1024)
      .png()
      .toFile(path.join(iosAppIconDir, 'AppIcon-512@2x.png'));
    console.log('Generated iOS AppIcon (1024x1024)');
  }

  if (fs.existsSync(iosSplashDir)) {
    const splash2732 = await sharp(splashPortSvg)
      .resize(2732, 2732, { fit: 'cover' })
      .png()
      .toBuffer();

    await sharp(splash2732).toFile(path.join(iosSplashDir, 'splash-2732x2732.png'));
    await sharp(splash2732).toFile(path.join(iosSplashDir, 'splash-2732x2732-1.png'));
    await sharp(splash2732).toFile(path.join(iosSplashDir, 'splash-2732x2732-2.png'));
    console.log('Generated iOS Splash Screens (2732x2732)');
  }

  console.log('Updating Web / PWA public icons...');
  await sharp(legacySvg).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512.png'));
  await sharp(legacySvg).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192.png'));
  await sharp(legacySvg).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(legacySvg).resize(32, 32).png().toFile(path.join(publicDir, 'favicon.png'));
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), legacySvg);

  console.log('✨ All mobile icons and splash screens successfully generated!');
}

generateAll().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
