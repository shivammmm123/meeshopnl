
import React from 'react';
import { Languages, Trash2 } from 'lucide-react';

interface SettingsProps {
  language: string;
  setLanguage: (language: string) => void;
  onResetData: () => void;
}

const Settings: React.FC<SettingsProps> = ({ language, setLanguage, onResetData }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
          <h1 className="text-4xl font-bold text-gray-800">Settings</h1>
          <p className="text-md text-gray-500 mt-1">Manage your application preferences and data.</p>
      </header>

      <div className="space-y-6">
        {/* -- Language Section -- */}
        <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
           <h2 className="text-xl font-semibold text-gray-800 mb-4">Language</h2>
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <Languages className="text-sky-500" />
                  <label htmlFor="language-select" className="text-gray-700 font-medium">
                    Display Language
                  </label>
              </div>
              <div className="relative">
                 <select
                    id="language-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="appearance-none w-48 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2.5"
                 >
                    <option value="en">English</option>
                    <option value="hi" disabled>हिन्दी (Hindi)</option>
                    <option value="es" disabled>Español (Spanish)</option>
                 </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                 </div>
              </div>
           </div>
           <p className="text-xs text-gray-500 mt-3">Note: Language feature is for demonstration. Full app translation is not yet implemented.</p>
        </div>
        
        {/* -- Danger Zone -- */}
        <div className="p-6 bg-red-50 rounded-2xl shadow-lg border-2 border-red-200">
           <h2 className="text-xl font-semibold text-red-800 mb-2">Danger Zone</h2>
           <p className="text-sm text-gray-600 mb-4">
               This action is irreversible. It will permanently delete all your uploaded data and settings from this browser.
           </p>
           <button
              onClick={onResetData}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <Trash2 size={16}/>
              Reset All Data
            </button>
        </div>

      </div>
    </div>
  );
};

export default Settings;
