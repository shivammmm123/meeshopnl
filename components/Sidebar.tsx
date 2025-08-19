'use client';
import React, { useRef } from 'react';
import { BarChart3, Package, RotateCcw, Settings, UploadCloud, Home } from 'lucide-react';
import { SkuPrices, FilesData, UploadableFile, WorkerPayload } from '../types';
import { processFileLocally } from '../utils/localFileProcessor';

type View = 'payments' | 'orders' | 'returns' | 'settings';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  onProcessingComplete: (fileType: UploadableFile, payload: WorkerPayload) => void;
  onUploadStart: () => void;
  filesData: FilesData;
  skuPrices: SkuPrices | null;
  setProgress: (progress: number | null) => void;
  setProgressMessage: (message: string) => void;
  setError: (message: string | null) => void;
  uploadedFiles: UploadableFile[];
  onGoHome: () => void;
}

const menuItems: { name: View; label: string; icon: React.ReactNode }[] = [
    { name: 'payments', label: 'Payments Analysis', icon: <BarChart3 className="h-6 w-6" /> },
    { name: 'orders', label: 'Orders Analysis', icon: <Package className="h-6 w-6" /> },
    { name: 'returns', label: 'Returns Analysis', icon: <RotateCcw className="h-6 w-6" /> },
];

interface SidebarItemProps {
  item: typeof menuItems[0];
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onProcessingComplete, onUploadStart, filesData, skuPrices, setProgress, setProgressMessage, setError, uploadedFiles, onGoHome }) => {
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, fileType: UploadableFile) => {
    const file = event.target.files?.[0];
    if (!file) return;

    onUploadStart();
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
        const fileSizeThreshold = 10 * 1024 * 1024; // 10 MB

        if (file.size < fileSizeThreshold && typeof processFileLocally !== 'undefined') {
            const payload = await processFileLocally(file, fileType, filesData, skuPrices, (p) => { 
                setProgress(p.value); 
                setProgressMessage(p.message);
            });
            onProcessingComplete(fileType, payload as WorkerPayload);
        } else {
            const worker = new Worker(new URL('../utils/file.worker.ts', import.meta.url));
            const workerCleanup = () => { worker.terminate(); };
            worker.onmessage = (e) => {
                const { type, payload, message, progress } = e.data;
                try {
                    if (type === 'status') setProgressMessage(message);
                    else if (type === 'progress') { setProgress(progress); if (message) setProgressMessage(message); }
                    else if (type === 'done') { onProcessingComplete(fileType, payload); workerCleanup(); }
                    else if (type === 'error') throw new Error(message);
                } catch (err: any) {
                    setError(`Critical error handling worker message: ${err.message}`);
                    setProgress(null); setProgressMessage(''); workerCleanup();
                }
            };
            worker.onerror = (e) => { workerCleanup(); throw new Error(`A critical error occurred in the file worker. Details: ${e.message}`); };
            worker.postMessage({ newFile: { file, type: fileType }, existingFilesData: filesData, skuPrices: skuPrices });
        }
    } catch (err: any) {
        setError(`Error processing file: ${err.message}`);
        setProgress(null); setProgressMessage('');
    } finally {
        cleanup();
    }
  };

  const SidebarItem: React.FC<SidebarItemProps> = ({ item }) => {
    const isUploaded = uploadedFiles.includes(item.name as UploadableFile);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (isUploaded) {
        return <button key={item.name} onClick={() => setActiveView(item.name)} className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${activeView === item.name ? 'bg-green-100 text-green-700 font-bold' : 'text-gray-500 hover:bg-gray-100'}`} title={item.label}>
            {item.icon} <span className="truncate">{item.label}</span>
        </button>
    }

    return (
        <div className="relative group">
            <button key={item.name} onClick={() => fileInputRef.current?.click()} className="w-full flex items-center space-x-3 p-3 rounded-lg text-gray-400 bg-gray-50 border-2 border-dashed border-gray-300 hover:border-green-500 hover:text-green-600 transition-all" title={`Upload file for ${item.label}`}>
                {item.icon} <span className="truncate">{item.label}</span> <UploadCloud className="h-5 w-5 ml-auto"/>
                <input ref={fileInputRef} type="file" className="hidden" accept=".xlsx" onChange={(e) => handleFileChange(e, item.name as UploadableFile)} />
            </button>
        </div>
    )
  }

  return (
    <aside className="bg-white w-64 p-4 flex-col h-full shadow-md hidden md:flex space-y-4">
        <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-600 px-2 py-4">
            Seller<span className="font-light">Analytics</span>
        </div>
        <button onClick={onGoHome} className="w-full flex items-center space-x-3 p-3 rounded-lg text-gray-600 bg-gray-50 border border-gray-200 hover:bg-green-100 hover:text-green-700 hover:border-green-200 transition-all duration-200 font-medium" title="Back to Home Page">
            <Home className="h-5 w-5" /> <span className="truncate">Back to Home</span>
        </button>
        <nav className="flex-1 flex flex-col space-y-2">
            {menuItems.map(item => <SidebarItem key={item.name} item={item} />)}
        </nav>
        <div className="mt-auto">
            <button onClick={() => setActiveView('settings')} className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${activeView === 'settings' ? 'bg-green-100 text-green-700 font-bold' : 'text-gray-500 hover:bg-gray-100'}`} title="Settings">
                <Settings className="h-6 w-6" /> <span className="truncate">Settings</span>
            </button>
        </div>
    </aside>
  );
};