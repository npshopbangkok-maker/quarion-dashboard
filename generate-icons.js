const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, 'public', 'icons');

// Create a simple icon using sharp
async function generateIcons() {
  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  for (const size of sizes) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#8b5cf6"/>
            <stop offset="100%" style="stop-color:#ec4899"/>
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="100" fill="url(#bg)"/>
        <text x="256" y="340" font-family="Arial, sans-serif" font-size="300" font-weight="bold" fill="white" text-anchor="middle">Q</text>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));

    console.log(`Generated icon-${size}x${size}.png`);
  }

  console.log('All icons generated!');
}

generateIcons().catch(console.error);
