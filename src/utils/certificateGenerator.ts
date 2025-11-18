import { FormationData, Participant } from '../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

export const generateCertificates = async (
  data: FormationData,
  onProgress: (current: number, total: number) => void
): Promise<void> => {
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

    const pdfContent = await generateCertificatePDF(participant, data, templateContent);

    const fileName = `Certificate_${participant.firstName}_${participant.lastName}.pdf`;
    folder.file(fileName, pdfContent);

    onProgress(i + 1, total);

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `${folderName}.zip`);
};

const generateCertificatePDF = async (
  participant: Participant,
  data: FormationData,
  templateContent: Uint8Array
): Promise<Blob> => {
  const pizzip = new PizZip(templateContent);

  const doc = new Docxtemplater(pizzip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  const startDateFormatted = new Date(data.startDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const endDateFormatted = new Date(data.endDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  doc.setData({
    firstName: participant.firstName || '',
    lastName: participant.lastName || '',
    fullName: `${participant.firstName} ${participant.lastName}`,
    formationName: data.formationName || '',
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
    mimeType: 'application/pdf'
  });

  return buf;
};
