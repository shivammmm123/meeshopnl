

export const workerCode = `
// --- Inlined dataProcessor.ts content starts here ---
// All 'export' keywords are removed.
// All React dependencies are removed.

const parseNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  let s = String(value).trim();
  if (s.startsWith('(') && s.endsWith(')')) s = '-' + s.substring(1, s.length - 1);
  const sanitized = s.replace(/[^0-9.-]/g, '');
  const number = parseFloat(sanitized);
  return isNaN(number) ? 0 : number;
};

const parseString = (value) => String(value || '').trim();

const parseDate = (value) => {
    if (value === null || value === undefined) return null;
    if (value instanceof Date && !isNaN(value.getTime())) return value;
    if (typeof value === 'number' && value > 25569) {
        const date = new Date((value - 25569) * 86400 * 1000);
        const utcDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
        if (!isNaN(utcDate.getTime())) return utcDate;
    }
    if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) return date;
    }
    return null;
};

const formatCurrency = (value) => {
    if (isNaN(value)) return '₹0';
    const sign = value < 0 ? '-' : '';
    value = Math.abs(value);
    if (value >= 10000000) return \`\${sign}₹\${(value / 10000000).toFixed(2)}Cr\`;
    if (value >= 100000) return \`\${sign}₹\${(value / 100000).toFixed(2)}L\`;
    return \`\${sign}₹\${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}\`;
};

const formatAmount = (value) => {
    if (isNaN(value)) return '₹0';
    return \`₹\${value.toFixed(2)}\`;
}

const calculateTrend = (current, previous) => {
    if (previous === 0) return { change: current > 0 ? 100 : 0, direction: 'up' };
    const change = ((current - previous) / previous) * 100;
    return {
        change: Math.abs(Math.round(change)),
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    };
};

function runFullAnalysis(filesData, skuPrices) {
    const filterContext = calculateFilterContext(filesData);
    const initialFilters = { dateRange: { start: '', end: '' }, orderStatuses: [], selectedSkus: [], selectedStates: [], selectedReasons: [], calculateTrend: false };
    const { filteredPayments, filteredOrders, filteredReturns } = getFilteredRawData(filesData, filterContext, initialFilters);
    const prices = skuPrices || { skuCosts: {}, packagingCost: 0, marketingCost: 0 };
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


function calculatePaymentsDashboard(paymentsData, prices, adsCost, allFilesData, previousPaymentsData) {
    const hasData = paymentsData && paymentsData.length > 0;
    if (!hasData) return { 
        hasData: false, 
        orderOverview: [], 
        earningsOverview: [], 
        unitEconomics: {
            settlementAmt: '₹0.00', productCost: '₹0.00', packagingCost: '₹0.00',
            marketingCost: '₹0.00', cogs: '₹0.00', grossProfit: '₹0.00',
            returnCost: '₹0.00', netProfit: '₹0.00', grossMargin: '0.00%',
            netMargin: '0.00%', netProfitPerUnit: '₹0.00', pricesEntered: false
        }, 
        dailyDeliveredVsReturns: [], 
        deliveredVsRtoPie: [], 
        netProfit: 0, 
        alerts: [], 
        smartAlerts: [], 
        allPayments: [], 
    };
    
    const { skuCosts, packagingCost } = prices;
    const pricesEntered = Object.keys(skuCosts).length > 0 && Object.values(skuCosts).some(p => p > 0);
    
    const settlementAmt = paymentsData.reduce((sum, p) => sum + parseNumber(p.finalPayment), 0);
    const claimAmount = paymentsData.reduce((sum, p) => sum + parseNumber(p.claimAmount), 0);
    const totalReturnCost = paymentsData.reduce((sum, p) => sum + parseNumber(p.returnCost), 0);
    
    const deliveredPayments = paymentsData.filter(p => parseString(p.status).toLowerCase().includes('delivered'));
    const productCost = deliveredPayments.reduce((sum, p) => sum + (skuCosts[p.sku] || 0), 0);
    const totalPackagingCost = deliveredPayments.length * packagingCost;

    const totalMarketingCost = adsCost || 0;
    const cogs = productCost + totalPackagingCost + totalMarketingCost;
    const grossProfit = settlementAmt - cogs;
    const netProfit = grossProfit - totalReturnCost + claimAmount;
    
    const earningsOverview = [
      { title: 'Settlement Amt', value: formatCurrency(settlementAmt), icon: 'settlement' },
      { title: 'Product Cost', value: formatCurrency(productCost), icon: 'product_cost' },
      { title: 'Packaging Cost', value: formatCurrency(totalPackagingCost), icon: 'packaging_cost' },
      { title: 'Marketing Cost', value: formatCurrency(totalMarketingCost), icon: 'marketing_cost' },
      { title: 'Return Cost', value: formatCurrency(totalReturnCost), icon: 'return_cost' },
      { title: 'Claim Amount', value: formatCurrency(claimAmount), icon: 'claim' },
      { title: 'Net Profit', value: formatCurrency(netProfit), icon: 'profit' },
    ];
    
    const unitEconomics = {
        settlementAmt: formatAmount(settlementAmt), productCost: formatAmount(productCost), packagingCost: formatAmount(totalPackagingCost),
        marketingCost: formatAmount(totalMarketingCost), cogs: formatAmount(cogs), grossProfit: formatAmount(grossProfit),
        returnCost: formatAmount(totalReturnCost), netProfit: formatAmount(netProfit),
        grossMargin: \`\${settlementAmt > 0 ? ((grossProfit / settlementAmt) * 100).toFixed(2) : '0.00'}%\`,
        netMargin: \`\${settlementAmt > 0 ? ((netProfit / settlementAmt) * 100).toFixed(2) : '0.00'}%\`,
        netProfitPerUnit: \`₹\${deliveredPayments.length > 0 ? (netProfit / deliveredPayments.length).toFixed(2) : '0.00'}\`,
        pricesEntered,
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
        icon: 'barchart', title: 'Net Profit', value: formatCurrency(netProfit),
        description: 'For the selected period and filters.'
    }];

    return {
        hasData: true, orderOverview: paymentOverview, earningsOverview, unitEconomics,
        dailyDeliveredVsReturns: calculateDailyBreakdown(paymentsData),
        deliveredVsRtoPie: [
            { name: 'Delivered', value: paymentStatusCounts.delivered }, { name: 'RTO', value: paymentStatusCounts.rto },
            { name: 'Return', value: paymentStatusCounts.returns }
        ].filter(d => d.value > 0),
        netProfit, alerts, smartAlerts: generateSmartAlerts(allFilesData, prices), allPayments: paymentsData
    };
}

function calculateOrdersDashboard(ordersData, previousOrdersData) {
    const hasData = ordersData && ordersData.length > 0;
    if (!hasData) return { hasData: false, orderOverview: [], orderStatusDistribution: [], topSkus: [], stateDistribution: [], allOrders: [] };

    const counts = { delivered: 0, rto: 0, returns: 0, shipped: 0, cancelled: 0, exchanged: 0, unknown: 0 };
    const skuCounts = {};
    const stateCounts = {};

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
        { title: 'Delivered %', value: \`\${totalOrders > 0 ? ((counts.delivered / totalOrders) * 100).toFixed(1) : '0.0'}%\`, icon: 'delivered' },
        { title: 'RTO', value: counts.rto, icon: 'rto' },
        { title: 'RTO %', value: \`\${totalOrders > 0 ? ((counts.rto / totalOrders) * 100).toFixed(1) : '0.0'}%\`, icon: 'rto' },
        { title: 'Returns', value: counts.returns, icon: 'returns' },
        { title: 'Return %', value: \`\${totalOrders > 0 ? ((counts.returns / totalOrders) * 100).toFixed(1) : '0.0'}%\`, icon: 'returns' },
        { title: 'Cancelled', value: counts.cancelled, icon: 'cancelled' },
        { title: 'Cancelled %', value: \`\${totalOrders > 0 ? ((counts.cancelled / totalOrders) * 100).toFixed(1) : '0.0'}%\`, icon: 'cancelled' },
        { title: 'Shipped', value: counts.shipped, icon: 'shipped' },
        { title: 'Exchanged', value: counts.exchanged, icon: 'exchanged' },
    ];
    
    const topSkus = Object.entries(skuCounts).sort(([, a], [, b]) => b - a).slice(0, 10).map(([name, value]) => ({ name, value }));
    const stateDistribution = Object.entries(stateCounts).sort(([, a], [, b]) => b - a).slice(0, 10).map(([state, count]) => ({ state, count }));
    
    return {
        hasData: true, orderOverview,
        orderStatusDistribution: Object.entries(counts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })).filter(d => d.value > 0),
        topSkus, stateDistribution, allOrders: ordersData
    };
}

function calculateReturnsDashboard(returnsData) {
    const hasData = returnsData && returnsData.length > 0;
    if (!hasData) return { hasData: false, topReturnedSkus: [], returnReasons: [], allReturns: [] };
    
    const skuCounts = {};
    const reasonCounts = {};

    for (const ret of returnsData) {
        const sku = parseString(ret.sku);
        if (sku && sku !== 'Unknown' && sku !== '') skuCounts[sku] = (skuCounts[sku] || 0) + 1;

        const reason = parseString(ret.returnReason);
        if (reason && reason !== 'Unknown' && reason !== '' && !reason.toLowerCase().includes('others')) {
            reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
        }
    }

    const topReturnedSkus = Object.entries(skuCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, value]) => ({ name, value }));
    const returnReasons = Object.entries(reasonCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, value]) => ({ name, value }));

    return { hasData: true, topReturnedSkus, returnReasons, allReturns: returnsData };
}

function generateSmartAlerts(filesData, prices) {
    const alerts = [];
    const { orders, returns, payments } = filesData;
    const { skuCosts = {} } = prices || {};
    if (!orders || !returns || orders.length === 0) return alerts;
    const skuStats = orders.reduce((acc, order) => {
        const sku = parseString(order.sku);
        if (!sku) return acc;
        if (!acc[sku]) acc[sku] = { total: 0, returns: 0 };
        acc[sku].total++;
        return acc;
    }, {});
    returns.forEach(ret => {
        const sku = parseString(ret.sku);
        if (sku && skuStats[sku]) skuStats[sku].returns++;
    });
    for (const sku in skuStats) {
        if (skuStats[sku].total >= 20 && (skuStats[sku].returns / skuStats[sku].total) >= 0.25) {
            alerts.push({ id: \`high-return-\${sku}\`, level: 'warning', message: \`High return rate for \${sku} (\${((skuStats[sku].returns / skuStats[sku].total) * 100).toFixed(0)}%).\`, sku });
        }
    }
    return alerts;
}

function calculateFilterContext(filesData) {
    const paymentsMap = new Map((filesData.payments || []).map(p => [p.orderId, p]));
    const ordersMap = new Map((filesData.orders || []).map(o => [o.orderId, o]));
    const returnsMap = new Map((filesData.returns || []).map(r => [r.orderId, r]));
    const allOrderIds = new Set([...paymentsMap.keys(), ...ordersMap.keys(), ...returnsMap.keys()]);

    const mergedOrders = [];
    const availableSkus = new Set();
    const availableStates = new Set();
    const availableReasons = new Set();
    const availableStatuses = new Set();

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

function getFilteredRawData(filesData, filterContext, filters) {
    let filteredMasterList = [...filterContext.mergedOrders];
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
    const filteredOrderIds = new Set(filteredMasterList.map(o => o.orderId).filter(Boolean));
    const filteredSkus = new Set(filteredMasterList.map(o => o.sku).filter(Boolean));
    const hasSkuFilter = filters.selectedSkus.length > 0;
    return {
        filteredPayments: (filesData.payments || []).filter(p => filteredOrderIds.has(p.orderId)),
        filteredOrders: (filesData.orders || []).filter(o => filteredOrderIds.has(o.orderId)),
        filteredReturns: (filesData.returns || []).filter(r => (r.orderId && filteredOrderIds.has(r.orderId)) || (hasSkuFilter && r.sku && filteredSkus.has(r.sku))),
    };
}

function calculateDailyBreakdown(payments) {
    if (!payments || payments.length === 0) return [];
    const dailyMap = new Map();
    payments.forEach(order => {
        const date = parseDate(order.orderDate);
        if (date) {
            const dateKey = date.toISOString().split('T')[0];
            if (!dailyMap.has(dateKey)) dailyMap.set(dateKey, { Delivered: 0, Return: 0, dateObj: date });
            const dayData = dailyMap.get(dateKey);
            const status = parseString(order.status).toLowerCase();
            if (status.includes('delivered')) dayData.Delivered++;
            else if (status.includes('return') || status.includes('rto')) dayData.Return++;
        }
    });
    return Array.from(dailyMap.values())
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
        .map(data => ({
            name: data.dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).replace(/ /g, '-'),
            value: data.Delivered, Delivered: data.Delivered, Return: data.Return,
        }));
}
// --- Inlined dataProcessor.ts content ends here ---

self.onerror = function(message, source, lineno, colno, error) {
  const errorMessage = error ? error.stack : \`Error: \${message} at \${source}:\${lineno}\`;
  self.postMessage({ type: 'error', message: \`Unhandled Worker Error: \${errorMessage}\` });
  return true;
};

importScripts('https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js');

const fileConfigs = {
  payments: { 
    sheetName: "Order Payments", 
    range: 3, 
    parser: (row) => ({ orderId: parseString(row[0]), orderDate: parseDate(row[1]), sku: parseString(row[4]), status: parseString(row[5]), finalPayment: parseNumber(row[11]), claimAmount: parseNumber(row[36]), returnCost: parseNumber(row[25]), }) 
  },
  orders: { 
    sheetName: null, 
    range: 1, // Data starts row 2, header on row 1
    parser: (row) => ({ 
        status: parseString(row[0]),     // Col A
        orderId: parseString(row[1]),    // Col B is Sub Order No
        state: parseString(row[3]),      // Col D
        sku: parseString(row[5]),        // Col F
        size: parseString(row[6]),       // Col G
    }) 
  },
  returns: { 
    sheetName: null, 
    range: 8, // Header on row 8, data starts on row 9
    parser: (row) => ({ 
        sku: parseString(row[2]),         // Col C
        size: parseString(row[3]),        // Col D ('Variation')
        category: parseString(row[5]),    // Col F
        orderId: parseString(row[8]),     // Col I ('Suborder Number')
        returnType: parseString(row[11]), // Col L
        returnReason: parseString(row[19]),// Col T
        subReason: parseString(row[20]),  // Col U
    }) 
  }
};

const normalizeHeader = (text) => String(text || '').replace(/\\s+/g, '').toLowerCase();

self.onmessage = (event) => {
    try {
        const { newFile, existingFilesData, skuPrices } = event.data;
        const { file, type: fileType } = newFile;

        self.postMessage({ type: 'progress', progress: 10, message: 'Reading file...' });
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target.result;
                self.postMessage({ type: 'progress', progress: 30, message: 'Parsing workbook...' });
                
                if (!self.XLSX) throw new Error('SheetJS library failed to load.');
                const workbook = self.XLSX.read(data, { type: 'array', cellDates: false, raw: true });
                
                const config = fileConfigs[fileType];
                let sheet;
                let dataStartRow = config.range;

                if (fileType === 'orders' || fileType === 'returns') {
                    const validations = {
                        orders: (headers) => {
                            const h = headers.map(normalizeHeader);
                            return h[1]?.includes('suborderno') && h[5]?.includes('sku');
                        },
                        returns: (headers) => {
                            const h = headers.map(normalizeHeader);
                            // Check for 'SKU' (Col C) and 'Suborder Number' (Col I)
                            return h[2]?.includes('sku') && h[8]?.includes('subordernumber');
                        }
                    };

                    const validateRow = validations[fileType];
                    
                    sheetSearch:
                    for (const sName of workbook.SheetNames) {
                        const currentSheet = workbook.Sheets[sName];
                        if (!currentSheet || !currentSheet['!ref']) continue;

                        const MAX_HEADER_ROW_SCAN = 10;
                        const sheetRange = self.XLSX.utils.decode_range(currentSheet['!ref']);

                        for (let i = 0; i < MAX_HEADER_ROW_SCAN && i <= sheetRange.e.r; i++) {
                            try {
                                const headers = (self.XLSX.utils.sheet_to_json(currentSheet, {
                                    header: 1,
                                    range: i,
                                    defval: ""
                                })[0] || []);
                                
                                if (headers.length > 5 && validateRow(headers)) {
                                    sheet = currentSheet;
                                    dataStartRow = i + 1;
                                    break sheetSearch;
                                }
                            } catch (e) {
                                // console.warn is not available, so just ignore
                            }
                        }
                    }
                } else if (fileType === 'payments') {
                    const foundSheetName = workbook.SheetNames.find(name => name.trim() === config.sheetName);
                    if (foundSheetName) {
                        sheet = workbook.Sheets[foundSheetName];
                    }
                }
                
                if (!sheet) {
                    let errorHint = "Please ensure the file contains a sheet with the correct headers.";
                    if (fileType === 'orders') {
                        errorHint = "Please ensure the file contains a sheet with 'Sub Order No' in column B and 'SKU' in column F in the header row.";
                    } else if (fileType === 'returns') {
                         errorHint = "Please ensure the file contains a sheet with 'SKU' in column C and 'Suborder Number' in column I in the header row.";
                    } else if (fileType === 'payments') {
                         errorHint = \`Please ensure the file contains a sheet named exactly '\${config.sheetName}'.\`;
                    }
                    throw new Error(\`Could not find a valid sheet in \${file.name}. \${errorHint}\`);
                }

                const jsonData = self.XLSX.utils.sheet_to_json(sheet, { header: 1, range: dataStartRow, defval: "" });
                const parsedData = jsonData.map(config.parser).filter(d => d.orderId || d.sku);
                
                let adsCost = 0;
                if (fileType === 'payments') {
                    const adsSheetName = workbook.SheetNames.find(name => name.trim().toLowerCase() === "ads cost");
                    if (adsSheetName) {
                        const adsSheet = workbook.Sheets[adsSheetName];
                        adsCost = self.XLSX.utils.sheet_to_json(adsSheet, { header: 1, range: 3, defval: "" }).reduce((acc, row) => acc + (parseNumber(row[7]) || 0), 0);
                    }
                }
                
                self.postMessage({ type: 'progress', progress: 60, message: 'Merging data...' });
                const updatedFilesData = { ...existingFilesData, [fileType]: parsedData };
                if (adsCost > 0 || updatedFilesData.adsCost) {
                    updatedFilesData.adsCost = (existingFilesData.adsCost || 0) + adsCost;
                }

                self.postMessage({ type: 'progress', progress: 75, message: 'Calculating analytics...' });
                const { allDashboardData, filterContext } = runFullAnalysis(updatedFilesData, skuPrices);
              
                self.postMessage({ 
                    type: 'done',
                    payload: { allDashboardData, filterContext, newFilesData: updatedFilesData }
                });

            } catch (err) {
                self.postMessage({ type: 'error', message: err.message });
            }
        };
        reader.onerror = () => self.postMessage({ type: 'error', message: 'Error reading file in worker.' });
        reader.readAsArrayBuffer(file);
    } catch(e) {
        self.postMessage({ type: 'error', message: \`Critical worker error: \${e.message}\` });
    }
};
`