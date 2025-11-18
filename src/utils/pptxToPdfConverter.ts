interface SpireModule {
  FetchFileToVFS: (filename: string, path: string, publicUrl: string) => Promise<void>;
  Presentation: {
    Create: () => SpirePresentation;
  };
  FileFormat: {
    PDF: number;
  };
  FS: {
    readFile: (filename: string) => Uint8Array;
    writeFile: (filename: string, data: Uint8Array) => void;
    unlink: (filename: string) => void;
  };
  onRuntimeInitialized?: () => void;
}

interface SpirePresentation {
  LoadFromFile: (filename: string) => void;
  SaveToFile: (options: { file: string; fileFormat: number }) => void;
  Dispose: () => void;
}

declare global {
  interface Window {
    Module?: any;
    spirepresentation?: SpireModule;
  }
}

let wasmModule: SpireModule | null = null;
let initializationPromise: Promise<SpireModule | null> | null = null;

export const initializeWasmModule = (): Promise<SpireModule | null> => {
  if (wasmModule) {
    return Promise.resolve(wasmModule);
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 30;

    const checkModule = () => {
      attempts++;

      if (window.spirepresentation && window.Module) {
        const { Module, spirepresentation } = window;

        if (Module.calledRun) {
          wasmModule = spirepresentation;
          resolve(spirepresentation);
        } else {
          Module.onRuntimeInitialized = () => {
            wasmModule = spirepresentation;
            resolve(spirepresentation);
          };
        }
      } else if (attempts >= maxAttempts) {
        console.warn('WASM module not available. Falling back to PPTX output.');
        resolve(null);
      } else {
        setTimeout(checkModule, 100);
      }
    };

    checkModule();
  });

  return initializationPromise;
};

export const convertPptxToPdf = async (pptxBlob: Blob, fileName: string): Promise<Blob | null> => {
  const module = await initializeWasmModule();

  if (!module) {
    return null;
  }

  const pptxArrayBuffer = await pptxBlob.arrayBuffer();
  const pptxData = new Uint8Array(pptxArrayBuffer);

  const inputFileName = `${fileName}.pptx`;
  const outputFileName = `${fileName}.pdf`;

  try {
    await module.FetchFileToVFS('ARIALUNI.TTF', '/Library/Fonts/', '/');
  } catch (error) {
    console.warn('Could not load font file, continuing without it');
  }

  module.FS.writeFile(inputFileName, pptxData);

  const ppt = module.Presentation.Create();
  ppt.LoadFromFile(inputFileName);

  ppt.SaveToFile({
    file: outputFileName,
    fileFormat: module.FileFormat.PDF
  });

  const pdfData = module.FS.readFile(outputFileName);
  const pdfBlob = new Blob([pdfData], { type: 'application/pdf' });

  ppt.Dispose();

  try {
    module.FS.unlink(inputFileName);
    module.FS.unlink(outputFileName);
  } catch (error) {
    console.warn('Could not clean up temporary files');
  }

  return pdfBlob;
};

export const isWasmAvailable = async (): Promise<boolean> => {
  const module = await initializeWasmModule();
  return module !== null;
};
