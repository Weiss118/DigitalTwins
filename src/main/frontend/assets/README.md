# Assets para PWA - Digital Twin PoC

## Iconos Requeridos

Para que la PWA funcione correctamente, se necesitan los siguientes archivos PNG en esta carpeta:

| Archivo | Tamaño | Uso |
|---------|--------|-----|
| `icon-72.png` | 72x72 | Android Chrome, manifest |
| `icon-96.png` | 96x96 | Android Chrome, manifest |
| `icon-128.png` | 128x128 | Android Chrome, manifest |
| `icon-144.png` | 144x144 | Android Chrome, manifest |
| `icon-152.png` | 152x152 | iOS Safari, manifest |
| `icon-192.png` | 192x192 | Android Chrome, manifest, splash |
| `icon-384.png` | 384x384 | Android Chrome, manifest |
| `icon-512.png` | 512x512 | Android Chrome, manifest, splash |

## Generación Rápida

### Opción 1: Usando el SVG incluido (icon.svg)

```bash
# Con ImageMagick
convert icon.svg -resize 72x72 icon-72.png
convert icon.svg -resize 96x96 icon-96.png
convert icon.svg -resize 128x128 icon-128.png
convert icon.svg -resize 144x144 icon-144.png
convert icon.svg -resize 152x152 icon-152.png
convert icon.svg -resize 192x192 icon-192.png
convert icon.svg -resize 384x384 icon-384.png
convert icon.svg -resize 512x512 icon-512.png

# Con Inkscape
inkscape icon.svg -w 72 -h 72 -o icon-72.png
inkscape icon.svg -w 96 -h 96 -o icon-96.png
# ... etc

# Con Node.js (sharp)
npx sharp icon.svg -o icon-72.png --resize 72x72
npx sharp icon.svg -o icon-96.png --resize 96x96
# ... etc
```

### Opción 2: Herramientas Online

1. **PWA Asset Generator** (recomendado):
   ```bash
   npx pwa-asset-generator icon.svg assets/ --manifest manifest.webmanifest
   ```

2. **RealFaviconGenerator**: https://realfavicongenerator.net/

3. **PWA Builder**: https://www.pwabuilder.com/imageGenerator

### Opción 3: Script Node.js incluido

Ejecutar `node generate-icons.js` desde esta carpeta (requiere `sharp`).

## Capturas de Pantalla (Opcional)

Para la tienda de aplicaciones y manifiesto:
- `screenshot-login.png` - 1280x720 (wide)
- `screenshot-dashboard.png` - 1280x720 (wide)

## Iconos Apple Touch

Para iOS, también se recomienda:
- `apple-touch-icon.png` - 180x180
- `apple-touch-icon-ipad.png` - 167x167
- `apple-touch-icon-iphone.png` - 120x120

## Verificación

Después de generar los iconos, verificar en:
- Chrome DevTools > Application > Manifest
- Lighthouse PWA audit
- https://www.pwabuilder.com/