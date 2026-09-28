/**
 * Generador de iconos PWA para Digital Twin PoC
 * Convierte icon.svg a múltiples tamaños PNG requeridos por el manifest
 * 
 * Uso: node generate-icons.js
 * Requiere: npm install sharp
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Tamaños requeridos por el manifest.webmanifest
const ICON_SIZES = [
  72, 96, 128, 144, 152, 192, 384, 512
];

// Rutas
const SOURCE_SVG = path.join(__dirname, 'icon.svg');
const OUTPUT_DIR = __dirname;

function checkDependencies() {
  try {
    require('sharp');
    return true;
  } catch (e) {
    return false;
  }
}

function checkInkscape() {
  return new Promise((resolve) => {
    const inkscape = spawn('inkscape', ['--version']);
    inkscape.on('close', (code) => resolve(code === 0));
    inkscape.on('error', () => resolve(false));
  });
}

function checkImageMagick() {
  return new Promise((resolve) => {
    const magick = spawn('convert', ['-version']);
    magick.on('close', (code) => resolve(code === 0));
    magick.on('error', () => resolve(false));
  });
}

async function generateWithSharp() {
  const sharp = require('sharp');
  
  console.log('🎨 Generando iconos con sharp...');
  
  for (const size of ICON_SIZES) {
    const outputFile = path.join(OUTPUT_DIR, `icon-${size}.png`);
    try {
      await sharp(SOURCE_SVG)
        .resize(size, size)
        .png({ compressionLevel: 9 })
        .toFile(outputFile);
      console.log(`  ✅ icon-${size}.png creado`);
    } catch (error) {
      console.error(`  ❌ Error generando icon-${size}.png:`, error.message);
    }
  }
  
  // Generar también apple-touch-icon
  try {
    await sharp(SOURCE_SVG)
      .resize(180, 180)
      .png({ compressionLevel: 9 })
      .toFile(path.join(OUTPUT_DIR, 'apple-touch-icon.png'));
    console.log('  ✅ apple-touch-icon.png creado');
  } catch (error) {
    console.error('  ❌ Error generando apple-touch-icon.png:', error.message);
  }
}

async function generateWithInkscape() {
  console.log('🎨 Generando iconos con Inkscape...');
  
  for (const size of ICON_SIZES) {
    const outputFile = path.join(OUTPUT_DIR, `icon-${size}.png`);
    await new Promise((resolve, reject) => {
      const inkscape = spawn('inkscape', [
        SOURCE_SVG,
        '-w', size.toString(),
        '-h', size.toString(),
        '-o', outputFile
      ]);
      
      inkscape.on('close', (code) => {
        if (code === 0) {
          console.log(`  ✅ icon-${size}.png creado`);
          resolve();
        } else {
          reject(new Error(`Inkscape exit code: ${code}`));
        }
      });
      
      inkscape.on('error', reject);
    });
  }
}

async function generateWithImageMagick() {
  console.log('🎨 Generando iconos con ImageMagick...');
  
  for (const size of ICON_SIZES) {
    const outputFile = path.join(OUTPUT_DIR, `icon-${size}.png`);
    await new Promise((resolve, reject) => {
      const convert = spawn('convert', [
        SOURCE_SVG,
        '-resize', `${size}x${size}`,
        outputFile
      ]);
      
      convert.on('close', (code) => {
        if (code === 0) {
          console.log(`  ✅ icon-${size}.png creado`);
          resolve();
        } else {
          reject(new Error(`ImageMagick exit code: ${code}`));
        }
      });
      
      convert.on('error', reject);
    });
  }
}

async function main() {
  console.log('🚀 Digital Twin PoC - Generador de Iconos PWA');
  console.log('==============================================\n');
  
  // Verificar archivo fuente
  if (!fs.existsSync(SOURCE_SVG)) {
    console.error('❌ No se encontró icon.svg en:', SOURCE_SVG);
    process.exit(1);
  }
  
  console.log('📄 Archivo fuente:', SOURCE_SVG);
  console.log('📁 Directorio salida:', OUTPUT_DIR);
  console.log('📏 Tamaños a generar:', ICON_SIZES.join(', '));
  console.log('');
  
  // Intentar métodos en orden de preferencia
  if (checkDependencies()) {
    console.log('📦 sharp detectado');
    await generateWithSharp();
  } else if (await checkInkscape()) {
    console.log('📦 Inkscape detectado');
    await generateWithInkscape();
  } else if (await checkImageMagick()) {
    console.log('📦 ImageMagick detectado');
    await generateWithImageMagick();
  } else {
    console.log('⚠️ No se encontró ninguna herramienta de generación.');
    console.log('\nInstala una de las siguientes:');
    console.log('  npm install sharp           # Recomendado (Node.js)');
    console.log('  # O bien:');
    console.log('  sudo apt install inkscape   # Linux');
    console.log('  brew install inkscape       # macOS');
    console.log('  # O bien:');
    console.log('  sudo apt install imagemagick');
    console.log('\nConsulta assets/README.md para más opciones.');
    process.exit(1);
  }
  
  console.log('\n✨ ¡Iconos generados exitosamente!');
  console.log('\nVerifica en:');
  console.log('  - Chrome DevTools > Application > Manifest');
  console.log('  - npx pwa-asset-generator icon.svg assets/ --manifest ../manifest.webmanifest');
}

// Ejecutar si es script principal
if (require.main === module) {
  main().catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { ICON_SIZES, main };