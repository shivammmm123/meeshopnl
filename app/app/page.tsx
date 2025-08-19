'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles } from 'lucide-react';
import UploadPage from '@/components/UploadPage';
import SkuPricing from '@/components/SkuPricing';
import PaymentsDashboard from '@/components/PaymentsDashboard';
import OrdersDashboard from '@/components/OrdersDashboard';
import ReturnsDashboard from '@/components/ReturnsDashboard';
import Settings from '@/components/Settings';
import { Sidebar } from '@/components/Sidebar';
import Alerts from '@/components/Alerts';
import DashboardFilters from '@/components/DashboardFilters';
import { FilesData, SkuPrices, FilterState, FilterContextData, AllDashboardsData, UploadableFile, WorkerPayload } from '@/types';
import RedesignedDashboard from '@/components/RedesignedDashboard';
import ProgressBarModal from '@/components/ProgressBarModal';
import ErrorDisplay from '@/components/ErrorDisplay';
import AiInsightModal from '@/components/AiInsightModal';
import * as db from '@/utils/database';
import Footer from '@/components/Footer';
import { logError } from '@/utils/supabase';
import { GoogleGenAI } from '@google/genai';


type AppState = 'upload' | 'pricing' | 'dashboard' | 'redesignedDashboard';
type View = 'payments' | 'orders' | 'returns' | 'settings';

