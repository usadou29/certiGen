import { FormationData } from '../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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

  for (let i = 0; i < data.participants.length; i++) {
    const participant = data.participants[i];

    const pdfContent = await generateCertificatePDF(participant, data);

    const fileName = `Certificate_${participant.firstName}_${participant.lastName}.pdf`;
    folder.file(fileName, pdfContent);

    onProgress(i + 1, total);

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `${folderName}.zip`);
};

const generateCertificatePDF = async (
  participant: { firstName: string; lastName: string },
  data: FormationData
): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = 1122;
  canvas.height = 793;

  if (!ctx) {
    throw new Error('Could not create canvas context');
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#004721');
  gradient.addColorStop(0.5, '#00a85a');
  gradient.addColorStop(1, '#4dc493');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, 60);
  ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

  ctx.fillStyle = '#f0f9f4';
  ctx.fillRect(40, 80, canvas.width - 80, canvas.height - 160);

  ctx.strokeStyle = '#00a85a';
  ctx.lineWidth = 4;
  ctx.strokeRect(60, 100, canvas.width - 120, canvas.height - 200);

  ctx.fillStyle = '#004721';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('CERTIFICATE OF COMPLETION', canvas.width / 2, 200);

  ctx.font = '24px Arial';
  ctx.fillStyle = '#555555';
  ctx.fillText('This is to certify that', canvas.width / 2, 280);

  ctx.font = 'bold 56px Arial';
  ctx.fillStyle = '#00a85a';
  const fullName = `${participant.firstName} ${participant.lastName}`;
  ctx.fillText(fullName, canvas.width / 2, 360);

  ctx.font = '24px Arial';
  ctx.fillStyle = '#555555';
  ctx.fillText('has successfully completed the training', canvas.width / 2, 420);

  ctx.font = 'bold 36px Arial';
  ctx.fillStyle = '#004721';
  ctx.fillText(data.formationName, canvas.width / 2, 490);

  ctx.font = '20px Arial';
  ctx.fillStyle = '#666666';
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
  ctx.fillText(
    `From ${startDateFormatted} to ${endDateFormatted}`,
    canvas.width / 2,
    550
  );

  ctx.fillStyle = '#00a85a';
  ctx.fillRect(canvas.width / 2 - 100, 600, 200, 3);

  ctx.font = '18px Arial';
  ctx.fillStyle = '#888888';
  const issueDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  ctx.fillText(`Issued on ${issueDate}`, canvas.width / 2, 660);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      }
    }, 'application/pdf');
  });
};
