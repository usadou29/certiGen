import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  label?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  accept = '.xlsx,.csv',
  label = 'Upload File',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleClick}
        className="w-full border-2 border-dashed border-primary-300 rounded-xl p-8 hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 flex flex-col items-center justify-center gap-3"
      >
        <Upload className="w-12 h-12 text-primary-600" />
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">{label}</p>
          <p className="text-sm text-gray-500 mt-1">
            Accepted formats: {accept}
          </p>
        </div>
      </button>
    </div>
  );
};