const initialFilters: FilterState = {
  dateRange: { start: '', end: '' },
  orderStatuses: [],
  selectedSkus: [],
  selectedStates: [],
  selectedReasons: [],
  keyword: '',
  calculateTrend: false,
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [appState, setAppState] = useState<AppState>('upload');
  const [activeView, setActiveView] = useState<View>('payments');
  
  const [filesData, setFilesData] = useState<FilesData>({});
  const [skuPrices, setSkuPrices] = useState<SkuPrices | null>(null);
  
  const [filterContext, setFilterContext] = useState<FilterContextData | null>(null);
  const [allDashboardData, setAllDashboardData] = useState<AllDashboardsData>({
      payments: null,
      orders: null,
      returns: null,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [progressMessage, setProgressMessage] = useState('');
  const [language, setLanguage] = useState('en');
  const [error, setError] = useState<string | null>(null);

  // AI State
  const [aiInsight, setAiInsight] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  
  const isUploading = useRef(false);
  const filterWorker = useRef<Worker | null>(null);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  
  const handleGoHome = useCallback(() => router.push('/'), [router]);
  const handleShowRedesigned = () => setAppState('redesignedDashboard');

  useEffect(() => {
    // Initialize the filter worker from its own TypeScript module.
    const worker = new Worker(new URL('../../utils/filter.worker.ts', import.meta.url));
    filterWorker.current = worker;

    worker.onmessage = (e) => {
        const { type, payload, message } = e.data;
        if (type === 'done') {
            setAllDashboardData(payload.allDashboardData);
            if (payload.filterContext) {
                setFilterContext(payload.filterContext);
            }
            setIsProcessing(false);
        } else if (type === 'error') {
            const errorMessage = `An error occurred during data filtering: ${message}`;
            setError(errorMessage);
            logError(new Error(message), { context: 'FilterWorker' });
            setIsProcessing(false);
        }
    };

    return () => {
        worker.terminate();
    };
  }, []);

  useEffect(() => {
    const loadDataFromDB = async () => {
      try {
        const [savedFiles, savedPrices, viewMode] = await Promise.all([
          db.get<FilesData>('filesData'),
          db.get<SkuPrices>('skuPrices'),
          db.get<string>('viewMode')
        ]);

        const loadedFilesData = savedFiles || {};
        const hasFiles = Object.values(loadedFilesData).some(d => Array.isArray(d) ? d.length > 0 : !!d);

        if (hasFiles) {
          isUploading.current = true;
          setSkuPrices(savedPrices || null);
          setFilesData(loadedFilesData);
          
          setIsProcessing(true);
          filterWorker.current?.postMessage({
              filesData: loadedFilesData,
              filters: initialFilters,
              skuPrices: savedPrices || null,
              recalculateContext: true,
          });
          
          if (viewMode === 'redesigned') {
            setAppState('redesignedDashboard');
          } else {
             setAppState(loadedFilesData.payments && !savedPrices ? 'pricing' : 'dashboard');
          }
          setTimeout(() => { isUploading.current = false; }, 0);
        } else {
          setAppState('upload');
        }
      } catch (e: any) {
        console.error("Failed to load data from IndexedDB", e);
        const errorMessage = "Could not load saved data. Your browser might not support the required features or is in private mode.";
        setError(errorMessage);
        logError(e, { context: 'loadDataFromDB', message: errorMessage });
        setAppState('upload');
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadDataFromDB();
  }, []);

  useEffect(() => {
    if (isInitialLoading) return;
    const isDataEmpty = !Object.values(filesData).some(d => d && (!Array.isArray(d) || d.length > 0));
    if (isDataEmpty) db.del('filesData').catch(console.error);
    else db.set('filesData', filesData).catch(e => {
        console.error("Failed to save filesData to DB", e);
        setError("Could not save your data for future sessions.");
    });
  }, [filesData, isInitialLoading]);

  useEffect(() => {
    if (isInitialLoading) return;
    if (skuPrices) db.set('skuPrices', skuPrices).catch(e => {
        console.error("Failed to save skuPrices to DB", e);
        setError("Could not save SKU prices for future sessions.");
    });
    else db.del('skuPrices').catch(console.error);
  }, [skuPrices, isInitialLoading]);
  
  useEffect(() => {
    if (isUploading.current || !filterContext || Object.keys(filesData).length === 0 || !filterWorker.current) return;
    setIsProcessing(true);

    filterWorker.current.postMessage({
        filesData,
        filterContext,
        filters,
        skuPrices,
        recalculateContext: false,
    });
  }, [filters, skuPrices]);

  const handleResetData = async () => {
    if (window.confirm("Are you sure? This will permanently delete all data from this browser.")) {
      try {
        await db.clear();
        window.location.reload();
      } catch (e: any) {
        setError("Could not reset data. Please try clearing your browser cache.");
        logError(e, { context: 'handleResetData' });
      }
    }
  };

  const handleUploadStart = () => { isUploading.current = true; setIsProcessing(true); };

  const handleProcessingComplete = (fileType: UploadableFile, payload: WorkerPayload) => {
    setFilesData(payload.newFilesData);
    setAllDashboardData(payload.allDashboardData);
    setFilterContext(payload.filterContext);
    setFilters(initialFilters);
    const needsPricing = fileType === 'payments' && (!skuPrices || Object.keys(skuPrices.skuCosts || {}).length === 0);
    setAppState(needsPricing ? 'pricing' : 'dashboard');
    setActiveView(fileType as View);
    setIsProcessing(false);
    setProgress(null);
    setProgressMessage('');
    setTimeout(() => { isUploading.current = false; }, 0);
  };

  const handlePricingComplete = (prices: SkuPrices) => {
    setSkuPrices(prices);
    setAppState('dashboard');
    setActiveView('payments');
  };
  
  const handleRedesignedDashboardBack = () => {
    if (Object.keys(filesData).length > 0) {
        db.set('viewMode', 'classic').catch(console.error);
        setAppState('dashboard');
    } else {
        handleGoHome();
    }
  };

  const handleGetAiInsights = async () => {
    if (!allDashboardData.payments || !allDashboardData.payments.hasData) {
        setError("Cannot generate insights without payments data.");
        return;
    }
    setIsAiModalOpen(true);
    setIsAiLoading(true);
    setAiInsight('');

    try {
        if (!process.env.NEXT_PUBLIC_API_KEY) {
            throw new Error("API key is not configured in the application environment.");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_API_KEY });
        
        const data = allDashboardData.payments;
        const formatSkuList = (list: {sku: string; value: number}[], limit = 5) => 
            list.slice(0, limit).map(item => `- ${item.sku}: ${item.value.toFixed(2)}`).join('\n') || 'N/A';
        const formatSkuCountList = (list: {name: string; value: number}[], limit = 5) =>
            list.slice(0, limit).map(item => `- ${item.name} (${item.value} returns)`).join('\n') || 'N/A';
        
        const totalReturns = Number(data.orderOverview.find(o => o.title === 'Returns')?.value || 0);
        const totalRTOs = Number(data.orderOverview.find(o => o.title === 'RTO')?.value || 0);

        const prompt = `
You are an expert e-commerce business analyst for sellers on platforms like Meesho in India.
Analyze the following key metrics from a seller's dashboard for a selected period and provide 3-5 actionable, concise, and clear insights in markdown format to help them improve profitability. Address the seller directly.

**Key Metrics:**
*   **Net Profit:** ${data.unitEconomics.netProfit}
*   **Total Settlement Amount:** ${data.unitEconomics.settlementAmt}
*   **Total Return Cost:** ${data.unitEconomics.returnCost}
*   **Total Delivered Orders:** ${data.orderOverview.find(o => o.title === 'Delivered')?.value || 'N/A'}
*   **Total Returns & RTOs:** ${totalReturns + totalRTOs}

**Product Performance:**
*   **Top 5 Most Profitable SKUs:**\n${formatSkuList(data.skuProfitData)}
*   **Top 5 Loss-Making SKUs:**\n${formatSkuList(data.skuLossData)}
*   **Top 5 Most Returned SKUs (by count):**\n${formatSkuCountList(data.topReturnedSkus)}

Based on this data, what are your key takeaways and recommended actions? Structure your response with headings for clarity.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        setAiInsight(response.text);

    } catch (e: any) {
        console.error("AI Insight Error:", e);
        const userFriendlyError = `
### Could Not Connect to AI Service

**Important: This is the only feature that requires an internet connection. The rest of your dashboard is 100% offline and private.**

The connection to the AI service failed. This is usually due to one of the following reasons:
- **Network Restrictions:** Your current network (like a corporate or university firewall) may be blocking access to Google AI services.
- **Missing API Key:** The application requires an API key to be configured in its environment to use this feature.
- **Temporary Service Outage:** The AI service might be temporarily unavailable.

You can continue to use all other features of the dashboard without any issues.

**Technical Details:** \`${e.message}\`
`;
        setAiInsight(userFriendlyError);
        logError(e, { context: 'handleGetAiInsights' });
    } finally {
        setIsAiLoading(false);
    }
  };

  const renderDashboardContent = () => {
    if (isProcessing && !progress) {
      return (
        <div className="flex items-center justify-center h-full">
            <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto" />
                <p className="text-lg mt-4 text-gray-600">Calculating...</p>
            </div>
        </div>
      );
    }
    switch (activeView) {
      case 'payments': return <PaymentsDashboard data={allDashboardData.payments} />;
      case 'orders': return <OrdersDashboard data={allDashboardData.orders} />;
      case 'returns': return <ReturnsDashboard data={allDashboardData.returns} />;
      case 'settings': return <Settings language={language} setLanguage={setLanguage} onResetData={handleResetData} />;
      default: return <PaymentsDashboard data={allDashboardData.payments} />;
    }
  };

  const renderContent = () => {
    switch (appState) {
      case 'upload':
        return <UploadPage onUploadStart={handleUploadStart} onProcessingComplete={handleProcessingComplete} filesData={filesData} skuPrices={skuPrices} isProcessing={isProcessing} setProgress={setProgress} setProgressMessage={setProgressMessage} setError={setError} onGoHome={handleGoHome} />;
      case 'pricing':
        const skus = Array.from(new Set(filesData.payments?.map(p => p.sku).filter(Boolean) as string[]));
        return <SkuPricing skus={skus} onPricingComplete={handlePricingComplete} isProcessing={isProcessing} onGoHome={handleGoHome} onUploadNewFile={() => setAppState('upload')} />;
      case 'redesignedDashboard':
        return <RedesignedDashboard onGoBack={handleRedesignedDashboardBack} allDashboardData={allDashboardData} filterContext={filterContext} filters={filters} onFilterChange={setFilters} isProcessing={isProcessing} filesData={filesData} skuPrices={skuPrices} onUploadNewFile={() => setAppState('upload')} />;
      case 'dashboard':
        return (
          <div className="flex h-screen bg-gray-50 text-gray-800">
            <Sidebar activeView={activeView} setActiveView={setActiveView} onProcessingComplete={handleProcessingComplete} onUploadStart={handleUploadStart} filesData={filesData} skuPrices={skuPrices} setProgress={setProgress} setProgressMessage={setProgressMessage} setError={setError} uploadedFiles={Object.keys(filesData).filter(key => key !== 'adsCost' && Array.isArray(filesData[key as keyof FilesData]) && (filesData[key as keyof FilesData] as any[]).length > 0) as UploadableFile[]} onGoHome={handleGoHome} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex-shrink-0 py-4 px-6 md:px-8 bg-white/80 backdrop-blur-md z-10 shadow-sm border-b border-gray-200 flex justify-between items-center">
                  <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
                   <button onClick={handleShowRedesigned} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-all">Try New Dashboard</button>
                </header>
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                  {filterContext && (
                    <div className="space-y-6 mb-6">
                       <Alerts paymentsData={allDashboardData.payments} ordersData={allDashboardData.orders} returnsData={allDashboardData.returns} activeView={activeView} />
                       <DashboardFilters filterContext={filterContext} filters={filters} onFilterChange={setFilters} onUploadNewFile={() => setAppState('upload')} />
                    </div>
                  )}
                  {activeView === 'payments' && allDashboardData.payments?.hasData && (
                    <div className="flex justify-end mb-4">
                        <button 
                            onClick={handleGetAiInsights}
                            disabled={isAiLoading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                            title="Get AI-powered analysis of your current data view"
                        >
                            {isAiLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                            {isAiLoading ? 'Analyzing...' : 'Get AI Insights'}
                        </button>
                    </div>
                   )}
                  {renderDashboardContent()}
                </main>
                <Footer />
            </div>
          </div>
        );
    }
  };
  
  if (isInitialLoading) {
    return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-700">
            <Loader2 className="w-12 h-12 animate-spin text-green-500" />
            <p className="mt-4 text-lg font-semibold">Loading App...</p>
        </div>
    );
  }

  return (
    <div className="font-sans min-h-screen bg-gray-50">
      {error && <ErrorDisplay message={error} onClose={() => setError(null)} />}
      {progress !== null && <ProgressBarModal progress={progress} message={progressMessage} />}
      {isAiModalOpen && <AiInsightModal insight={aiInsight} isLoading={isAiLoading} onClose={() => setIsAiModalOpen(false)} />}
      {renderContent()}
    </div>
  );
}