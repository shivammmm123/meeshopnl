

import { 
    FilesData, SkuPrices, KpiData, AlertData, RawPaymentEntry, RawOrderEntry, RawReturnEntry, 
    NameValueData, UnitEconomicsData, FilterState, StateDistributionData, MergedOrder,
    PaymentsDashboardData, OrdersDashboardData, ReturnsDashboardData, FilterContextData,
    SkuDrilldownData, SmartAlert, AllDashboardsData, SkuProfitLossData
} from '../types';

// --- Centralized Data Sanitization Helpers ---

/**
 * Parses a value into a number. Handles currency symbols, thousands separators,
 * and accounting-style negative numbers in parentheses.
 * @param value The value to parse.
 * @returns A number, or 0 if parsing fails.
 */
export const parseNumber = (value: any): number => {
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

/**
 * Parses a value into a trimmed string.
 * @param value The value to parse.
 * @returns A trimmed string.
 */
export const parseString = (value: any): string => {
  return String(value || '').trim();
};

/**
 * Parses a value into a Date object. Handles JS Date objects, date strings,
 * and Excel's serial number format for dates.
 * @param value The value to parse.
 * @returns A Date object, or null if parsing fails.
 */
export const parseDate = (value: any): Date | null => {
    if (value === null || value === undefined) {
        return null;
    }
    // Check if it's already a valid Date object
    if (value instanceof Date && !isNaN(value.getTime())) {
        return value;
    }
    // Check if it's an Excel serial number
    if (typeof value === 'number' && value > 25569) { // 25569 is 1/1/1970
        const date = new Date((value - 25569) * 86400 * 1000);
        // Adjust for timezone offset
        const utcDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
        if (!isNaN(utcDate.getTime())) {
            return utcDate;
        }
    }
    // Try to parse it as a string
    if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }
    return null;
};


const formatCurrency = (value: number) => {
    if (isNaN(value)) return '₹0';
    const sign = value < 0 ? '-' : '';
    value = Math.abs(value);
    if (value >= 10000000) return `${sign}₹${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000) return `${sign}₹${(value / 100000).toFixed(2)}L`;
    return `${sign}₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const formatAmount = (value: number) => {
    if (isNaN(value)) return '₹0.00';
    return `₹${value.toFixed(2)}`;
}

// --- Trend Calculation Helper ---
const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) {
        return { change: current > 0 ? 100 : 0, direction: 'up' as const };
    }
    const change = ((current - previous) / previous) * 100;
    return {
        change: Math.abs(Math.round(change)),
        direction: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const
    };
};


// --- NEW UNIFIED ANALYSIS ENGINE ---

/**
 * Encapsulates the entire analytics pipeline into a single, robust function.
 * @param filesData The complete raw data from all uploaded files.
 * @param skuPrices The user-provided SKU costs and other prices.
 * @returns An object containing all calculated dashboard data and the filter context.
 */
export function runFullAnalysis(filesData: FilesData, skuPrices: SkuPrices | null): { allDashboardData: AllDashboardsData, filterContext: FilterContextData } {
    // 1. Build the master list and filter context
    const filterContext = calculateFilterContext(filesData);
    
    // 2. Get initial data (unfiltered)
    const initialFilters: FilterState = { dateRange: { start: '', end: '' }, orderStatuses: [], selectedSkus: [], selectedStates: [], selectedReasons: [], keyword: '', calculateTrend: false };
    const { filteredPayments, filteredOrders, filteredReturns } = getFilteredRawData(filesData, filterContext, initialFilters);

    const prices = skuPrices || { skuCosts: {}, skuPackagingCosts: {}, externalMarketingCost: 0 };
    const adsCost = filesData.adsCost || 0;

    // 3. Calculate data for each dashboard
    const paymentsDashboardData = calculatePaymentsDashboard(filteredPayments, prices, adsCost, filesData);
    const ordersDashboardData = calculateOrdersDashboard(filteredOrders);
    const returnsDashboardData = calculateReturnsDashboard(filteredReturns);

    // 4. Assemble the final payload
    const allDashboardData: AllDashboardsData = {
        payments: paymentsDashboardData,
        orders: ordersDashboardData,
        returns: returnsDashboardData,
    };

    return { allDashboardData, filterContext };
}


// --- DASHBOARD CALCULATION FUNCTIONS (Called by runFullAnalysis) ---

/**
 * Calculates the data for the Payments Dashboard.
 */
