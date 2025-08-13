import React from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';

interface SkipConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const SkipConfirmModal: React.FC<SkipConfirmModalProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-sm w-full m-4 transform transition-all animate-fade-in-down">
        <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mt-4">Are you sure?</h2>
            <p className="mt-2 text-sm text-gray-600">
                If you skip entering product costs, we can't calculate your exact profit, loss, or margins. The analysis will be incomplete.
            </p>
        </div>

        <div className="mt-6 flex gap-4">
            <button
                onClick={onCancel}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-md font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-colors"
            >
                <X size={20} />
                Cancel
            </button>
            <button
                onClick={onConfirm}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-md font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
                <Check size={20} />
                Continue
            </button>
        </div>
      </div>
    </div>
  );
};

export default SkipConfirmModal;
