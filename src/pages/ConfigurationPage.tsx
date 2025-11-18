import React, { useState } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { FileUploader } from '../components/FileUploader';
import { Participant, FormationData } from '../types';
import * as XLSX from 'xlsx';

interface ConfigurationPageProps {
  onGenerate: (data: FormationData) => void;
  onBack: () => void;
}

export const ConfigurationPage: React.FC<ConfigurationPageProps> = ({
  onGenerate,
  onBack,
}) => {
  const [participants, setParticipants] = useState<Participant[]>([
    { firstName: '', lastName: '' },
  ]);
  const [formationName, setFormationName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addParticipant = () => {
    setParticipants([...participants, { firstName: '', lastName: '' }]);
  };

  const removeParticipant = (index: number) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const updateParticipant = (
    index: number,
    field: 'firstName' | 'lastName',
    value: string
  ) => {
    const updated = [...participants];
    updated[index][field] = value;
    setParticipants(updated);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      const newParticipants: Participant[] = json.map((row: any) => ({
        firstName: row['Prénom'] || row['First Name'] || row['firstName'] || '',
        lastName: row['Nom'] || row['Last Name'] || row['lastName'] || '',
      }));

      if (newParticipants.length > 0) {
        setParticipants(newParticipants);
      }
    };
    reader.readAsBinaryString(file);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formationName.trim()) {
      newErrors.formationName = 'Formation name is required';
    }

    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    const hasValidParticipant = participants.some(
      (p) => p.firstName.trim() && p.lastName.trim()
    );

    if (!hasValidParticipant) {
      newErrors.participants = 'At least one participant is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      const validParticipants = participants.filter(
        (p) => p.firstName.trim() && p.lastName.trim()
      );

      onGenerate({
        participants: validParticipants,
        formationName,
        startDate,
        endDate,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-8">
            <img src="/image.png" alt="CertiGen" className="h-12" />
          </div>

          <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
            Configure Your Certificates
          </h1>

          <Card className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Formation Details
            </h2>

            <div className="space-y-4">
              <Input
                label="Formation Name"
                placeholder="e.g., Advanced Project Management"
                value={formationName}
                onChange={(e) => setFormationName(e.target.value)}
                error={errors.formationName}
              />

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  error={errors.startDate}
                />

                <Input
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  error={errors.endDate}
                />
              </div>
            </div>
          </Card>

          <Card className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Participants
            </h2>

            <div className="mb-6">
              <FileUploader
                onFileSelect={handleFileUpload}
                label="Import from Excel/CSV"
                accept=".xlsx,.xls,.csv"
              />
              <p className="text-sm text-gray-500 mt-2 text-center">
                Expected columns: "Prénom" or "First Name" and "Nom" or "Last Name"
              </p>
            </div>

            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700">
                  Manual Entry
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addParticipant}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Participant
                </Button>
              </div>

              {errors.participants && (
                <p className="text-sm text-red-600 mb-4">{errors.participants}</p>
              )}

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {participants.map((participant, index) => (
                  <div
                    key={index}
                    className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <Input
                        placeholder="First Name"
                        value={participant.firstName}
                        onChange={(e) =>
                          updateParticipant(index, 'firstName', e.target.value)
                        }
                      />
                      <Input
                        placeholder="Last Name"
                        value={participant.lastName}
                        onChange={(e) =>
                          updateParticipant(index, 'lastName', e.target.value)
                        }
                      />
                    </div>
                    {participants.length > 1 && (
                      <button
                        onClick={() => removeParticipant(index)}
                        className="text-red-500 hover:text-red-700 mt-3"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleSubmit}
              className="flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Generate Certificates
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
