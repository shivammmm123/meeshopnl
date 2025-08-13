import React, { useState, useEffect } from 'react';
import { SkipForward, Upload } from 'lucide-react';
import { SkuPrices } from '../types';
import SkipConfirmModal from './SkipConfirmModal';
import AppHeader from './AppHeader';
import Footer from './Footer';

interface SkuPricingProps {
  skus: string[];
  onPricingComplete: (prices: SkuPrices) => void;
  isProcessing: boolean;
  onGoHome: () => void;
  onUploadNewFile: () => void;
}

const SkuPricing: React.FC<SkuPricingProps> = ({ skus, onPricingComplete, isProcessing, onGoHome, onUploadNewFile }) => {
  const [costs, setCosts] = useState<{ [key: string]: string }>({});
  const [packagingCost, setPackagingCost] = useState('10'); // Default value
  const [isModalOpen, setIsModalOpen] = useState(false);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
      inputRefs.current = inputRefs.current.slice(0, skus.length);
  }, [skus]);

  const handleCostChange = (sku: string, value: string) => {
    setCosts(prev => ({ ...prev, [sku]: value }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
        e.preventDefault(); 
        const nextIndex = index + 1;
        if (nextIndex < skus.length) {
            inputRefs.current[nextIndex]?.focus();
        } else {
            document.getElementById('generate-dashboard-button')?.focus();
        }
    }
  };

  const processAndSubmit = () => {
    const numericSkuCosts = Object.entries(costs).reduce((acc, [sku, cost]) => {
        acc[sku] = parseFloat(cost) || 0;
        return acc;
    }, {} as {[key: string]: number});

    skus.forEach(sku => {
        if (!numericSkuCosts.hasOwnProperty(sku)) {
            numericSkuCosts[sku] = 0;
        }
    });

    onPricingComplete({
        skuCosts: numericSkuCosts,
        packagingCost: parseFloat(packagingCost) || 0,
        marketingCost: 0, // Marketing cost is now handled from Ads Sheet in payments file
    });
  };

  const handleSubmit = () => {
    processAndSubmit();
  };

  const handleAttemptSkip = () => {
    setIsModalOpen(true);
  };
  
  const handleConfirmSkip = () => {
    setIsModalOpen(false);
    // Set all costs to 0 and proceed
    setCosts({}); 
    processAndSubmit();
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <AppHeader onBack={onGoHome} />
        <main className="flex-grow w-full flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-3xl w-full">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Enter Product Costs (Optional)</h1>
              <p className="text-gray-500 mb-6">We found {skus.length} unique SKUs. Enter the cost for each to calculate profitability. This is crucial for accurate analysis.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                      <label htmlFor="packaging-cost" className="block text-sm font-medium text-gray-700 mb-1">Default Packaging Cost (per order)</label>
                      <input
                          id="packaging-cost"
                          type="number"
                          value={packagingCost}
                          onChange={(e) => setPackagingCost(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                          placeholder="e.g., 10"
                          disabled={isProcessing}
                      />
                  </div>
              </div>

              <div className="max-h-80 overflow-y-auto pr-2 space-y-4">
                  {skus.map((sku, index) => (
                      <div key={sku} className="grid grid-cols-2 gap-4 items-center">
                          <label htmlFor={`cost-${sku}`} className="font-medium text-gray-700 truncate">{sku}</label>
                          <input
                              id={`cost-${sku}`}
                              type="number"
                              ref={el => { inputRefs.current[index] = el; }}
                              onChange={(e) => handleCostChange(sku, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, index)}
                              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                              placeholder="Enter cost price"
                              disabled={isProcessing}
                          />
                      </div>
                  ))}
              </div>
              
              <div className="mt-8 text-center flex items-center justify-center flex-wrap gap-4">
                  <button
                      onClick={onUploadNewFile}
                      disabled={isProcessing}
                      className="text-blue-600 font-medium py-3 px-8 rounded-lg hover:bg-blue-50 transition-all flex items-center gap-2"
                  >
                     <Upload size={16}/>
                     Upload Different File
                  </button>
                  <button 
                      onClick={handleAttemptSkip}
                      disabled={isProcessing}
                      className="text-gray-600 font-medium py-3 px-8 rounded-lg hover:bg-gray-100 transition-all flex items-center gap-2"
                  >
                      <SkipForward size={16}/>
                      Skip for now
                  </button>
                  <button
                      id="generate-dashboard-button"
                      onClick={handleSubmit}
                      disabled={isProcessing}
                      className="bg-green-600 text-white font-bold py-3 px-12 rounded-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-xl disabled:bg-gray-400"
                  >
                      {isProcessing ? 'Generating...' : 'Generate Dashboard'}
                  </button>
              </div>
          </div>
        </main>
        <Footer />
      </div>
      {isModalOpen && <SkipConfirmModal onConfirm={handleConfirmSkip} onCancel={() => setIsModalOpen(false)} />}
    </>
  );
};

export default SkuPricing;