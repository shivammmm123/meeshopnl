
import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProgressBarModalProps {
  progress: number;
  message: string;
}

const ProgressBarModal: React.FC<ProgressBarModalProps> = ({ progress, message }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full m-4 text-center transform transition-all animate-fade-in-down">
        <Loader2 className="h-10 w-10 text-green-500 mx-auto animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Processing File</h2>
        <p 
          className="mt-2 text-sm text-gray-600 mb-4 min-h-[1.25rem]"
          aria-live="polite"
          aria-atomic="true"
        >
          {message || 'Please wait...'}
        </p>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-green-500 h-4 rounded-full transition-all duration-300 ease-linear" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-lg font-bold text-green-600 mt-2">{Math.round(progress)}%</p>
      </div>
    </div>
  );
};

export default ProgressBarModal;