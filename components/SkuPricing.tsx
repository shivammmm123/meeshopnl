import React, { useState, useEffect, useMemo } from 'react';
import { SkipForward, Upload, DollarSign, Box, ChevronsRight } from 'lucide-react';
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
  const [packagingCosts, setPackagingCosts] = useState<{ [key: string]: string }>({});
  const [bulkPackagingCost, setBulkPackagingCost] = useState('10'); // Default
  const [externalAdCost, setExternalAdCost] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
      inputRefs.current = inputRefs.current.slice(0, skus.length);
      // Pre-fill packaging costs with default value on initial load
      handleBulkPackagingChange(bulkPackagingCost, true);
  }, [skus]);

  const handleCostChange = (sku: string, value: string) => setCosts(prev => ({ ...prev, [sku]: value }));
  const handlePackagingCostChange = (sku: string, value: string) => setPackagingCosts(prev => ({ ...prev, [sku]: value }));

  const handleBulkPackagingChange = (value: string, initialLoad = false) => {
      setBulkPackagingCost(value);
      const newPackagingCosts = skus.reduce((acc, sku) => {
          // On bulk change, only update if the field is empty or it's the initial load
          // This prevents overwriting manually entered values.
          if (initialLoad || !packagingCosts[sku]) {
              acc[sku] = value;
          } else {
              acc[sku] = packagingCosts[sku];
          }
          return acc;
      }, {} as { [key: string]: string });
      setPackagingCosts(newPackagingCosts);
  };
  
  const applyBulkCostToAll = () => {
       const newPackagingCosts = skus.reduce((acc, sku) => {
          acc[sku] = bulkPackagingCost;
          return acc;
      }, {} as { [key: string]: string });
      setPackagingCosts(newPackagingCosts);
  }

  const handleKeyDown = (e: React.KeyboardEvent, index: number, field: 'cost' | 'packaging') => {
      if (e.key === 'Enter') {
          e.preventDefault();
          const nextIndex = field === 'packaging' ? index + 1 : index;
          const nextField = field === 'cost' ? 'packaging' : 'cost';
          
          if (nextIndex < skus.length) {
              const nextInputId = `#${nextField}-${skus[nextIndex]}`;
              document.querySelector<HTMLInputElement>(nextInputId)?.focus();
          } else {
              document.getElementById('generate-dashboard-button')?.focus();
          }
      }
  };

  const processAndSubmit = () => {
      const numericSkuCosts = skus.reduce((acc, sku) => {
          acc[sku] = parseFloat(costs[sku]) || 0;
          return acc;
      }, {} as {[key: string]: number});
  
      const numericPackagingCosts = skus.reduce((acc, sku) => {
          acc[sku] = parseFloat(packagingCosts[sku] || '0') || 0;
          return acc;
      }, {} as {[key: string]: number});
  
      onPricingComplete({
          skuCosts: numericSkuCosts,
          skuPackagingCosts: numericPackagingCosts,
          externalMarketingCost: parseFloat(externalAdCost) || 0,
      });
  };

  const handleSubmit = () => processAndSubmit();
  const handleAttemptSkip = () => setIsModalOpen(true);
  const handleConfirmSkip = () => {
      setIsModalOpen(false);
      setCosts({});
      setPackagingCosts({});
      processAndSubmit();
  };

  const totalCosts = useMemo(() => {
      return skus.reduce((acc, sku) => {
          const productCost = parseFloat(costs[sku]) || 0;
          const packCost = parseFloat(packagingCosts[sku]) || 0;
          acc[sku] = productCost + packCost;
          return acc;
      }, {} as { [key: string]: number });
  }, [costs, packagingCosts, skus]);

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <AppHeader onBack={onGoHome} />
        <main className="flex-grow w-full flex items-center justify-center p-4">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl max-w-5xl w-full">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Enter Product Costs (Optional)</h1>
              <p className="text-gray-500 mb-6">We found {skus.length} unique SKUs. Enter the cost for each to calculate profitability. This is crucial for accurate analysis.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-4 bg-gray-50/70 rounded-lg border">
                  <div>
                      <label htmlFor="bulk-packaging-cost" className="block text-sm font-medium text-gray-700 mb-1">Default Packaging Cost</label>
                      <div className="flex items-center gap-2">
                        <input
                            id="bulk-packaging-cost" type="number" value={bulkPackagingCost}
                            onChange={(e) => handleBulkPackagingChange(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                            placeholder="e.g., 10" disabled={isProcessing}
                        />
                        <button onClick={applyBulkCostToAll} className="p-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-md" title="Apply to all SKUs below">
                            <ChevronsRight size={20}/>
                        </button>
                      </div>
                  </div>
                   <div>
                      <label htmlFor="external-ad-cost" className="block text-sm font-medium text-gray-700 mb-1">Additional Marketing Cost</label>
                      <input
                          id="external-ad-cost" type="number" value={externalAdCost}
                          onChange={(e) => setExternalAdCost(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                          placeholder="e.g., Facebook Ads cost" disabled={isProcessing}
                      />
                  </div>
              </div>

              <div className="overflow-x-auto max-h-[40vh] border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Cost</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Packaging Cost</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {skus.map((sku, index) => (
                      <tr key={sku} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={sku}>{sku}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input id={`cost-${sku}`} type="number"
                              onChange={(e) => handleCostChange(sku, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, index, 'cost')}
                              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                              placeholder="0.00" disabled={isProcessing} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <input id={`packaging-${sku}`} type="number" value={packagingCosts[sku] || ''}
                              onChange={(e) => handlePackagingCostChange(sku, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, index, 'packaging')}
                              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                              placeholder="0.00" disabled={isProcessing} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                          ₹{totalCosts[sku]?.toFixed(2) || '0.00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-8 text-center flex items-center justify-center flex-wrap gap-4">
                  <button onClick={onUploadNewFile} disabled={isProcessing} className="text-blue-600 font-medium py-3 px-8 rounded-lg hover:bg-blue-50 transition-all flex items-center gap-2">
                     <Upload size={16}/> Upload Different File
                  </button>
                  <button onClick={handleAttemptSkip} disabled={isProcessing} className="text-gray-600 font-medium py-3 px-8 rounded-lg hover:bg-gray-100 transition-all flex items-center gap-2">
                      <SkipForward size={16}/> Skip for now
                  </button>
                  <button id="generate-dashboard-button" onClick={handleSubmit} disabled={isProcessing} className="bg-green-600 text-white font-bold py-3 px-12 rounded-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-xl disabled:bg-gray-400">
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
