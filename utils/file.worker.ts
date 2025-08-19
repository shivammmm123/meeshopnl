// This is a standalone web worker file. It's referenced by `components/UploadPage.tsx`.
// It runs in a separate thread and handles heavy file processing.

// Since we are in a worker, we must manually import scripts.
// The `self` keyword refers to the worker's global scope.
importScripts('https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js');
declare var XLSX: any; // Declaring XLSX for TypeScript since it's loaded via importScripts

// --- Types needed for data processing ---
interface RawPaymentEntry {
  orderId: string;
  orderDate: any;
  sku: string;
  status: string;
  finalPayment: string | number;
  claimAmount: string | number;
  returnCost: string | number;
  invoicePrice?: string | number;
  gstRate?: string | number;
  recovery?: string | number;
  tds?: string | number;
  tcs?: string | number;
}

interface RawOrderEntry {
  status: string;
  orderId: string;
  state: string;
  sku: string;
  size: string;
}

interface RawReturnEntry {
  sku: string;
  size: string;
  category: string;
  orderId: string;
  returnType: string;
  returnReason: string;
  subReason: string;
}


// --- Inlined dataProcessor.ts content starts here ---
// All functions from dataProcessor.ts are included directly in this worker
// to make it self-contained and avoid module resolution issues in the worker environment.
const dataProcessor = (() => {

    const parseNumber = (value: any): number => {
      if (value === null || value === undefined || value === '') {
        return 0;
      }
    
      let s = String(value).trim();
    
      // Handle accounting-style negative numbers like (1,200.00)
      if (s.startsWith('(') && s.endsWith(')')) {
        s = '-' + s.substring(1, s.length - 1);
      }
      
      // Remove characters that are not digits, a decimal point, or a minus sign.
      const sanitized = s.replace(/[^0-9.-]/g, '');
    
      const number = parseFloat(sanitized);
      
      return isNaN(number) ? 0 : number;
    };
    
    const parseString = (value: any): string => {
      return String(value || '').trim();
    };
    
    const parseDate = (value: any): Date | null => {
        if (value === null || value === undefined) {
            return null;
        }
        if (value instanceof Date && !isNaN(value.getTime())) {
            return value;
        }
        if (typeof value === 'number' && value > 25569) { // 25569 is 1/1/1970
            const date = new Date((value - 25569) * 86400 * 1000);
            const utcDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
            if (!isNaN(utcDate.getTime())) {
                return utcDate;
            }
        }
        if (typeof value === 'string' || typeof value === 'number') {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        return null;
    };
    
    const formatCurrency = (value: number): string => {
        if (isNaN(value)) return '₹0';
        const sign = value < 0 ? '-' : '';
        value = Math.abs(value);
        if (value >= 10000000) return `${sign}₹${(value / 10000000).toFixed(2)}Cr`;
        if (value >= 100000) return `${sign}₹${(value / 100000).toFixed(2)}L`;
        return `${sign}₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    };
    
    const formatAmount = (value: number): string => {
        if (isNaN(value)) return '₹0.00';
        return `₹${value.toFixed(2)}`;
    }
    
    function runFullAnalysis(filesData: any, skuPrices: any) {
        const filterContext = calculateFilterContext(filesData);
        const initialFilters = { dateRange: { start: '', end: '' }, orderStatuses: [], selectedSkus: [], selectedStates: [], selectedReasons: [], keyword: '', calculateTrend: false };
        const { filteredPayments, filteredOrders, filteredReturns } = getFilteredRawData(filesData, filterContext, initialFilters);
        const prices = skuPrices || { skuCosts: {}, skuPackagingCosts: {}, externalMarketingCost: 0 };
        const adsCost = filesData.adsCost || 0;
    
        const paymentsDashboardData = calculatePaymentsDashboard(filteredPayments, prices, adsCost, filesData);
        const ordersDashboardData = calculateOrdersDashboard(filteredOrders);
        const returnsDashboardData = calculateReturnsDashboard(filteredReturns);
    
        const allDashboardData = {
            payments: paymentsDashboardData,
            orders: ordersDashboardData,
            returns: returnsDashboardData,
        };
        return { allDashboardData, filterContext };
    }
    
    
    function calculatePaymentsDashboard(paymentsData: any[], prices: any, adsCost: number, allFilesData: any) {
        const hasData = paymentsData && paymentsData.length > 0;
        if (!hasData) return { 
            hasData: false, 
            orderOverview: [], 
            earningsOverview: [], 
            unitEconomics: {
                settlementAmt: '₹0.00', productCost: '₹0.00', packagingCost: '₹0.00',
                marketingCost: '₹0.00', cogs: '₹0.00', grossProfit: '₹0.00',
                returnCost: '₹0.00', netProfit: '₹0.00', grossMargin: '0.00%',
                netMargin: '0.00%', netProfitPerUnit: '₹0.00', pricesEntered: false,
                invoicePrice: 'N/A', totalGst: 'N/A', netProfitWithoutGst: 'N/A', 
                netProfitPerUnitWithoutGst: 'N/A', claimAmount: '₹0.00', recovery: '₹0.00',
                tds: '₹0.00', tcs: '₹0.00',
            }, 
            dailyDeliveredVsReturns: [], 
            deliveredVsRtoPie: [], 
            deliveredVsReturnPie: [],
            topDeliveredSkus: [], 
            topReturnedSkus: [], 
            skuProfitData: [], 
            skuLossData: [], 
            keywordDistribution: [],
            netProfit: 0, 
            alerts: [], 
            smartAlerts: [], 
            allPayments: [], 
        };
        
        const { skuCosts, skuPackagingCosts, externalMarketingCost } = prices || { skuCosts: {}, skuPackagingCosts: {}, externalMarketingCost: 0 };
        const pricesEntered = !!prices && Object.keys(prices.skuCosts).length > 0 && Object.values(prices.skuCosts).some((p: any) => p > 0);
        
        const settlementAmt = paymentsData.reduce((sum, p) => sum + parseNumber(p.finalPayment), 0);
        const claimAmount = paymentsData.reduce((sum, p) => sum + parseNumber(p.claimAmount), 0);
        const totalRecovery = paymentsData.reduce((sum, p) => sum + parseNumber(p.recovery), 0);
        const totalTds = paymentsData.reduce((sum, p) => sum + parseNumber(p.tds), 0);
        const totalTcs = paymentsData.reduce((sum, p) => sum + parseNumber(p.tcs), 0);
        const totalReturnCost = paymentsData.reduce((sum, p) => sum + parseNumber(p.returnCost), 0);
        const totalInvoicePrice = paymentsData.reduce((sum, p) => sum + parseNumber(p.invoicePrice), 0);
        
        const totalGst = paymentsData.reduce((sum, p) => {
            const gstRatePercentage = parseNumber(p.gstRate) / 100;
            const gstAmount = parseNumber(p.finalPayment) * gstRatePercentage;
            return sum + gstAmount;
        }, 0);
        
        const deliveredPayments = paymentsData.filter(p => parseString(p.status).toLowerCase().includes('delivered'));
        const productCost = deliveredPayments.reduce((sum, p) => sum + (skuCosts[p.sku] || 0), 0);
        const totalPackagingCost = deliveredPayments.reduce((sum, p) => sum + (skuPackagingCosts[p.sku] || 0), 0);
    
        const totalMarketingCost = (adsCost || 0) + (externalMarketingCost || 0);
        const cogs = productCost + totalPackagingCost + totalMarketingCost;
        const grossProfit = settlementAmt - cogs;
        const claimAndRecovery = claimAmount + totalRecovery;
        const netProfit = grossProfit - totalReturnCost + claimAndRecovery;
        const netProfitWithoutGst = netProfit - totalGst;
        
        const earningsOverview = [
          { title: 'Settlement Amt', value: formatCurrency(settlementAmt), icon: 'settlement' },
          { title: 'Product Cost', value: formatCurrency(productCost), icon: 'product_cost' },
          { title: 'Packaging Cost', value: formatCurrency(totalPackagingCost), icon: 'packaging_cost' },
          { title: 'Marketing Cost', value: formatCurrency(totalMarketingCost), icon: 'marketing_cost' },
          { title: 'Return Cost', value: formatCurrency(totalReturnCost), icon: 'return_cost' },
          { title: 'Claims & Recovery', value: formatCurrency(claimAndRecovery), icon: 'claim' },
          { title: netProfit >= 0 ? 'Net Profit' : 'Net Loss', value: formatCurrency(netProfit), icon: 'profit' },
        ];
        
        const unitEconomics = {
            settlementAmt: formatAmount(settlementAmt), productCost: formatAmount(productCost), packagingCost: formatAmount(totalPackagingCost),
            marketingCost: formatAmount(totalMarketingCost), cogs: formatAmount(cogs), grossProfit: formatAmount(grossProfit),
            returnCost: formatAmount(totalReturnCost), netProfit: formatAmount(netProfit),
            grossMargin: `${settlementAmt > 0 ? ((grossProfit / settlementAmt) * 100).toFixed(2) : '0.00'}%`,
            netMargin: `${settlementAmt > 0 ? ((netProfit / settlementAmt) * 100).toFixed(2) : '0.00'}%`,
            netProfitPerUnit: `₹${deliveredPayments.length > 0 ? (netProfit / deliveredPayments.length).toFixed(2) : '0.00'}`,
            pricesEntered,
            invoicePrice: formatAmount(totalInvoicePrice),
            totalGst: formatAmount(totalGst),
            netProfitWithoutGst: formatAmount(netProfitWithoutGst),
            netProfitPerUnitWithoutGst: `₹${deliveredPayments.length > 0 ? (netProfitWithoutGst / deliveredPayments.length).toFixed(2) : '0.00'}`,
            claimAmount: formatAmount(claimAmount),
            recovery: formatAmount(totalRecovery),
            tds: formatAmount(totalTds),
            tcs: formatAmount(totalTcs),
        };
        
        const paymentStatusCounts = paymentsData.reduce((acc, p) => {
            const status = parseString(p.status).toLowerCase();
            if (status.includes('delivered')) acc.delivered++;
            else if (status.includes('rto')) acc.rto++;
            else if (status.includes('return')) acc.returns++;
            return acc;
        }, { delivered: 0, rto: 0, returns: 0});
    
        const paymentOverview = [
            { title: 'Total Transactions', value: paymentsData.length, icon: 'total' },
            { title: 'Delivered', value: paymentStatusCounts.delivered, icon: 'delivered' },
            { title: 'Returns', value: paymentStatusCounts.returns, icon: 'returns' },
            { title: 'RTO', value: paymentStatusCounts.rto, icon: 'rto' },
        ];
        
        const alerts = [{
            id: 'net_profit', level: netProfit >= 0 ? 'success' : 'danger',
            icon: 'barchart', title: netProfit >= 0 ? 'Net Profit' : 'Net Loss', value: formatCurrency(netProfit),
            description: 'For the selected period and filters.'
        }];
    
        const topDeliveredSkus = Object.entries(
            deliveredPayments.reduce((acc: any, p) => { acc[p.sku] = (acc[p.sku] || 0) + 1; return acc; }, {})
        ).sort(([,a]: any,[,b]: any) => b - a).slice(0, 10).map(([name, value]) => ({ name, value }));
        
        const topReturnedSkus = Object.entries(
            paymentsData.filter(p => parseNumber(p.returnCost) > 0).reduce((acc: any, p) => { acc[p.sku] = (acc[p.sku] || 0) + 1; return acc; }, {})
        ).sort(([,a]: any,[,b]: any) => b - a).slice(0, 10).map(([name, value]) => ({ name, value }));
    
        const skuMetrics: any = {};
        paymentsData.forEach(p => {
            if (!p.sku) return;
            if (!skuMetrics[p.sku]) skuMetrics[p.sku] = { settlement: 0, claim: 0, returnCost: 0, productCost: 0, packagingCost: 0, orders: 0 };
            const metrics = skuMetrics[p.sku];
            metrics.settlement += parseNumber(p.finalPayment);
            metrics.claim += parseNumber(p.claimAmount);
            metrics.returnCost += parseNumber(p.returnCost);
            metrics.orders++;
            if(parseString(p.status).toLowerCase().includes('delivered')) {
                metrics.productCost += (skuCosts[p.sku] || 0);
                metrics.packagingCost += (skuPackagingCosts[p.sku] || 0);
            }
        });
    
        const skuProfitLoss: any[] = Object.entries(skuMetrics).map(([sku, metrics]: [string, any]) => {
            const cogs = metrics.productCost + metrics.packagingCost;
            const profit = metrics.settlement + metrics.claim - metrics.returnCost - cogs;
            return { sku, value: profit, orders: metrics.orders };
        });
    
        const skuProfitData = skuProfitLoss.filter(s => s.value > 0).sort((a,b) => b.value - a.value);
        const skuLossData = skuProfitLoss.filter(s => s.value < 0).sort((a,b) => a.value - b.value);
    
        const keywordDistribution = Object.entries(
            deliveredPayments.reduce((acc: any, p) => {
                if (!p.sku) return acc;
                const keywords = p.sku.split(/[-_\s]+/).filter((k: string) => k.length > 2 && isNaN(parseInt(k)));
                keywords.forEach((kw: string) => {
                    const lowerKw = kw.toLowerCase();
                    acc[lowerKw] = (acc[lowerKw] || 0) + 1;
                });
                return acc;
            }, {})
        ).sort(([, a]: any, [, b]: any) => b - a).slice(0, 10).map(([name, value]) => ({ name, value }));
    
        return {
            hasData: true, orderOverview: paymentOverview, earningsOverview, unitEconomics,
            dailyDeliveredVsReturns: calculateDailyBreakdown(paymentsData),
            deliveredVsRtoPie: [
                { name: 'Delivered', value: paymentStatusCounts.delivered }, { name: 'RTO', value: paymentStatusCounts.rto },
                { name: 'Return', value: paymentStatusCounts.returns }
            ].filter(d => d.value > 0),
            deliveredVsReturnPie: [
                { name: 'Delivered', value: paymentStatusCounts.delivered },
                { name: 'Return', value: paymentStatusCounts.returns + paymentStatusCounts.rto }
            ].filter(d => d.value > 0),
            topDeliveredSkus, topReturnedSkus, skuProfitData, skuLossData, keywordDistribution,
            netProfit, alerts, smartAlerts: generateSmartAlerts(allFilesData, prices), allPayments: paymentsData
        };
    }
    
    function calculateOrdersDashboard(ordersData: any[]) {
        const hasData = ordersData && ordersData.length > 0;
        if (!hasData) return { hasData: false, orderOverview: [], orderStatusDistribution: [], topSkus: [], stateDistribution: [], allOrders: [] };
    
        const counts = { delivered: 0, rto: 0, returns: 0, shipped: 0, cancelled: 0, exchanged: 0, unknown: 0 };
        const skuCounts: any = {};
        const stateCounts: any = {};
    
        for (const o of ordersData) {
            const status = parseString(o.status).toLowerCase();
            if (status.includes('delivered')) counts.delivered++;
            else if (status.includes('rto')) counts.rto++;
            else if (status.includes('return')) counts.returns++;
            else if (status.includes('shipped')) counts.shipped++;
            else if (status.includes('cancelled')) counts.cancelled++;
            else if (status.includes('exchange')) counts.exchanged++;
            else counts.unknown++;
    
            const sku = parseString(o.sku);
            if (sku && sku !== 'Unknown' && sku !== '') skuCounts[sku] = (skuCounts[sku] || 0) + 1;
    
            const state = parseString(o.state);
            if (state && state !== 'Unknown' && state !== '') stateCounts[state] = (stateCounts[state] || 0) + 1;
        }
        
        const totalOrders = ordersData.length;
        
        const orderOverview = [
            { title: 'Total Orders', value: totalOrders, icon: 'total' },
            { title: 'Delivered', value: counts.delivered, icon: 'delivered' },
            { title: 'Delivered %', value: `${totalOrders > 0 ? ((counts.delivered / totalOrders) * 100).toFixed(1) : '0.0'}%`, icon: 'delivered' },
            { title: 'RTO', value: counts.rto, icon: 'rto' },
            { title: 'RTO %', value: `${totalOrders > 0 ? ((counts.rto / totalOrders) * 100).toFixed(1) : '0.0'}%`, icon: 'rto' },
            { title: 'Returns', value: counts.returns, icon: 'returns' },
            { title: 'Return %', value: `${totalOrders > 0 ? ((counts.returns / totalOrders) * 100).toFixed(1) : '0.0'}%`, icon: 'returns' },
            { title: 'Cancelled', value: counts.cancelled, icon: 'cancelled' },
            { title: 'Cancelled %', value: `${totalOrders > 0 ? ((counts.cancelled / totalOrders) * 100).toFixed(1) : '0.0'}%`, icon: 'cancelled' },
            { title: 'Shipped', value: counts.shipped, icon: 'shipped' },
            { title: 'Exchanged', value: counts.exchanged, icon: 'exchanged' },
        ];
        
        const topSkus = Object.entries(skuCounts).sort(([, a]: any, [, b]: any) => b - a).slice(0, 10).map(([name, value]) => ({ name, value }));
        const stateDistribution = Object.entries(stateCounts).sort(([, a]: any, [, b]: any) => b - a).slice(0, 10).map(([state, count]) => ({ state, count }));
        
        return {
            hasData: true, orderOverview,
            orderStatusDistribution: Object.entries(counts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })).filter(d => d.value > 0),
            topSkus, stateDistribution, allOrders: ordersData
        };
    }
    
    function calculateReturnsDashboard(returnsData: any[]) {
        const hasData = returnsData && returnsData.length > 0;
        if (!hasData) return { hasData: false, topReturnedSkus: [], returnReasons: [], allReturns: [] };
        
        const skuCounts: any = {};
        const reasonCounts: any = {};
    
        for (const ret of returnsData) {
            const sku = parseString(ret.sku);
            if (sku && sku !== 'Unknown' && sku !== '') skuCounts[sku] = (skuCounts[sku] || 0) + 1;
    
            const reason = parseString(ret.returnReason);
            if (reason && reason !== 'Unknown' && reason !== '' && !reason.toLowerCase().includes('others')) {
                reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
            }
        }
    
        const topReturnedSkus = Object.entries(skuCounts).sort(([, a]: any, [, b]: any) => b - a).slice(0, 5).map(([name, value]) => ({ name, value }));
        const returnReasons = Object.entries(reasonCounts).sort(([, a]: any, [, b]: any) => b - a).slice(0, 5).map(([name, value]) => ({ name, value }));
    
        return { hasData: true, topReturnedSkus, returnReasons, allReturns: returnsData };
    }
    
    function generateSmartAlerts(filesData: any, prices: any) {
        const alerts: any[] = [];
        const { orders, returns } = filesData;
        if (!orders || !returns || orders.length === 0) return alerts;
        const skuStats: any = orders.reduce((acc: any, order: any) => {
            const sku = parseString(order.sku);
            if (!sku) return acc;
            if (!acc[sku]) acc[sku] = { total: 0, returns: 0 };
            acc[sku].total++;
            return acc;
        }, {});
        returns.forEach((ret: any) => {
            const sku = parseString(ret.sku);
            if (sku && skuStats[sku]) skuStats[sku].returns++;
        });
        for (const sku in skuStats) {
            if (skuStats[sku].total >= 20 && (skuStats[sku].returns / skuStats[sku].total) >= 0.25) {
                alerts.push({ id: `high-return-${sku}`, level: 'warning', message: `High return rate for ${sku} (${((skuStats[sku].returns / skuStats[sku].total) * 100).toFixed(0)}%).`, sku });
            }
        }
        return alerts;
    }
    
    function calculateFilterContext(filesData: any) {
        const paymentsMap = new Map<string, RawPaymentEntry>((filesData.payments || []).map((p: RawPaymentEntry) => [p.orderId, p]));
        const ordersMap = new Map<string, RawOrderEntry>((filesData.orders || []).map((o: RawOrderEntry) => [o.orderId, o]));
        const returnsMap = new Map<string, RawReturnEntry>((filesData.returns || []).map((r: RawReturnEntry) => [r.orderId, r]));
        const allOrderIds = new Set([...paymentsMap.keys(), ...ordersMap.keys(), ...returnsMap.keys()]);
    
        const mergedOrders: any[] = [];
        const availableSkus = new Set<string>();
        const availableStates = new Set<string>();
        const availableReasons = new Set<string>();
        const availableStatuses = new Set<string>();
    
        for (const id of allOrderIds) {
            if (!id) continue;
            const p = paymentsMap.get(id);
            const o = ordersMap.get(id);
            const r = returnsMap.get(id);
            const sku = parseString(p?.sku || o?.sku || r?.sku);
            const status = parseString(p?.status || o?.status || (r ? (r.returnType.toLowerCase().includes('rto') ? 'RTO' : 'Return') : 'Unknown'));
            const date = parseDate(p?.orderDate || null);
            const state = parseString(o?.state);
            const reason = r ? parseString(r.returnReason) : undefined;
            mergedOrders.push({ orderId: id, sku, status, date, state, returnInfo: reason ? { reason } : undefined });
            if (sku) availableSkus.add(sku);
            if (status) availableStatuses.add(status);
            if (state) availableStates.add(state);
            if (reason) availableReasons.add(reason);
        }
        
        return {
            mergedOrders,
            availableSkus: [...availableSkus].sort(),
            availableStates: [...availableStates].sort(),
            availableReasons: [...availableReasons].sort(),
            availableStatuses: [...availableStatuses].sort(),
        };
    }
    
    function getFilteredRawData(filesData: any, filterContext: any, filters: any) {
        let filteredMasterList = [...filterContext.mergedOrders];
        const { start, end } = filters.dateRange;
        if (start || end) {
            const startDate = start ? new Date(start) : null;
            const endDate = end ? new Date(end) : null;
            if(startDate) startDate.setHours(0, 0, 0, 0);
            if(endDate) endDate.setHours(23, 59, 59, 999);
            filteredMasterList = filteredMasterList.filter((o: any) => {
                if (!o.date) return false;
                const orderDate = o.date;
                if (!orderDate || isNaN(orderDate.getTime())) return false;
                return (!startDate || orderDate >= startDate) && (!endDate || orderDate <= endDate);
            });
        }
        if (filters.orderStatuses.length > 0) filteredMasterList = filteredMasterList.filter((o: any) => filters.orderStatuses.includes(o.status));
        if (filters.selectedSkus.length > 0) filteredMasterList = filteredMasterList.filter((o: any) => filters.selectedSkus.includes(o.sku));
        if (filters.selectedStates.length > 0) filteredMasterList = filteredMasterList.filter((o: any) => o.state && filters.selectedStates.includes(o.state));
        if (filters.selectedReasons.length > 0) filteredMasterList = filteredMasterList.filter((o: any) => o.returnInfo && filters.selectedReasons.includes(o.returnInfo.reason));
        if (filters.keyword) {
            const lowerKeyword = filters.keyword.toLowerCase();
            filteredMasterList = filteredMasterList.filter((o: any) => o.sku.toLowerCase().includes(lowerKeyword));
        }
        const filteredOrderIds = new Set(filteredMasterList.map((o: any) => o.orderId).filter(Boolean));
        const filteredSkus = new Set(filteredMasterList.map((o: any) => o.sku).filter(Boolean));
        const hasSkuFilter = filters.selectedSkus.length > 0 || !!filters.keyword;
        return {
            filteredPayments: (filesData.payments || []).filter((p: any) => filteredOrderIds.has(p.orderId)),
            filteredOrders: (filesData.orders || []).filter((o: any) => filteredOrderIds.has(o.orderId)),
            filteredReturns: (filesData.returns || []).filter((r: any) => (r.orderId && filteredOrderIds.has(r.orderId)) || (hasSkuFilter && r.sku && filteredSkus.has(r.sku))),
        };
    }
    
    function calculateDailyBreakdown(payments: any[]) {
        if (!payments || payments.length === 0) return [];
        const dailyMap = new Map();
        payments.forEach(order => {
            const date = parseDate(order.orderDate);
            if (date) {
                const dateKey = date.toISOString().split('T')[0];
                if (!dailyMap.has(dateKey)) dailyMap.set(dateKey, { Delivered: 0, Return: 0, dateObj: date });
                const dayData: any = dailyMap.get(dateKey);
                const status = parseString(order.status).toLowerCase();
                if (status.includes('delivered')) dayData.Delivered++;
                else if (status.includes('return') || status.includes('rto')) dayData.Return++;
            }
        });
        return Array.from(dailyMap.values())
            .sort((a: any, b: any) => a.dateObj.getTime() - b.dateObj.getTime())
            .map((data: any) => ({
                name: data.dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).replace(/ /g, '-'),
                value: data.Delivered, Delivered: data.Delivered, Return: data.Return,
            }));
    }

    return { runFullAnalysis, parseNumber, parseString, parseDate };
})();


// --- Worker Main Logic ---

const fileConfigs = {
  payments: { 
    sheetName: "Order Payments", 
    range: 2,
    parser: (row: any[]): RawPaymentEntry => ({ 
        orderId: dataProcessor.parseString(row[0]),       // Col A
        orderDate: dataProcessor.parseDate(row[1]),       // Col B
        sku: dataProcessor.parseString(row[4]),           // Col E
        status: dataProcessor.parseString(row[5]),        // Col F
        gstRate: dataProcessor.parseNumber(row[6]),       // Col G
        finalPayment: dataProcessor.parseNumber(row[11]), // Col L
        invoicePrice: dataProcessor.parseNumber(row[14]), // Col O
        returnCost: dataProcessor.parseNumber(row[25]),   // Col Z
        tcs: dataProcessor.parseNumber(row[32]),          // Col AG
        tds: dataProcessor.parseNumber(row[34]),          // Col AI
        claimAmount: dataProcessor.parseNumber(row[36]),  // Col AK
        recovery: dataProcessor.parseNumber(row[37]),     // Col AL
    }) 
  },
  orders: { 
    sheetName: null, 
    range: 1,
    parser: (row: any[]): RawOrderEntry => ({ 
        status: dataProcessor.parseString(row[0]),
        orderId: dataProcessor.parseString(row[1]),
        state: dataProcessor.parseString(row[3]),
        sku: dataProcessor.parseString(row[5]),
        size: dataProcessor.parseString(row[6]),
    }) 
  },
  returns: { 
    sheetName: null, 
    range: 8,
    parser: (row: any[]): RawReturnEntry => ({ 
        sku: dataProcessor.parseString(row[2]),
        size: dataProcessor.parseString(row[3]),
        category: dataProcessor.parseString(row[5]),
        orderId: dataProcessor.parseString(row[8]),
        returnType: dataProcessor.parseString(row[11]),
        returnReason: dataProcessor.parseString(row[19]),
        subReason: dataProcessor.parseString(row[20]),
    }) 
  }
};

const normalizeHeader = (text: string) => String(text || '').replace(/\s+/g, '').toLowerCase();

self.onmessage = (event) => {
    try {
        const { newFile, existingFilesData, skuPrices } = event.data;
        const { file, type: fileType } = newFile;

        self.postMessage({ type: 'progress', progress: 10, message: 'Reading file...' });
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target!.result;
                self.postMessage({ type: 'progress', progress: 30, message: 'Parsing workbook...' });
                
                if (!self.XLSX) throw new Error('SheetJS library failed to load.');
                const workbook = self.XLSX.read(data, { type: 'array', cellDates: false, raw: true });
                
                const config = fileConfigs[fileType as keyof typeof fileConfigs];
                let sheet: any;
                let dataStartRow = config.range;

                if (fileType === 'orders' || fileType === 'returns') {
                    const validations = {
                        orders: (headers: string[]) => {
                            const h = headers.map(normalizeHeader);
                            return h[1]?.includes('suborderno') && h[5]?.includes('sku');
                        },
                        returns: (headers: string[]) => {
                            const h = headers.map(normalizeHeader);
                            return h[2]?.includes('sku') && h[8]?.includes('subordernumber');
                        }
                    };

                    const validateRow = validations[fileType as 'orders' | 'returns'];
                    
                    sheetSearch:
                    for (const sName of workbook.SheetNames) {
                        const currentSheet = workbook.Sheets[sName];
                        if (!currentSheet || !currentSheet['!ref']) continue;

                        const MAX_HEADER_ROW_SCAN = 10;
                        const sheetRange = self.XLSX.utils.decode_range(currentSheet['!ref']);

                        for (let i = 0; i < MAX_HEADER_ROW_SCAN && i <= sheetRange.e.r; i++) {
                            try {
                                const headers: string[] = (self.XLSX.utils.sheet_to_json(currentSheet, {
                                    header: 1,
                                    range: i,
                                    defval: ""
                                })[0] || []);
                                
                                if (headers.length > 5 && validateRow(headers)) {
                                    sheet = currentSheet;
                                    dataStartRow = i + 1;
                                    break sheetSearch;
                                }
                            } catch (e) { /* Ignore errors during scan */ }
                        }
                    }
                } else if (fileType === 'payments') {
                    const foundSheetName = workbook.SheetNames.find((name: string) => name.trim() === config.sheetName);
                    if (foundSheetName) {
                        sheet = workbook.Sheets[foundSheetName];
                    }
                }
                
                if (!sheet) {
                    let errorHint = "Please ensure the file contains a sheet with the correct headers.";
                    if (fileType === 'orders') errorHint = "Please ensure the file contains 'Sub Order No' in column B and 'SKU' in column F in the header.";
                    else if (fileType === 'returns') errorHint = "Please ensure the file contains 'SKU' in column C and 'Suborder Number' in column I in the header.";
                    else if (fileType === 'payments') errorHint = `Please ensure the file contains a sheet named exactly '${config.sheetName}'.`;
                    throw new Error(`Could not find a valid sheet in ${file.name}. ${errorHint}`);
                }

                const jsonData = self.XLSX.utils.sheet_to_json(sheet, { header: 1, range: dataStartRow, defval: "" });
                const parsedData = jsonData.map(config.parser).filter((d: any) => d.orderId || d.sku);
                
                let adsCost = 0;
                if (fileType === 'payments') {
                    const adsSheetName = workbook.SheetNames.find((name: string) => name.trim().toLowerCase() === "ads cost");
                    if (adsSheetName) {
                        const adsSheet = workbook.Sheets[adsSheetName];
                        adsCost = self.XLSX.utils.sheet_to_json(adsSheet, { header: 1, range: 3, defval: "" }).reduce((acc: number, row: any[]) => acc + (dataProcessor.parseNumber(row[7]) || 0), 0);
                    }
                }
                
                self.postMessage({ type: 'progress', progress: 60, message: 'Merging data...' });
                const updatedFilesData = { ...existingFilesData, [fileType]: parsedData };
                if (adsCost > 0 || updatedFilesData.adsCost) {
                    updatedFilesData.adsCost = (existingFilesData.adsCost || 0) + adsCost;
                }

                self.postMessage({ type: 'progress', progress: 75, message: 'Calculating analytics...' });
                const { allDashboardData, filterContext } = dataProcessor.runFullAnalysis(updatedFilesData, skuPrices);
              
                self.postMessage({ 
                    type: 'done',
                    payload: { allDashboardData, filterContext, newFilesData: updatedFilesData }
                });

            } catch (err: any) {
                self.postMessage({ type: 'error', message: err.message });
            }
        };
        reader.onerror = () => self.postMessage({ type: 'error', message: 'Error reading file in worker.' });
        reader.readAsArrayBuffer(file);
    } catch(e: any) {
        self.postMessage({ type: 'error', message: `Critical worker error: ${e.message}` });
    }
};