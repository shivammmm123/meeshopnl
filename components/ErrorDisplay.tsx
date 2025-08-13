import React from 'react';
import { XCircle, X } from 'lucide-react';

interface ErrorDisplayProps {
  message: string;
  onClose: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm p-4" role="alertdialog" aria-modal="true" aria-labelledby="error-dialog-title">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all animate-fade-in-down">
        <header className="flex items-center justify-between p-4 border-b border-red-200 bg-red-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <XCircle className="text-red-600" size={24} />
            <h2 id="error-dialog-title" className="text-xl font-bold text-red-800">An Error Occurred</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-red-500 hover:bg-red-100" aria-label="Close error dialog">
            <X size={24} />
          </button>
        </header>

        <main className="p-6">
          <p className="text-gray-700">The application encountered a problem. Please see the details below.</p>
          <pre className="mt-4 p-4 bg-gray-100 text-gray-800 rounded-lg text-sm whitespace-pre-wrap font-mono overflow-auto max-h-60">
            {message}
          </pre>
          <p className="mt-4 text-xs text-gray-500">
            For more technical details, please open your browser's developer console (press F12 or Ctrl+Shift+I) and check for any logged errors. If the problem persists, please check your file format or try again.
          </p>
        </main>
      </div>
    </div>
  );
};

export default ErrorDisplay;
