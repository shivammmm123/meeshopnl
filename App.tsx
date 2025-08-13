
import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import LandingPage from './components/LandingPage';
import { UploadPage } from './components/UploadPage';
import SkuPricing from './components/SkuPricing';
import PaymentsDashboard from './components/PaymentsDashboard';
import OrdersDashboard from './components/OrdersDashboard';
import ReturnsDashboard from './components/ReturnsDashboard';
import Settings from './components/Settings';
import { Sidebar } from './components/Sidebar';
import Alerts from './components/Alerts';
import DashboardFilters from './components/DashboardFilters';
import { getFilteredRawData, calculateFilterContext, calculatePaymentsDashboard, calculateOrdersDashboard, calculateReturnsDashboard, runFullAnalysis } from './utils/dataProcessor';
import { FilesData, SkuPrices, FilterState, FilterContextData, AllDashboardsData } from './types';
import RedesignedDashboard from './components/RedesignedDashboard';
import ProgressBarModal from './components/ProgressBarModal';
import ErrorDisplay from './components/ErrorDisplay';
import * as db from './utils/database';
import Footer from './components/Footer';

type AppState = 'landing' | 'upload' | 'pricing' | 'dashboard' | 'redesignedDashboard';
type View = 'payments' | 'orders' | 'returns' | 'settings';
export type UploadableFile = 'payments' | 'orders' | 'returns';

export interface WorkerPayload {
    allDashboardData: AllDashboardsData,
    filterContext: FilterContextData,
    newFilesData: FilesData,
}

