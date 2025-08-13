

import React from 'react';
import { AlertData, PaymentsDashboardData, OrdersDashboardData, ReturnsDashboardData } from '../types';
import { FileText, BarChart } from 'lucide-react';

interface AlertsProps {
  paymentsData: PaymentsDashboardData | null;
  ordersData: OrdersDashboardData | null;
  returnsData: ReturnsDashboardData | null;
  activeView: 'payments' | 'orders' | 'returns' | 'settings';
}

const levelClasses = {
  info: 'bg-sky-100 text-sky-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
};

const getIcon = (iconName: string): React.ReactNode => {
    switch (iconName) {
        case 'barchart':
            return <BarChart />;
        case 'filetext':
            return <FileText />;
        default:
            return <FileText />;
    }
}

const AlertCard: React.FC<{ alert: AlertData }> = ({ alert }) => {
  const { level, icon, title, value, description } = alert;
  
  return (
    <div className={`flex items-start p-4 rounded-lg ${levelClasses[level]}`}>
      <div className="flex-shrink-0 mr-3 mt-1">
        {getIcon(icon)}
      </div>
      <div className="flex-1">
        <p className="font-bold">{title}</p>
        <p className="text-2xl font-extrabold my-1">{value}</p>
        <p className="text-sm opacity-80">{description}</p>
      </div>
    </div>
  );
};


const Alerts: React.FC<AlertsProps> = ({ paymentsData, activeView }) => {
  let alerts: AlertData[] = [];
  
  if (activeView === 'payments') {
    if (paymentsData && paymentsData.hasData) {
        alerts = paymentsData.alerts;
    } else {
        alerts.push({
            id: 'no_profit',
            level: 'info',
            icon: 'filetext',
            title: 'Upload Payments File',
            value: '',
            description: 'To calculate Net Profit and other financial metrics.'
        });
    }
  }
  // Can add more alerts for other views later
  
  if (alerts.length === 0) {
    return null;
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {alerts.map(alert => <AlertCard key={alert.id} alert={alert} />)}
    </div>
  );
};

export default Alerts;