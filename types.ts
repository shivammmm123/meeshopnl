



export interface SkuPrices {
  skuCosts: { [key: string]: number };
  skuPackagingCosts: { [key: string]: number };
  externalMarketingCost: number;
}

export interface FilterState {
  dateRange: { start: string; end: string; };
  orderStatuses: string[];
  selectedSkus: string[];
  selectedStates: string[];
  selectedReasons: string[];
  keyword: string;
  calculateTrend?: boolean;
}

export interface SmartAlert {
  id: string;
  level: 'warning' | 'info';
  message: string;
  sku?: string;
  onClick?: (sku: string) => void;
}

export interface AlertData {
  id: string;
  level: 'info' | 'warning' | 'success' | 'danger';
  title: string;
  value: string | number;
  description: string;
  icon: string;
}

export interface KpiData {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
      change: number; // e.g., 15 for 15%
      direction: 'up' | 'down' | 'neutral';
  }
}

export interface NameValueData {
  name: string;
  value: number;
  [key: string]: any; // Allow for other properties like fill, etc.
}

export interface StateDistributionData {
  state: string;
  count: number;
}

export interface UnitEconomicsData {
  settlementAmt: string;
  productCost: string;
  packagingCost: string;
  marketingCost: string;
  cogs: string;
  grossProfit: string;
  returnCost: string;
  netProfit: string;
  grossMargin: string;
  netMargin: string;
  netProfitPerUnit: string;
  pricesEntered: boolean;
  // New fields
  invoicePrice: string;
  totalGst: string;
  netProfitWithoutGst: string;
  netProfitPerUnitWithoutGst: string;
  // Fields for table
  claimAmount: string;
  recovery: string;
  tds: string;
  tcs: string;
}

export interface SkuProfitLossData {
    sku: string;
    value: number; // profit or loss amount
    orders: number;
}


// --- NEW DECOUPLED DASHBOARD DATA TYPES ---

export interface PaymentsDashboardData {
  orderOverview: KpiData[];
  earningsOverview: KpiData[];
  unitEconomics: UnitEconomicsData;
  dailyDeliveredVsReturns: NameValueData[];
  deliveredVsRtoPie: NameValueData[];
  deliveredVsReturnPie: NameValueData[];
  topDeliveredSkus: NameValueData[];
  topReturnedSkus: NameValueData[];
  skuProfitData: SkuProfitLossData[];
  skuLossData: SkuProfitLossData[];
  keywordDistribution: NameValueData[];
  netProfit: number;
  alerts: AlertData[];
  smartAlerts: SmartAlert[];
  allPayments: RawPaymentEntry[];
  hasData: boolean;
}

export interface OrdersDashboardData {
  orderOverview: KpiData[];
  orderStatusDistribution: NameValueData[];
  stateDistribution: StateDistributionData[];
  topSkus: NameValueData[];
  allOrders: RawOrderEntry[];
  hasData: boolean;
}

export interface ReturnsDashboardData {
  returnReasons: NameValueData[];
  topReturnedSkus: NameValueData[];
  allReturns: RawReturnEntry[];
  hasData: boolean;
}

export interface SkuDrilldownData {
  sku: string;
  totalSold: number;
  totalDelivered: number;
  totalSettlement: number;
  totalReturns: number;
  totalRTO: number;
  netProfit: number;
  isDataSufficient: boolean;
}

// A single object to hold all dashboard data states
export interface AllDashboardsData {
    payments: PaymentsDashboardData | null;
    orders: OrdersDashboardData | null;
    returns: ReturnsDashboardData | null;
}

/**
 * Data used ONLY for populating the global filters.
 * Contains no calculated metrics.
 */
export interface FilterContextData {
  mergedOrders: MergedOrder[];
  availableSkus: string[];
  availableStates: string[];
  availableReasons: string[];
  availableStatuses: string[];
}

/**
 * Represents a single order after a lightweight merge of all data sources.
 * This is used ONLY for powering the global filters and should not be used for direct calculation.
 */
export interface MergedOrder {
  orderId: string;
  sku: string;
  status: string;
  date: Date | null;
  state?: string;
  returnInfo?: { reason: string; };
}

// Raw data types from uploaded files
export interface RawPaymentEntry {
  orderId: string;
  orderDate: any;
  sku: string;
  status: string;
  finalPayment: string | number;
  claimAmount: string | number;
  returnCost: string | number;
  // New fields
  invoicePrice?: string | number;
  gstRate?: string | number;
  recovery?: string | number;
  tds?: string | number;
  tcs?: string | number;
}

export interface RawOrderEntry {
  status: string;
  orderId: string;
  state: string;
  sku: string;
  size: string;
}

export interface RawReturnEntry {
  sku: string;
  size: string;
  category: string;
  orderId: string;
  returnType: string;
  returnReason: string;
  subReason: string;
}

export interface FilesData {
  payments?: RawPaymentEntry[];
  orders?: RawOrderEntry[];
  returns?: RawReturnEntry[];
  adsCost?: number;
}

export type UploadableFile = 'payments' | 'orders' | 'returns';

export interface WorkerPayload {
    allDashboardData: AllDashboardsData,
    filterContext: FilterContextData,
    newFilesData: FilesData,
}