import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Order } from '../types';

interface DashboardProps {
  orders: Order[];
}

const Dashboard: React.FC<DashboardProps> = ({ orders }) => {
  const [filterType, setFilterType] = useState<'today' | 'week' | 'month' | 'all' | 'custom'>('today');

  // Helper to get date ranges
  const getDateRange = (type: typeof filterType) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    switch (type) {
      case 'today':
        return { start: todayStr, end: todayStr };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        return { start: weekStart.toISOString().split('T')[0], end: todayStr };
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: monthStart.toISOString().split('T')[0], end: todayStr };
      case 'all':
        return { start: '2020-01-01', end: todayStr };
      default:
        return { start: todayStr, end: todayStr };
    }
  };

  // Default to today (daily filter)
  const [dateRange, setDateRange] = useState(getDateRange('today'));

  const handleFilterChange = (type: typeof filterType) => {
    setFilterType(type);
    if (type !== 'custom') {
      setDateRange(getDateRange(type));
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
      return orderDate >= dateRange.start && orderDate <= dateRange.end;
    });
  }, [orders, dateRange]);

  // Aggregate sales by date based on filtered orders
  const salesData = useMemo(() => {
    const data = filteredOrders.reduce((acc: any[], order) => {
      let key: string;
      const orderDate = new Date(order.createdAt);

      // Group by hour if today, by date otherwise
      if (filterType === 'today') {
        const hour = orderDate.getHours();
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        key = `${displayHour}:00 ${ampm}`;
      } else {
        key = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      const existing = acc.find(a => a.name === key);
      const profit = order.total - (order.subtotal * 0.4); // Mock cost calculation (40% cost)

      if (existing) {
        existing.sales += order.total;
        existing.profit += profit;
      } else {
        acc.push({
          name: key,
          sales: order.total,
          profit: profit,
          sortKey: filterType === 'today' ? orderDate.getHours() : orderDate.getTime()
        });
      }
      return acc;
    }, []);

    // Sort by time
    return data.sort((a, b) => a.sortKey - b.sortKey);
  }, [filteredOrders, filterType]);

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Color mapping for categories - Food (orange) and Drink (blue)
  const getCategoryColor = (categoryName: string) => {
    const lowerName = categoryName.toLowerCase();
    if (lowerName.includes('food')) return '#FF8042'; // Orange for Food
    if (lowerName.includes('drink')) return '#0088FE'; // Blue for Drink
    // Fallback colors for other categories
    return '#00C49F'; // Green for others
  };

  const formatCurrency = (val: number) => `${val.toLocaleString()} Ks`;

  // Aggregate Category Data
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    filteredOrders.forEach(order => {
        order.items.forEach(item => {
            categories[item.category] = (categories[item.category] || 0) + (item.price * item.quantity);
        });
    });
    return Object.keys(categories).map(key => ({ name: key, value: categories[key] }));
  }, [filteredOrders]);

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto pb-20 md:pb-8">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
             <h2 className="text-2xl font-bold text-gray-800">Business Overview</h2>
             <p className="text-gray-500 text-sm">Performance metrics and insights</p>
          </div>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleFilterChange('today')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filterType === 'today'
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
              }`}
            >
              <i className="bi bi-calendar-day mr-1.5"></i>
              Today
            </button>
            <button
              onClick={() => handleFilterChange('week')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filterType === 'week'
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
              }`}
            >
              <i className="bi bi-calendar-week mr-1.5"></i>
              This Week
            </button>
            <button
              onClick={() => handleFilterChange('month')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filterType === 'month'
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
              }`}
            >
              <i className="bi bi-calendar-month mr-1.5"></i>
              This Month
            </button>
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filterType === 'all'
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
              }`}
            >
              <i className="bi bi-infinity mr-1.5"></i>
              All Time
            </button>
          </div>

          {/* Custom Date Range */}
          <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center gap-2">
             <div className="flex items-center gap-2 px-2">
               <i className="bi bi-calendar3 text-gray-400"></i>
               <span className="text-sm font-semibold text-gray-600">Custom:</span>
             </div>
             <div className="flex items-center gap-2">
               <input
                 type="date"
                 value={dateRange.start}
                 onChange={(e) => {
                   setDateRange(prev => ({...prev, start: e.target.value}));
                   setFilterType('custom');
                 }}
                 className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-600 focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none"
               />
               <span className="text-gray-400 font-medium">-</span>
               <input
                 type="date"
                 value={dateRange.end}
                 onChange={(e) => {
                   setDateRange(prev => ({...prev, end: e.target.value}));
                   setFilterType('custom');
                 }}
                 className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-600 focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none"
               />
             </div>
          </div>
        </div>

        {/* Period Display */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <i className="bi bi-info-circle"></i>
          <span>
            Showing data from <strong>{new Date(dateRange.start).toLocaleDateString()}</strong> to <strong>{new Date(dateRange.end).toLocaleDateString()}</strong>
            {filterType === 'today' && ' (hourly breakdown)'}
          </span>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalRevenue)}</h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <i className="bi bi-currency-dollar text-xl"></i>
            </div>
          </div>
          <p className="text-gray-400 text-xs font-medium flex items-center">
            For selected period
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Orders</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalOrders}</h3>
            </div>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <i className="bi bi-bag-check text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 text-sm font-medium">Avg Order Value</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(avgOrderValue)}</h3>
            </div>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <i className="bi bi-graph-up text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 text-sm font-medium">Net Profit (Est.)</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalRevenue * 0.6)}</h3>
            </div>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <i className="bi bi-wallet2 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 md:h-96">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Revenue Trends</h3>
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000}k`} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  formatter={(value: number) => [`${value.toLocaleString()} Ks`, 'Amount']}
                />
                <Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Sales" />
                <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-300">
               <i className="bi bi-bar-chart text-4xl mb-2"></i>
               <p>No data for selected period</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 md:h-96">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Sales by Category</h3>
          {categoryData.length > 0 ? (
            <div className="flex flex-col h-full">
              <ResponsiveContainer width="100%" height="75%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value.toLocaleString()} Ks`, 'Sales']} />
                </PieChart>
              </ResponsiveContainer>

              {/* Custom Legend */}
              <div className="flex justify-center gap-6 mt-4 flex-wrap">
                {categoryData.map((entry, index) => (
                  <div key={`legend-${index}`} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getCategoryColor(entry.name) }}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">
                      {entry.name}: <strong>{((entry.value / totalRevenue) * 100).toFixed(1)}%</strong>
                    </span>
                    <span className="text-xs text-gray-500">
                      ({entry.value.toLocaleString()} Ks)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
             <div className="h-full flex flex-col items-center justify-center text-gray-300">
               <i className="bi bi-pie-chart text-4xl mb-2"></i>
               <p>No data for selected period</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;