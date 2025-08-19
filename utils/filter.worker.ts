// This is a standalone web worker file. It's referenced by `app/app/page.tsx`.
// It runs in a separate thread and handles heavy data filtering and dashboard recalculations.

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
const dashboardProcessor = (() => {

    const parseNumber = (value: any): number => {
      if (value === null || value === undefined || value === '') {
        return 0;
      }
      let s = String(value).trim();
      if (s.startsWith('(') && s.endsWith(')')) {
        s = '-' + s.substring(1, s.length - 1);
      }
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
        if (typeof value === 'number' && value > 25569) {
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
    
    // --- All other data processing functions are included here ---
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
            
            const mergedOrder = {
                orderId: id,
                sku: sku,
                status: status,
                date: date,
                state: state,
                returnInfo: reason ? { reason: reason } : undefined,
            };
            mergedOrders.push(mergedOrder);
    
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
    
    return {
        calculateFilterContext,
        getFilteredRawData,
        calculatePaymentsDashboard,
        calculateOrdersDashboard,
        calculateReturnsDashboard
    };
})();


// --- Worker Main Logic ---
self.onmessage = (event) => {
    try {
        const { filesData, filterContext: existingFilterContext, filters, skuPrices, recalculateContext } = event.data;

        // If recalculateContext is true, we must build it. Otherwise, we use the one passed in.
        const context = recalculateContext ? dashboardProcessor.calculateFilterContext(filesData) : existingFilterContext;

        if (!context) {
            throw new Error("Filter context is missing and was not recalculated.");
        }

        // Run the filtering and recalculation logic
        const { filteredPayments, filteredOrders, filteredReturns } = dashboardProcessor.getFilteredRawData(filesData, context, filters);
        
        const allDashboardData = {
            payments: dashboardProcessor.calculatePaymentsDashboard(filteredPayments, skuPrices, filesData.adsCost || 0, filesData),
            orders: dashboardProcessor.calculateOrdersDashboard(filteredOrders),
            returns: dashboardProcessor.calculateReturnsDashboard(filteredReturns)
        };
      
        // The payload that will be sent back
        const payload: any = { allDashboardData };
        
        // If we recalculated the context, we need to send it back to the main thread
        if (recalculateContext) {
            payload.filterContext = context;
        }

        self.postMessage({ 
            type: 'done',
            payload: payload
        });

    } catch (err: any) {
        self.postMessage({ type: 'error', message: err.message });
    }
};