import React, { useEffect, useState } from 'react';
import { CheckCircle, Loader, Download, ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { FormationData } from '../types';
import { generateCertificates } from '../utils/certificateGenerator';

interface GenerationPageProps {
  formationData: FormationData;
  onBack: () => void;
  onReset: () => void;
}

export const GenerationPage: React.FC<GenerationPageProps> = ({
  formationData,
  onBack,
  onReset,
}) => {
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    startGeneration();
  }, []);

  const startGeneration = async () => {
    setIsGenerating(true);
    setTotal(formationData.participants.length);

    try {
      await generateCertificates(formationData, (current, total) => {
        setProgress(current);
        setTotal(total);
      });

      setIsComplete(true);
    } catch (error) {
      console.error('Error generating certificates:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const progressPercentage = total > 0 ? (progress / total) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {!isComplete && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-primary-700 hover:text-primary-900 mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          )}

          <div className="flex items-center justify-center mb-8">
            <img src="/image.png" alt="CertiGen" className="h-12" />
          </div>

          {!isComplete ? (
            <Card className="text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-accent rounded-full p-6">
                  <Loader className="w-16 h-16 text-white animate-spin" />
                </div>
              </div>

              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Generating Certificates
              </h1>

              <p className="text-lg text-gray-600 mb-8">
                Please wait while we create your certificates...
              </p>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>
                    {progress} / {total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-accent h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              <p className="text-sm text-gray-500">
                {Math.round(progressPercentage)}% complete
              </p>
            </Card>
          ) : (
            <Card className="text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-primary-500 rounded-full p-6">
                  <CheckCircle className="w-16 h-16 text-white" />
                </div>
              </div>

              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Certificates Generated Successfully!
              </h1>

              <p className="text-lg text-gray-600 mb-8">
                Your ZIP file containing {total} certificate{total > 1 ? 's' : ''} has
                been downloaded.
              </p>

              <div className="bg-primary-50 rounded-lg p-6 mb-8">
                <div className="grid md:grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="text-sm text-gray-600">Formation Name</p>
                    <p className="font-semibold text-gray-800">
                      {formationData.formationName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Certificates Generated</p>
                    <p className="font-semibold text-gray-800">{total}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-semibold text-gray-800">
                      {new Date(formationData.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">End Date</p>
                    <p className="font-semibold text-gray-800">
                      {new Date(formationData.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={onReset}
                  className="flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Generate More Certificates
                </Button>
                <Button onClick={onReset}>Done</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
