const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Define icon sizes
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Output directory
const outputDir = path.join(__dirname, 'public', 'icons');

// Source image – put your own logo here (optional)
// Supported formats: PNG, JPG, SVG, etc.
const sourceImage = path.join(__dirname, 'public', 'logo.png'); // change to your file

// If you don't have a logo, the script will create coloured squares
const useSourceImage = fs.existsSync(sourceImage);

// Create output folder
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    
    if (useSourceImage) {
      // Resize source image to exact dimensions
      await sharp(sourceImage)
        .resize(size, size, { fit: 'cover' })
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated from logo: icon-${size}x${size}.png`);
    } else {
      // Create a coloured placeholder (gradient background)
      const svg = `
        <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad)"/>
          <text x="50%" y="50%" font-size="${size/3}px" fill="white" text-anchor="middle" dy=".3em" font-family="Arial">🎤</text>
        </svg>
      `;
      await sharp(Buffer.from(svg))
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated placeholder: icon-${size}x${size}.png`);
    }
  }
  console.log('\n✅ All icons generated in frontend/public/icons/');
  console.log('If you want to use your own logo, place a file named logo.png in frontend/public/ and run this script again.\n');
}

generateIcons().catch(err => console.error('Error:', err));