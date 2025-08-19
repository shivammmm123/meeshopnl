import React, { useState } from 'react';
import { DollarSign, Package, RotateCcw, UploadCloud, Loader2, CheckCircle } from 'lucide-react';
import { SkuPrices, FilesData, UploadableFile, WorkerPayload } from '../types';
import InfoTooltip from './InfoTooltip';
import AppHeader from './AppHeader';
import Footer from './Footer';


type FileStatus = 'idle' | 'loading' | 'success' | 'error';

interface UploadPageProps {
  onUploadStart: () => void;
  onProcessingComplete: (fileType: UploadableFile, payload: WorkerPayload) => void;
  filesData: FilesData;
  skuPrices: SkuPrices | null;
  isProcessing: boolean;
  setProgress: (progress: number | null) => void;
  setProgressMessage: (message: string) => void;
  setError: (message: string | null) => void;
  onGoHome: () => void;
}

const fileConfigs = {
  payments: {
    icon: <DollarSign size={24} />,
    title: "Payments File",
    help: "Download from 'Payments' > 'All Payments' section. The sheet is named 'Order Payments'."
  },
  orders: {
    icon: <Package size={24} />,
    title: "Orders File",
    help: "Download from 'Orders' > 'All Orders'. Export the order list."
  },
  returns: {
    icon: <RotateCcw size={24} />,
    title: "Returns File",
    help: "Download from the 'Returns' section of your Meesho panel."
  }
};

export const UploadPage: React.FC<UploadPageProps> = ({ onUploadStart, onProcessingComplete, filesData, skuPrices, isProcessing, setProgress, setProgressMessage, setError, onGoHome }) => {
  const [statuses, setStatuses] = useState<Record<UploadableFile, FileStatus>>({ payments: 'idle', orders: 'idle', returns: 'idle' });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, fileType: UploadableFile) => {
    const file = event.target.files?.[0];
    if (!file) return;

    onUploadStart();
    setStatuses(prev => ({ ...prev, [fileType]: 'loading' }));
    setError(null);
    
    const progressTimeout = setTimeout(() => {
        setProgress(0);
        setProgressMessage('Reading file...');
    }, 250);

    const cleanup = () => {
        clearTimeout(progressTimeout);
        if (event.target) (event.target as HTMLInputElement).value = '';
    };

    try {
        // Use a proper TypeScript module for the worker.
        const worker = new Worker(new URL('../utils/file.worker.ts', import.meta.url));

        const workerCleanup = () => worker.terminate();

        worker.onmessage = (e) => {
            const { type, payload, message, progress } = e.data;
            try {
              if (type === 'status') {
                  setProgressMessage(message);
              } else if (type === 'progress') {
                  setProgress(progress);
                  if (message) setProgressMessage(message);
              } else if (type === 'done') {
                  setStatuses(prev => ({ ...prev, [fileType]: 'success' }));
                  onProcessingComplete(fileType, payload);
                  workerCleanup();
              } else if (type === 'error') {
                  throw new Error(message);
              }
            } catch(err) {
                const errorMessage = `Critical error handling worker message: ${err instanceof Error ? err.message : String(err)}`;
                setError(errorMessage);
                console.error(errorMessage, err);
                setStatuses(prev => ({...prev, [fileType]: 'error'}));
                setProgress(null);
                setProgressMessage('');
                workerCleanup();
            }
        };
        
        worker.onerror = (e) => {
            workerCleanup();
            throw new Error(`A critical error occurred in the file worker. Details: ${e.message}`);
        };

        worker.postMessage({
            newFile: { file, type: fileType },
            existingFilesData: filesData,
            skuPrices: skuPrices,
        });

    } catch (err) {
        const errorMessage = `Error processing file: ${err instanceof Error ? err.message : String(err)}`;
        setError(errorMessage);
        console.error(errorMessage, err);
        setStatuses(prev => ({ ...prev, [fileType]: 'error' }));
        setProgress(null);
        setProgressMessage('');
    } finally {
        cleanup();
    }
  };

  const UploadCard = ({ type }: { type: UploadableFile }) => {
    const config = fileConfigs[type as keyof typeof fileConfigs];
    const status = statuses[type];

    const getStatusContent = () => {
        switch(status) {
            case 'loading': return <><Loader2 className="w-5 h-5 animate-spin" /> <span>Processing...</span></>;
            case 'success': return <><CheckCircle className="w-5 h-5 text-green-500" /> <span>Uploaded!</span></>;
            case 'error': return <span className="text-red-500">Error</span>
            default: return <><UploadCloud className="w-5 h-5" /> <span>Upload File</span></>;
        }
    }
    
    return (
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 flex flex-col items-center text-center transition-all hover:shadow-lg hover:-translate-y-1">
        <div className="flex items-center justify-center gap-2 mb-2">
            <h2 className="text-xl font-bold text-gray-800">{config.title}</h2>
            <InfoTooltip text={config.help} />
        </div>
        <div className="p-4 rounded-full bg-green-100 text-green-600 mb-4">
            {config.icon}
        </div>
        <label className="w-full cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
            <input type="file" className="hidden" accept=".xlsx" onChange={(e) => handleFileChange(e, type)} disabled={status === 'loading'} />
            {getStatusContent()}
        </label>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AppHeader onBack={onGoHome} />
      <main className="flex-grow w-full flex items-center justify-center p-4">
        <div className="w-full max-w-5xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-gray-900">Upload Your Data</h1>
            <p className="mt-2 text-lg text-gray-500">Start by uploading any of your Meesho report files to begin.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <UploadCard type="payments" />
              <UploadCard type="orders" />
              <UploadCard type="returns" />
          </div>
          <p className="text-center text-gray-500 mt-8 text-sm">
              Don't worry, your data is processed entirely in your browser and is never uploaded to our servers.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UploadPage;