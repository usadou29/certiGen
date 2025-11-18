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
let initializationPromise: Promise<SpireModule> | null = null;

export const initializeWasmModule = (): Promise<SpireModule> => {
  if (wasmModule) {
    return Promise.resolve(wasmModule);
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = new Promise((resolve, reject) => {
    const checkModule = () => {
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
      } else {
        setTimeout(checkModule, 100);
      }
    };

    const timeout = setTimeout(() => {
      reject(new Error('WASM module initialization timeout'));
    }, 30000);

    checkModule();

    const originalResolve = resolve;
    resolve = (value) => {
      clearTimeout(timeout);
      originalResolve(value);
    };
  });

  return initializationPromise;
};

export const convertPptxToPdf = async (pptxBlob: Blob, fileName: string): Promise<Blob> => {
  const module = await initializeWasmModule();

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
