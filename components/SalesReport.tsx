import React, { useMemo, useState } from 'react';
import { Order, MenuItem } from '../types';

interface SalesReportProps {
  orders: Order[];
  menu: MenuItem[];
}

interface ItemSalesData {
  id: string;
  name: string;
  category: string;
  totalQuantity: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  grade: string;
  gradeColor: string;
}

const SalesReport: React.FC<SalesReportProps> = ({ orders, menu }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'curry'>('all');

  const salesData = useMemo(() => {
    // Aggregate sales by item
    const itemSales = new Map<string, {
      name: string;
      category: string;
      quantity: number;
      revenue: number;
      cost: number;
    }>();

    orders.forEach(order => {
      order.items.forEach(item => {
        const existing = itemSales.get(item.id);
        const menuItem = menu.find(m => m.id === item.id);
        const itemCost = menuItem?.cost || 0;

        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.price * item.quantity;
          existing.cost += itemCost * item.quantity;
        } else {
          itemSales.set(item.id, {
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            revenue: item.price * item.quantity,
            cost: itemCost * item.quantity
          });
        }
      });
    });

    // Convert to array and calculate metrics
    const salesArray: ItemSalesData[] = Array.from(itemSales.entries()).map(([id, data]) => {
      const grossProfit = data.revenue - data.cost;
      const profitMargin = data.revenue > 0 ? (grossProfit / data.revenue) * 100 : 0;

      return {
        id,
        name: data.name,
        category: data.category,
        totalQuantity: data.quantity,
        totalRevenue: data.revenue,
        totalCost: data.cost,
        grossProfit,
        profitMargin,
        grade: '',
        gradeColor: ''
      };
    });

    // Sort by quantity sold
    salesArray.sort((a, b) => b.totalQuantity - a.totalQuantity);

    // Assign grades based on sales performance
    const maxQuantity = salesArray[0]?.totalQuantity || 1;
    salesArray.forEach(item => {
      const performanceRatio = item.totalQuantity / maxQuantity;

      if (performanceRatio >= 0.8) {
        item.grade = 'A+';
        item.gradeColor = 'text-green-600 bg-green-50 border-green-300';
      } else if (performanceRatio >= 0.6) {
        item.grade = 'A';
        item.gradeColor = 'text-blue-600 bg-blue-50 border-blue-300';
      } else if (performanceRatio >= 0.4) {
        item.grade = 'B';
        item.gradeColor = 'text-yellow-600 bg-yellow-50 border-yellow-300';
      } else if (performanceRatio >= 0.2) {
        item.grade = 'C';
        item.gradeColor = 'text-orange-600 bg-orange-50 border-orange-300';
      } else {
        item.grade = 'D';
        item.gradeColor = 'text-red-600 bg-red-50 border-red-300';
      }
    });

    return salesArray;
  }, [orders, menu]);

  // Filter curry items specifically
  const curryItems = useMemo(() =>
    salesData.filter(item =>
      item.category.includes('ဟင်းရည်') ||
      item.category.toLowerCase().includes('curry') ||
      item.name.toLowerCase().includes('curry')
    ), [salesData]
  );

  // Use appropriate data based on active tab
  const displayData = activeTab === 'curry' ? curryItems : salesData;

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} Ks`;
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const totalRevenue = displayData.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalProfit = displayData.reduce((sum, item) => sum + item.grossProfit, 0);
  const totalCost = displayData.reduce((sum, item) => sum + item.totalCost, 0);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
          <i className="bi bi-graph-up-arrow text-primary"></i>
          Sales Performance Report
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Ranked analysis with performance grading (A+ to D)
        </p>
      </div>

      {/* Summary Cards */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalRevenue)}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Cost</div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(totalCost)}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Gross Profit</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalProfit)}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Profit Margin</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatPercent(totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 border-b-2 font-semibold transition-colors ${
              activeTab === 'all' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            All Items ({salesData.length})
          </button>
          <button
            onClick={() => setActiveTab('curry')}
            className={`px-4 py-2 border-b-2 font-semibold transition-colors ${
              activeTab === 'curry' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Curry Only ({curryItems.length})
          </button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/40 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Rank</th>
                <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Grade</th>
                <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Item Name</th>
                <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Category</th>
                <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Qty Sold</th>
                <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Revenue</th>
                <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Cost</th>
                <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Profit</th>
                <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Margin</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                  <td className="p-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-orange-300 text-orange-900' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${item.gradeColor}`}> {item.grade} </span>
                  </td>
                  <td className="p-4 font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
                  <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{item.category}</td>
                  <td className="p-4 text-right font-semibold text-gray-900 dark:text-gray-100">{item.totalQuantity}</td>
                  <td className="p-4 text-right text-gray-900 dark:text-gray-100">{formatCurrency(item.totalRevenue)}</td>
                  <td className="p-4 text-right text-orange-600 dark:text-orange-400">{formatCurrency(item.totalCost)}</td>
                  <td className="p-4 text-right font-semibold text-green-600 dark:text-green-400">{formatCurrency(item.grossProfit)}</td>
                  <td className="p-4 text-right text-blue-600 dark:text-blue-400">{formatPercent(item.profitMargin)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {displayData.length === 0 && (
            <div className="p-12 text-center text-gray-400 dark:text-gray-500">
              <i className="bi bi-inbox text-5xl mb-3 block"></i>
              <p>No sales data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesReport;

