import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Order } from '../types';

interface DashboardProps {
  orders: Order[];
}

const Dashboard: React.FC<DashboardProps> = ({ orders }) => {
  // Default to current month
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
      return orderDate >= dateRange.start && orderDate <= dateRange.end;
    });
  }, [orders, dateRange]);

  // Aggregate sales by date based on filtered orders
  const salesData = filteredOrders.reduce((acc: any[], order) => {
    const date = new Date(order.createdAt).toLocaleDateString();
    const existing = acc.find(a => a.name === date);
    if (existing) {
      existing.sales += order.total;
      existing.profit += (order.total - (order.subtotal * 0.4)); // Mock cost calculation (40% cost)
    } else {
      acc.push({ name: date, sales: order.total, profit: order.total - (order.subtotal * 0.4) });
    }
    return acc;
  }, []);

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Business Overview</h2>
           <p className="text-gray-500 text-sm">Performance metrics and insights</p>
        </div>
        
        <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center gap-2">
           <div className="flex items-center gap-2 px-2">
             <i className="bi bi-calendar3 text-gray-400"></i>
             <span className="text-sm font-semibold text-gray-600">Period:</span>
           </div>
           <div className="flex items-center gap-2">
             <input 
               type="date" 
               value={dateRange.start} 
               onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))} 
               className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-600 focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none" 
             />
             <span className="text-gray-400 font-medium">-</span>
             <input 
               type="date" 
               value={dateRange.end} 
               onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))} 
               className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-600 focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none" 
             />
           </div>
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
            <ResponsiveContainer width="100%" height="100%">
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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value.toLocaleString()} Ks`, 'Sales']} />
              </PieChart>
            </ResponsiveContainer>
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