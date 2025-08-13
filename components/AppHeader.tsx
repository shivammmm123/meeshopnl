import React from 'react';
import { Home, ArrowLeft } from 'lucide-react';

interface AppHeaderProps {
    onBack: () => void;
    backText?: string;
    backIcon?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onBack, backText = "Back to Home", backIcon = <Home size={16} /> }) => {
    return (
        <header className="py-4 px-6 md:px-8 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10 shadow-sm">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-600">
                Seller<span className="font-light">Analytics</span>
            </div>
            <button
                onClick={onBack}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 transition-all duration-300 transform"
                title={backText}
            >
                {backIcon}
                {backText}
            </button>
        </header>
    );
};

export default AppHeader;