const App: React.FC = () => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [appState, setAppState] = useState<AppState>('landing');
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

  const isUploading = useRef(false);

  const initialFilters: FilterState = {
    dateRange: { start: '', end: '' },
    orderStatuses: [],
    selectedSkus: [],
    selectedStates: [],
    selectedReasons: [],
    calculateTrend: false,
  };
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  // --- INITIAL DATA LOAD ---
  useEffect(() => {
    const loadDataFromDB = async () => {
        try {
            const [savedFiles, savedPrices] = await Promise.all([
                db.get<FilesData>('filesData'),
                db.get<SkuPrices>('skuPrices'),
            ]);

            const loadedFilesData = savedFiles || {};
            const hasFiles = Object.keys(loadedFilesData).length > 0 && Object.values(loadedFilesData).some(d => Array.isArray(d) ? (d as any[]).length > 0 : !!d);

            if (hasFiles) {
                setSkuPrices(savedPrices || null);
                setFilesData(loadedFilesData);
                
                if (loadedFilesData.payments && !savedPrices) {
                    setAppState('pricing');
                } else {
                    isUploading.current = true;
                    const ctx = calculateFilterContext(loadedFilesData);
                    const prices = savedPrices || { skuCosts: {}, packagingCost: 0, marketingCost: 0 };
                    const { allDashboardData: newDashboardData } = runFullAnalysis(loadedFilesData, prices);

                    setFilterContext(ctx);
                    setAllDashboardData(newDashboardData);
                    setAppState('dashboard');
                }
            } else {
                setAppState('landing'); // Fresh start
            }
        } catch (e) {
            console.error("Failed to load data from IndexedDB", e);
            setError("Could not load saved data. Your browser might not support the required features or is in private mode.");
        } finally {
            setIsInitialLoading(false);
        }
    };
    loadDataFromDB();
  }, []);

  // Reset the uploading flag after a render cycle completes.
  useEffect(() => {
    if (isUploading.current) {
      isUploading.current = false;
    }
  });

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => {
    if (isInitialLoading) return;

    const isDataEmpty = !filesData.payments?.length && !filesData.orders?.length && !filesData.returns?.length && !filesData.adsCost;
    if (isDataEmpty) {
        db.del('filesData').catch(e => console.error("Failed to delete filesData from DB", e));
        return;
    }

    db.set('filesData', filesData).catch(e => {
        console.error("Failed to save filesData to DB", e);
        setError("Could not save your data for future sessions due to a database error.");
    });
  }, [filesData, isInitialLoading]);

  useEffect(() => {
    if (isInitialLoading) return;

    if (skuPrices) {
      db.set('skuPrices', skuPrices).catch(e => {
          console.error("Failed to save skuPrices to DB", e);
          setError("Could not save your SKU prices for future sessions due to a database error.");
      });
    } else {
      db.del('skuPrices').catch(e => console.error("Failed to delete skuPrices from DB", e));
    }
  }, [skuPrices, isInitialLoading]);
  
  // --- DATA PROCESSING on FILTER CHANGE ---
  useEffect(() => {
    if (isUploading.current || !filterContext || Object.keys(filesData).length === 0) {
      return;
    }

    setIsProcessing(true);
    
    const reCalculateDashboards = () => {
        const { filteredPayments, filteredOrders, filteredReturns } = getFilteredRawData(filesData, filterContext, filters);
        const prices = skuPrices || { skuCosts: {}, packagingCost: 0, marketingCost: 0 };
        
        const newPaymentsData = calculatePaymentsDashboard(filteredPayments, prices, filesData.adsCost || 0, filesData);
        const newOrdersData = calculateOrdersDashboard(filteredOrders);
        const newReturnsData = calculateReturnsDashboard(filteredReturns);
        
        setAllDashboardData({
            payments: newPaymentsData,
            orders: newOrdersData,
            returns: newReturnsData
        });
        setIsProcessing(false);
    }
    
    // Use a timeout to allow the UI to update before starting the calculation
    const timer = setTimeout(() => reCalculateDashboards(), 50);

    return () => clearTimeout(timer);

  }, [filters, filterContext, filesData, skuPrices]);

  const handleStart = () => setAppState('upload');
  const handleShowRedesigned = () => setAppState('redesignedDashboard');
  const handleGoHome = () => setAppState('landing');

  const handleResetData = async () => {
    if (window.confirm("Are you sure you want to reset all data? This action is permanent and cannot be undone.")) {
      try {
        await db.clear();
        // Forcing a reload is the most robust way to ensure a clean state.
        window.location.reload();
      } catch (e) {
        console.error("Failed to clear data on reset", e);
        setError("Could not reset data due to a database error. Please try clearing your browser cache.");
      }
    }
  };

  const handleUploadStart = () => {
    isUploading.current = true;
    setIsProcessing(true);
  };

  const handleProcessingComplete = (fileType: UploadableFile, payload: WorkerPayload) => {
    // 1. Update data states
    setFilesData(payload.newFilesData);
    setAllDashboardData(payload.allDashboardData);
    setFilterContext(payload.filterContext);
    setFilters(initialFilters);

    // 2. Determine next application state
    const determineNextState = (): AppState => {
        const needsPricing = fileType === 'payments' && (!skuPrices || Object.keys(skuPrices.skuCosts || {}).length === 0);
        if (needsPricing) {
            return 'pricing';
        }
        return 'dashboard';
    };
    const nextState = determineNextState();

    // 3. Set new view and application state
    setAppState(nextState);
    setActiveView(fileType as View);

    // 4. Clean up all processing-related states
    setIsProcessing(false);
    setProgress(null);
    setProgressMessage('');
  };

  const handlePricingComplete = (prices: SkuPrices) => {
    isUploading.current = true; // Prevent re-calculation after pricing
    setSkuPrices(prices);
    setAppState('dashboard');
    setActiveView('payments');
  };

  const renderDashboardContent = () => {
    const isDashboardProcessing = isProcessing && !isUploading.current;
    if (isDashboardProcessing) {
      return <div className="flex items-center justify-center h-full"><p className="text-lg animate-pulse">Applying filters...</p></div>;
    }

    switch (activeView) {
      case 'payments':
        return <PaymentsDashboard data={allDashboardData.payments} />;
      case 'orders':
        return <OrdersDashboard data={allDashboardData.orders} />;
      case 'returns':
        return <ReturnsDashboard data={allDashboardData.returns} />;
      case 'settings':
        return <Settings language={language} setLanguage={setLanguage} onResetData={handleResetData} />;
      default:
        return <PaymentsDashboard data={allDashboardData.payments} />;
    }
  };

  const renderContent = () => {
    switch (appState) {
      case 'landing':
        return <LandingPage onStart={handleStart} onShowRedesigned={handleShowRedesigned} />;
      case 'upload':
        return (
            <UploadPage 
                onUploadStart={handleUploadStart}
                onProcessingComplete={handleProcessingComplete}
                filesData={filesData}
                skuPrices={skuPrices}
                isProcessing={isProcessing} 
                setProgress={setProgress}
                setProgressMessage={setProgressMessage} 
                setError={setError}
                onGoHome={handleGoHome}
            />
        );
      case 'pricing':
        const skus = Array.from(new Set(filesData.payments?.map(p => p.sku).filter(Boolean) as string[]));
        return <SkuPricing 
                    skus={skus} 
                    onPricingComplete={handlePricingComplete} 
                    isProcessing={isProcessing}
                    onGoHome={handleGoHome}
                    onUploadNewFile={handleStart} 
                />;
      case 'redesignedDashboard':
        return (
          <RedesignedDashboard
            onGoBack={() => setAppState(Object.keys(filesData).length > 0 ? 'dashboard' : 'landing')}
            allDashboardData={allDashboardData}
            filterContext={filterContext}
            filters={filters}
            onFilterChange={setFilters}
            isProcessing={isProcessing}
            filesData={filesData}
            skuPrices={skuPrices}
            onUploadNewFile={handleStart}
          />
        );
      case 'dashboard':
        return (
          <div className="flex h-screen bg-gray-50 text-gray-800">
            <Sidebar 
              activeView={activeView} 
              setActiveView={setActiveView} 
              onProcessingComplete={handleProcessingComplete}
              onUploadStart={handleUploadStart}
              filesData={filesData}
              skuPrices={skuPrices}
              setProgress={setProgress}
              setProgressMessage={setProgressMessage}
              setError={setError}
              uploadedFiles={Object.keys(filesData).filter(key => key !== 'adsCost' && Array.isArray(filesData[key as keyof FilesData]) && (filesData[key as keyof FilesData] as any[]).length > 0) as UploadableFile[]}
              onGoHome={handleGoHome}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex-shrink-0 py-4 px-6 md:px-8 bg-white/80 backdrop-blur-md z-10 shadow-sm border-b border-gray-200">
                  <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
                </header>
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                  {filterContext && (
                    <div className="space-y-6 mb-6">
                       <Alerts 
                            paymentsData={allDashboardData.payments}
                            ordersData={allDashboardData.orders}
                            returnsData={allDashboardData.returns}
                            activeView={activeView}
                       />
                       <DashboardFilters 
                        filterContext={filterContext}
                        filters={filters}
                        onFilterChange={setFilters}
                        onUploadNewFile={handleStart}
                      />
                    </div>
                  )}
                  {renderDashboardContent()}
                </main>
                <Footer />
            </div>
          </div>
        );
      default:
        return <LandingPage onStart={handleStart} onShowRedesigned={handleShowRedesigned} />;
    }
  };
  
  if (isInitialLoading) {
    return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-700">
            <Loader2 className="w-12 h-12 animate-spin text-green-500" />
            <p className="mt-4 text-lg font-semibold">Loading your data...</p>
            <p className="text-sm">Please wait a moment.</p>
        </div>
    );
  }

  return (
    <div className="font-sans min-h-screen bg-gray-50">
      {error && <ErrorDisplay message={error} onClose={() => setError(null)} />}
      {progress !== null && <ProgressBarModal progress={progress} message={progressMessage} />}
      {renderContent()}
    </div>
  );
};

export default App;
