# Spire.Presentation WASM Setup Instructions

This application now uses Spire.Presentation WASM to convert PowerPoint certificates to PDF format before zipping them.

## Required Files

You need to download and place the following Spire.Presentation WASM files in the `/public` directory:

1. **Spire.Presentation.Base.js** - The main JavaScript loader
2. **Spire.Presentation.Base.wasm** - The WebAssembly binary
3. **ARIALUNI.TTF** - Font file for proper text rendering

## Where to Get the Files

### Option 1: Download from e-iceblue.com

1. Visit: https://www.e-iceblue.com/Download/presentation-for-javascript.html
2. Download the Spire.Presentation for JavaScript package
3. Extract the archive
4. Copy the following files to your `/public` folder:
   - `Spire.Presentation.Base.js`
   - `Spire.Presentation.Base.wasm`
   - `ARIALUNI.TTF` (from the fonts folder)

### Option 2: Use npm Package (if available)

```bash
npm install @e-iceblue/spire.presentation.wasm
```

Then copy the required files from `node_modules/@e-iceblue/spire.presentation.wasm/` to `/public`.

## File Structure

After setup, your `/public` directory should look like this:

```
/public
  ├── image.png
  ├── template.pptx
  ├── Spire.Presentation.Base.js
  ├── Spire.Presentation.Base.wasm
  └── ARIALUNI.TTF
```

## How It Works

1. The WASM module is loaded via `<script src="/Spire.Presentation.Base.js">` in `index.html`
2. On certificate generation, the module is initialized automatically
3. Each PPTX certificate is generated using Docxtemplater
4. The PPTX is then converted to PDF using Spire.Presentation
5. PDF certificates are added to the ZIP file for download

## Alternative Solution (Without WASM)

If you cannot obtain the Spire.Presentation files, you can revert to PPTX-only output by:

1. Removing the `convertPptxToPdf` call in `src/utils/certificateGenerator.ts`
2. Changing the file extension back to `.pptx`
3. Removing the WASM script from `index.html`

However, PDF output is strongly recommended for professional certificate distribution.

## Testing

Once the files are in place:

1. Run `npm run dev`
2. Configure your certificate settings
3. Upload participant data
4. Generate certificates
5. The downloaded ZIP should contain PDF files instead of PPTX files

## License Note

Spire.Presentation is a commercial product. Make sure you comply with e-iceblue's licensing terms for your use case. They offer free editions with limitations and paid licenses for commercial use.
