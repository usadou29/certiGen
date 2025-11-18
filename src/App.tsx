import { useState } from 'react';
import { ConfigurationPage } from './pages/ConfigurationPage';
import { GenerationPage } from './pages/GenerationPage';
import { FormationData } from './types';

type Page = 'configuration' | 'generation';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('configuration');
  const [formationData, setFormationData] = useState<FormationData | null>(null);

  const handleGenerate = (data: FormationData) => {
    setFormationData(data);
    setCurrentPage('generation');
  };

  const handleBack = () => {
    setCurrentPage('configuration');
  };

  const handleReset = () => {
    setFormationData(null);
    setCurrentPage('configuration');
  };

  return (
    <>
      {currentPage === 'configuration' && (
        <ConfigurationPage
          onGenerate={handleGenerate}
          onBack={handleReset}
        />
      )}
      {currentPage === 'generation' && formationData && (
        <GenerationPage
          formationData={formationData}
          onBack={handleBack}
          onReset={handleReset}
        />
      )}
    </>
  );
}

export default App;