export function calculatePaymentsDashboard(
    paymentsData: RawPaymentEntry[],
    prices: SkuPrices | null,
    adsCost: number,
    allFilesData: FilesData, // Pass all files for smart alerts
    previousPaymentsData?: RawPaymentEntry[],
): PaymentsDashboardData {
    const hasData = paymentsData && paymentsData.length > 0;
    const blankEconomics: UnitEconomicsData = {
        settlementAmt: '₹0.00', productCost: '₹0.00', packagingCost: '₹0.00',
        marketingCost: '₹0.00', cogs: '₹0.00', grossProfit: '₹0.00',
        returnCost: '₹0.00', netProfit: '₹0.00', grossMargin: '0.00%',
        netMargin: '0.00%', netProfitPerUnit: '₹0.00', pricesEntered: false,
        invoicePrice: 'N/A', totalGst: 'N/A', netProfitWithoutGst: 'N/A', 
        netProfitPerUnitWithoutGst: 'N/A', claimAmount: '₹0.00', recovery: '₹0.00',
        tds: '₹0.00', tcs: '₹0.00',
    };
    if (!hasData) {
        return {
            hasData: false, orderOverview: [], earningsOverview: [], unitEconomics: blankEconomics,
            dailyDeliveredVsReturns: [], deliveredVsRtoPie: [], deliveredVsReturnPie: [],
            topDeliveredSkus: [], topReturnedSkus: [], skuProfitData: [], skuLossData: [], keywordDistribution: [],
            netProfit: 0, alerts: [], smartAlerts: [], allPayments: []
        };
    }
    
    const { skuCosts, skuPackagingCosts, externalMarketingCost } = prices || { skuCosts: {}, skuPackagingCosts: {}, externalMarketingCost: 0 };
    const pricesEntered = !!prices && Object.keys(prices.skuCosts).length > 0 && Object.values(prices.skuCosts).some(p => p > 0);
    
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


    // Previous period calculation
    let prevNetProfit = 0;
    if(previousPaymentsData) {
        // This calculation can be expanded if trend analysis becomes more complex
    }
    
    const earningsOverview: KpiData[] = [
      { title: 'Settlement Amt', value: formatCurrency(settlementAmt), icon: 'settlement' },
      { title: 'Product Cost', value: formatCurrency(productCost), icon: 'product_cost' },
      { title: 'Packaging Cost', value: formatCurrency(totalPackagingCost), icon: 'packaging_cost' },
      { title: 'Marketing Cost', value: formatCurrency(totalMarketingCost), icon: 'marketing_cost' },
      { title: 'Return Cost', value: formatCurrency(totalReturnCost), icon: 'return_cost' },
      { title: 'Claims & Recovery', value: formatCurrency(claimAndRecovery), icon: 'claim' },
      { title: netProfit >= 0 ? 'Net Profit' : 'Net Loss', value: formatCurrency(netProfit), icon: 'profit', trend: previousPaymentsData ? calculateTrend(netProfit, prevNetProfit) : undefined },
    ];
    
    const unitEconomics: UnitEconomicsData = {
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

    const paymentOverview: KpiData[] = [
        { title: 'Total Transactions', value: paymentsData.length, icon: 'total' },
        { title: 'Delivered', value: paymentStatusCounts.delivered, icon: 'delivered' },
        { title: 'Returns', value: paymentStatusCounts.returns, icon: 'returns' },
        { title: 'RTO', value: paymentStatusCounts.rto, icon: 'rto' },
    ];
    
    const alerts: AlertData[] = [{
        id: 'net_profit',
        level: netProfit >= 0 ? 'success' : 'danger',
        icon: 'barchart',
        title: netProfit >= 0 ? 'Net Profit' : 'Net Loss',
        value: formatCurrency(netProfit),
        description: 'For the selected period and filters.'
    }];

    // --- New Chart Data Calculations ---

    const topDeliveredSkus = Object.entries(
        deliveredPayments.reduce((acc, p) => { acc[p.sku] = (acc[p.sku] || 0) + 1; return acc; }, {} as Record<string, number>)
    ).sort(([,a],[,b]) => b - a).slice(0, 10).map(([name, value]) => ({ name, value }));
    
    const topReturnedSkus = Object.entries(
        paymentsData.filter(p => parseNumber(p.returnCost) > 0).reduce((acc, p) => { acc[p.sku] = (acc[p.sku] || 0) + 1; return acc; }, {} as Record<string, number>)
    ).sort(([,a],[,b]) => b - a).slice(0, 10).map(([name, value]) => ({ name, value }));

    const skuMetrics: Record<string, { settlement: number, claim: number, returnCost: number, productCost: number, packagingCost: number, orders: number }> = {};
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

    const skuProfitLoss: SkuProfitLossData[] = Object.entries(skuMetrics).map(([sku, metrics]) => {
        const cogs = metrics.productCost + metrics.packagingCost; // Simplified COGS for this SKU
        const profit = metrics.settlement + metrics.claim - metrics.returnCost - cogs;
        return { sku, value: profit, orders: metrics.orders };
    });

    const skuProfitData = skuProfitLoss.filter(s => s.value > 0).sort((a,b) => b.value - a.value);
    const skuLossData = skuProfitLoss.filter(s => s.value < 0).sort((a,b) => a.value - b.value);

    const keywordDistribution: NameValueData[] = Object.entries(
        deliveredPayments.reduce((acc, p) => {
            if (!p.sku) return acc;
            const keywords = p.sku.split(/[-_\s]+/).filter(k => k.length > 2 && isNaN(parseInt(k)));
            keywords.forEach(kw => {
                const lowerKw = kw.toLowerCase();
                acc[lowerKw] = (acc[lowerKw] || 0) + 1;
            });
            return acc;
        }, {} as Record<string, number>)
    ).sort(([, a], [, b]) => b - a).slice(0, 10).map(([name, value]) => ({ name, value }));

    return {
        hasData: true, orderOverview: paymentOverview, earningsOverview, unitEconomics,
        dailyDeliveredVsReturns: calculateDailyBreakdown(paymentsData),
        deliveredVsRtoPie: [
            { name: 'Delivered', value: paymentStatusCounts.delivered },
            { name: 'RTO', value: paymentStatusCounts.rto },
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


/**
 * Calculates the data for the Orders Dashboard.
 */
export function calculateOrdersDashboard(
    ordersData: RawOrderEntry[],
    previousOrdersData?: RawOrderEntry[]
): OrdersDashboardData {
    const hasData = ordersData && ordersData.length > 0;
    if (!hasData) {
        return {
            hasData: false,
            orderOverview: [],
            orderStatusDistribution: [],
            stateDistribution: [],
            topSkus: [],
            allOrders: [],
        };
    }

    const counts = { delivered: 0, rto: 0, returns: 0, shipped: 0, cancelled: 0, exchanged: 0, unknown: 0 };
    const skuCounts: { [key: string]: number } = {};
    const stateCounts: { [key: string]: number } = {};

    for (const o of ordersData) {
        // Status Counts
        const status = parseString(o.status).toLowerCase();
        if (status.includes('delivered')) counts.delivered++;
        else if (status.includes('rto')) counts.rto++;
        else if (status.includes('return')) counts.returns++;
        else if (status.includes('shipped')) counts.shipped++;
        else if (status.includes('cancelled')) counts.cancelled++;
        else if (status.includes('exchange')) counts.exchanged++;
        else counts.unknown++;

        // SKU Counts
        const sku = parseString(o.sku);
        if (sku && sku !== 'Unknown' && sku !== '') {
            skuCounts[sku] = (skuCounts[sku] || 0) + 1;
        }

        // State Counts
        const state = parseString(o.state);
        if (state && state !== 'Unknown' && state !== '') {
            stateCounts[state] = (stateCounts[state] || 0) + 1;
        }
    }

    // Previous data counts (if provided)
    const getPrevCounts = (data: RawOrderEntry[]) => data.reduce((acc, o) => {
        const status = parseString(o.status).toLowerCase();
        if (status.includes('delivered')) acc.delivered++;
        else if (status.includes('rto')) acc.rto++;
        else if (status.includes('return')) acc.returns++;
        else if (status.includes('shipped')) acc.shipped++;
        else if (status.includes('cancelled')) acc.cancelled++;
        else if (status.includes('exchange')) acc.exchanged++;
        else acc.unknown++;
        return acc;
    }, { delivered: 0, rto: 0, returns: 0, shipped: 0, cancelled: 0, exchanged: 0, unknown: 0 });

    const prevCounts = previousOrdersData ? getPrevCounts(previousOrdersData) : null;
    
    const totalOrders = ordersData.length;
    const deliveredPerc = totalOrders > 0 ? `${((counts.delivered / totalOrders) * 100).toFixed(1)}%` : '0.0%';
    const returnPerc = totalOrders > 0 ? `${((counts.returns / totalOrders) * 100).toFixed(1)}%` : '0.0%';
    const rtoPerc = totalOrders > 0 ? `${((counts.rto / totalOrders) * 100).toFixed(1)}%` : '0.0%';
    const cancelledPerc = totalOrders > 0 ? `${((counts.cancelled / totalOrders) * 100).toFixed(1)}%` : '0.0%';

    const orderOverview: KpiData[] = [
        { title: 'Total Orders', value: totalOrders, icon: 'total', trend: prevCounts ? calculateTrend(totalOrders, previousOrdersData!.length) : undefined },
        { title: 'Delivered', value: counts.delivered, icon: 'delivered', trend: prevCounts ? calculateTrend(counts.delivered, prevCounts.delivered) : undefined },
        { title: 'Delivered %', value: deliveredPerc, icon: 'delivered' },
        { title: 'RTO', value: counts.rto, icon: 'rto', trend: prevCounts ? calculateTrend(counts.rto, prevCounts.rto) : undefined },
        { title: 'RTO %', value: rtoPerc, icon: 'rto' },
        { title: 'Returns', value: counts.returns, icon: 'returns', trend: prevCounts ? calculateTrend(counts.returns, prevCounts.returns) : undefined },
        { title: 'Return %', value: returnPerc, icon: 'returns' },
        { title: 'Cancelled', value: counts.cancelled, icon: 'cancelled', trend: prevCounts ? calculateTrend(counts.cancelled, prevCounts.cancelled) : undefined },
        { title: 'Cancelled %', value: cancelledPerc, icon: 'cancelled' },
        { title: 'Shipped', value: counts.shipped, icon: 'shipped', trend: prevCounts ? calculateTrend(counts.shipped, prevCounts.shipped) : undefined },
        { title: 'Exchanged', value: counts.exchanged, icon: 'exchanged', trend: prevCounts ? calculateTrend(counts.exchanged, prevCounts.exchanged) : undefined },
    ];
    
    const topSkus = Object.entries(skuCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }));

    const stateDistribution = Object.entries(stateCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([state, count]) => ({ state, count }));
    
    return {
        hasData: true,
        orderOverview,
        orderStatusDistribution: Object.entries(counts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })).filter(d => d.value > 0),
        topSkus,
        stateDistribution,
        allOrders: ordersData
    };
}

