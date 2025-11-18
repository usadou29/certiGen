import { FormationData, Participant } from '../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { convertPptxToPdf, initializeWasmModule } from './pptxToPdfConverter';

export const generateCertificates = async (
  data: FormationData,
  onProgress: (current: number, total: number) => void
): Promise<void> => {
  const wasmModule = await initializeWasmModule();
  const usePdf = wasmModule !== null;

  if (!usePdf) {
    console.info('Generating certificates in PPTX format (WASM not available)');
  }

  const zip = new JSZip();
  const total = data.participants.length;
  const folderName = `Certificates_${data.formationName.replace(/\s+/g, '_')}`;
  const folder = zip.folder(folderName);

  if (!folder) {
    throw new Error('Could not create folder in ZIP');
  }

  const templateResponse = await fetch('/template.pptx');
  if (!templateResponse.ok) {
    throw new Error('Could not load certificate template');
  }
  const templateArrayBuffer = await templateResponse.arrayBuffer();
  const templateContent = new Uint8Array(templateArrayBuffer);

  for (let i = 0; i < data.participants.length; i++) {
    const participant = data.participants[i];
    const pptxBlob = await generateCertificatePPTX(participant, data, templateContent);

    const fileBaseName = `Certificate_${participant.firstName}_${participant.lastName}`;

    let fileBlob: Blob;
    let fileName: string;

    if (usePdf) {
      const pdfBlob = await convertPptxToPdf(pptxBlob, fileBaseName);
      if (pdfBlob) {
        fileBlob = pdfBlob;
        fileName = `${fileBaseName}.pdf`;
      } else {
        fileBlob = pptxBlob;
        fileName = `${fileBaseName}.pptx`;
      }
    } else {
      fileBlob = pptxBlob;
      fileName = `${fileBaseName}.pptx`;
    }

    folder.file(fileName, fileBlob);

    onProgress(i + 1, total);

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `${folderName}.zip`);
};

const generateCertificatePPTX = async (
  participant: Participant,
  data: FormationData,
  templateContent: Uint8Array
): Promise<Blob> => {
  const pizzip = new PizZip(templateContent);

  const doc = new Docxtemplater(pizzip, {
    paragraphLoop: true,
    linebreaks: true,
  });

    const end = new Date(data.endDate);

    let startDateFormatted = '';
    let endDateFormatted = '';
    endDateFormatted = end.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

    startDateFormatted = getStartDate(data);



  const dayOfDateFormatted = new Date().toLocaleDateString('fr');

  doc.setData({
    firstName: participant.firstName || '',
    lastName: participant.lastName || '',
    formationName: data.formationName || '',
    dayOfDate: dayOfDateFormatted || '',
    startDate: startDateFormatted,
    endDate: endDateFormatted,
  });

  try {
    doc.render();
  } catch (error) {
    console.error('Error rendering certificate:', error);
    throw error;
  }

  const buf = doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/pptx'
  });

  return buf;
};


function getStartDate(data: FormationData) {

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const isYearDifferent = start.getFullYear() !== end.getFullYear();

    const isMonthDifferent = start.getMonth() !== end.getMonth();
    if (isYearDifferent) {
        return start.toLocaleDateString('fr-FR', {year: 'numeric', month: 'long', day: 'numeric'});
    } else if (isMonthDifferent) {
        return start.toLocaleDateString('fr-FR', {month: 'long', day: 'numeric'});
    }
    return start.toLocaleDateString('fr-FR', {day: 'numeric'});
}