/**
 * Calculates the data for the Returns Dashboard.
 */
export function calculateReturnsDashboard(returnsData: RawReturnEntry[]): ReturnsDashboardData {
     const hasData = returnsData && returnsData.length > 0;
    if (!hasData) {
        return {
            hasData: false,
            topReturnedSkus: [],
            returnReasons: [],
            allReturns: [],
        };
    }
    
    const skuCounts: { [key: string]: number } = {};
    const reasonCounts: { [key: string]: number } = {};

    for (const ret of returnsData) {
        const sku = parseString(ret.sku);
        if (sku && sku !== 'Unknown' && sku !== '') {
            skuCounts[sku] = (skuCounts[sku] || 0) + 1;
        }

        const reason = parseString(ret.returnReason);
        if (reason && reason !== 'Unknown' && reason !== '' && !reason.toLowerCase().includes('others')) {
            reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
        }
    }

    const topReturnedSkus = Object.entries(skuCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

    const returnReasons = Object.entries(reasonCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

    return {
        hasData: true,
        topReturnedSkus,
        returnReasons,
        allReturns: returnsData
    };
}

/**
 * Calculates detailed metrics for a single SKU.
 */
export function calculateSkuDrilldown(
    sku: string,
    filesData: FilesData,
    prices: SkuPrices | null
): SkuDrilldownData {
    const { payments, orders, returns } = filesData;
    const { skuCosts = {}, skuPackagingCosts = {} } = prices || {};

    if (!payments) {
        return { sku, isDataSufficient: false } as SkuDrilldownData;
    }

    const skuPayments = payments.filter(p => p.sku === sku);
    const skuOrders = orders?.filter(o => o.sku === sku) || [];
    
    const totalSold = skuOrders.length;
    const deliveredPayments = skuPayments.filter(p => parseString(p.status).toLowerCase().includes('delivered'));
    const totalDelivered = deliveredPayments.length;
    
    const totalSettlement = deliveredPayments.reduce((sum, p) => sum + parseNumber(p.finalPayment), 0);
    const productCost = (skuCosts[sku] || 0) * totalDelivered;
    const totalPackagingCost = (skuPackagingCosts[sku] || 0) * totalDelivered;
    const cogs = productCost + totalPackagingCost;
    
    const returnCost = skuPayments.reduce((sum, p) => sum + parseNumber(p.returnCost), 0);
    const claimAmount = skuPayments.reduce((sum, p) => sum + parseNumber(p.claimAmount), 0);

    const netProfit = totalSettlement - cogs - returnCost + claimAmount;
    
    const statusCounts = skuOrders.reduce((acc, o) => {
        const status = parseString(o.status).toLowerCase();
        if (status.includes('return')) acc.returns++;
        if (status.includes('rto')) acc.rto++;
        return acc;
    }, { returns: 0, rto: 0 });


    return {
        sku,
        totalSold,
        totalDelivered,
        totalSettlement,
        totalReturns: statusCounts.returns,
        totalRTO: statusCounts.rto,
        netProfit,
        isDataSufficient: true
    };
}

/**
 * Generates smart alerts based on the overall data.
 */
export function generateSmartAlerts(filesData: FilesData, prices: SkuPrices | null): SmartAlert[] {
    const alerts: SmartAlert[] = [];
    const { payments, orders, returns } = filesData;
    const { skuCosts = {} } = prices || {};

    if (!orders || !returns || orders.length === 0) {
        return alerts;
    }
    
    // 1. High Return Rate Alert
    const returnThreshold = 0.25; // 25%
    const minOrdersForReturnAlert = 20;

    const skuStats = orders.reduce((acc, order) => {
        const sku = parseString(order.sku);
        if (!sku) return acc;
        if (!acc[sku]) acc[sku] = { total: 0, returns: 0 };
        acc[sku].total++;
        return acc;
    }, {} as { [key: string]: { total: number, returns: number } });

    returns.forEach(ret => {
        const sku = parseString(ret.sku);
        if (sku && skuStats[sku]) {
            skuStats[sku].returns++;
        }
    });

    for (const sku in skuStats) {
        const stats = skuStats[sku];
        if (stats.total >= minOrdersForReturnAlert) {
            const returnRate = stats.returns / stats.total;
            if (returnRate >= returnThreshold) {
                alerts.push({
                    id: `high-return-${sku}`,
                    level: 'warning',
                    message: `High return rate for ${sku} (${(returnRate * 100).toFixed(0)}%).`,
                    sku: sku,
                });
            }
        }
    }

    // 2. Unprofitable SKU Alert
    if (payments && Object.keys(skuCosts).length > 0) {
        const unprofitableSkus = new Set<string>();
        payments.forEach(p => {
            const sku = parseString(p.sku);
            if (!skuCosts[sku]) return; // Skip if no cost is entered

            const settlement = parseNumber(p.finalPayment);
            const productCost = skuCosts[sku] || 0;
            const returnCost = parseNumber(p.returnCost);
            const claim = parseNumber(p.claimAmount);

            // Simplified profit per transaction
            if (settlement + claim < productCost + returnCost) {
                unprofitableSkus.add(sku);
            }
        });

        unprofitableSkus.forEach(sku => {
            if (!alerts.some(a => a.sku === sku)) { // Don't add if another alert for this SKU exists
                 alerts.push({
                    id: `unprofitable-${sku}`,
                    level: 'warning',
                    message: `${sku} appears to be unprofitable.`,
                    sku: sku,
                });
            }
        });
    }

    return alerts;
}


// --- FILTERING LOGIC ---

/**
 * Creates a master list of all orders from all available files.
 * This is used ONLY for powering the global filters.
 * This version is optimized for performance on large datasets.
 */
export function calculateFilterContext(filesData: FilesData): FilterContextData {
    const paymentsMap = new Map((filesData.payments || []).map(p => [p.orderId, p]));
    const ordersMap = new Map((filesData.orders || []).map(o => [o.orderId, o]));
    const returnsMap = new Map((filesData.returns || []).map(r => [r.orderId, r]));

    const allOrderIds = new Set([...paymentsMap.keys(), ...ordersMap.keys(), ...returnsMap.keys()]);

    const mergedOrders: MergedOrder[] = [];
    const availableSkus = new Set<string>();
    const availableStates = new Set<string>();
    const availableReasons = new Set<string>();
    const availableStatuses = new Set<string>();

    for (const id of allOrderIds) {
        if (!id) continue; // Skip blank order IDs which can appear in the Set

        const p = paymentsMap.get(id);
        const o = ordersMap.get(id);
        const r = returnsMap.get(id);
        
        const sku = parseString(p?.sku || o?.sku || r?.sku);
        const status = parseString(p?.status || o?.status || (r ? (r.returnType.toLowerCase().includes('rto') ? 'RTO' : 'Return') : 'Unknown'));
        const date = parseDate(p?.orderDate || null);
        const state = parseString(o?.state);
        const reason = r ? parseString(r.returnReason) : undefined;
        
        const mergedOrder: MergedOrder = {
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

/**
 * Applies the current filters to the master list to get a set of allowed Order IDs,
 * then returns the raw data arrays filtered by these IDs.
 */
export function getFilteredRawData(filesData: FilesData, filterContext: FilterContextData, filters: FilterState) {
    let filteredMasterList: MergedOrder[] = [...filterContext.mergedOrders];

    const { start, end } = filters.dateRange;
    if (start || end) {
        const startDate = start ? new Date(start) : null;
        const endDate = end ? new Date(end) : null;
        if(startDate) startDate.setHours(0, 0, 0, 0);
        if(endDate) endDate.setHours(23, 59, 59, 999);
        filteredMasterList = filteredMasterList.filter(o => {
            if (!o.date) return false;
            const orderDate = o.date;
            if (!orderDate || isNaN(orderDate.getTime())) return false;
            return (!startDate || orderDate >= startDate) && (!endDate || orderDate <= endDate);
        });
    }
    
    if (filters.orderStatuses.length > 0) filteredMasterList = filteredMasterList.filter(o => filters.orderStatuses.includes(o.status));
    if (filters.selectedSkus.length > 0) filteredMasterList = filteredMasterList.filter(o => filters.selectedSkus.includes(o.sku));
    if (filters.selectedStates.length > 0) filteredMasterList = filteredMasterList.filter(o => o.state && filters.selectedStates.includes(o.state));
    if (filters.selectedReasons.length > 0) filteredMasterList = filteredMasterList.filter(o => o.returnInfo && filters.selectedReasons.includes(o.returnInfo.reason));
    if (filters.keyword) {
        const lowerKeyword = filters.keyword.toLowerCase();
        filteredMasterList = filteredMasterList.filter(o => o.sku.toLowerCase().includes(lowerKeyword));
    }

    const filteredOrderIds = new Set(filteredMasterList.map(o => o.orderId).filter(Boolean));
    const filteredSkus = new Set(filteredMasterList.map(o => o.sku).filter(Boolean));
    
    // If SKUs are filtered, we need to consider them for the returns file especially,
    // as it might not always have an order ID but will have a SKU.
    const hasSkuFilter = filters.selectedSkus.length > 0 || !!filters.keyword;

    return {
        filteredPayments: (filesData.payments || []).filter(p => filteredOrderIds.has(p.orderId)),
        filteredOrders: (filesData.orders || []).filter(o => filteredOrderIds.has(o.orderId)),
        filteredReturns: (filesData.returns || []).filter(r => 
            (r.orderId && filteredOrderIds.has(r.orderId)) || (hasSkuFilter && r.sku && filteredSkus.has(r.sku))
        ),
    };
}


// --- UTILITY FUNCTIONS ---
function calculateDailyBreakdown(payments: RawPaymentEntry[]) {
    if (!payments || payments.length === 0) return [];
    
    const dailyMap = new Map<string, { Delivered: number; Return: number; dateObj: Date }>();
    payments.forEach(order => {
        const date = parseDate(order.orderDate);
        if (date) {
            const dateKey = date.toISOString().split('T')[0];
            if (!dailyMap.has(dateKey)) dailyMap.set(dateKey, { Delivered: 0, Return: 0, dateObj: date });
            
            const dayData = dailyMap.get(dateKey)!;
            const status = parseString(order.status).toLowerCase();

            if (status.includes('delivered')) dayData.Delivered++;
            else if (status.includes('return') || status.includes('rto')) dayData.Return++;
        }
    });

    return Array.from(dailyMap.values())
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
        .map(data => ({
            name: data.dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).replace(/ /g, '-'),
            value: data.Delivered, 
            Delivered: data.Delivered,
            Return: data.Return,
        }));
}