import React, { useState, useMemo, useEffect } from 'react';
import { Order, MenuItem } from '../types';
import { fetchOrdersWithItems } from '../services/supabaseClient';

interface OrderHistoryProps {
  orders: Order[];
  menu: MenuItem[];
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders, menu }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dbOrders, setDbOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} Ks`;

  // Fetch orders from database on component mount
  useEffect(() => {
    const loadOrdersFromDatabase = async () => {
      setLoading(true);
      try {
        const remoteOrders = await fetchOrdersWithItems(100); // Fetch last 100 orders with items
        const formattedOrders: Order[] = remoteOrders.map((o: any) => ({
          id: o.id,
          items: (o.items || []).map((item: any) => {
            // Find the menu item to get name and category
            const menuItem = menu.find(m => m.id === item.menu_item_id);
            return {
              id: item.menu_item_id,
              name: menuItem?.name || 'Unknown Item',
              category: menuItem?.category || 'Unknown',
              price: item.price_each,
              cost: menuItem?.cost || 0,
              image: menuItem?.image || '',
              quantity: item.quantity,
              ingredients: menuItem?.ingredients || [],
              isReadyMade: menuItem?.isReadyMade || false,
              readyMadeStockId: menuItem?.readyMadeStockId || undefined
            };
          }),
          subtotal: o.subtotal,
          tax: o.tax,
          discount: o.discount,
          total: o.total,
          paymentMethod: o.payment_method,
          status: o.status,
          createdAt: o.created_at,
          cashierName: o.cashier_name
        }));
        setDbOrders(formattedOrders);
      } catch (error) {
        console.error('Failed to load orders from database:', error);
        // Fall back to local orders if database fails
        setDbOrders(orders);
      } finally {
        setLoading(false);
      }
    };

    loadOrdersFromDatabase();
  }, [orders]);

  // Use database orders if available, otherwise use local orders
  const allOrders = dbOrders.length > 0 ? dbOrders : orders;

  const filteredOrders = useMemo(() => {
    return allOrders.filter(o =>
      o.id.includes(searchTerm) ||
      o.cashierName.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allOrders, searchTerm]);

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 pb-20 md:pb-8">
       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
         <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Order History</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              View and manage past transactions
              {dbOrders.length > 0 && <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">Database Connected</span>}
              {loading && <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">Loading...</span>}
            </p>
         </div>
         <div className="flex gap-3">
           <button
             onClick={() => window.location.reload()}
             className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium flex items-center gap-2"
             title="Refresh orders from database"
           >
             <i className="bi bi-arrow-clockwise"></i>
             Refresh
           </button>
           <div className="relative w-full md:w-64">
              <i className="bi bi-search absolute left-3 top-2.5 text-gray-400 dark:text-gray-500"></i>
              <input
                type="text"
                placeholder="Search Order ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
           </div>
         </div>
       </div>

       {/* Table */}
       <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
         <div className="overflow-x-auto">
           <table className="w-full text-left">
             <thead className="bg-gray-50 dark:bg-gray-700/40 border-b border-gray-200 dark:border-gray-600">
               <tr>
                 <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Order ID</th>
                 <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Date</th>
                 <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Cashier</th>
                 <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Total</th>
                 <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Method</th>
                 <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm text-right">Action</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
               {filteredOrders.map(order => (
                 <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                   <td className="px-6 py-4 font-mono text-sm font-medium text-primary">#{order.id}</td>
                   <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                     {new Date(order.createdAt).toLocaleDateString()} <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                   </td>
                   <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">{order.cashierName}</td>
                   <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(order.total)}</td>
                   <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${order.paymentMethod === 'CASH' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}`}>
                        {order.paymentMethod.replace('_', ' ')}
                      </span>
                   </td>
                   <td className="px-6 py-4 text-right">
                     <button onClick={() => setSelectedOrder(order)} className="text-gray-400 dark:text-gray-500 hover:text-primary transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                       <i className="bi bi-eye-fill text-lg"></i>
                     </button>
                   </td>
                 </tr>
               ))}
               {filteredOrders.length === 0 && (
                 <tr><td colSpan={6} className="text-center py-8 text-gray-400 dark:text-gray-500">No orders found matching your search.</td></tr>
               )}
             </tbody>
           </table>
         </div>
       </div>

       {/* Order Details Modal */}
       {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
             <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
               <div className="p-4 bg-gray-50 dark:bg-gray-700/40 border-b border-gray-100 dark:border-gray-600 flex justify-between items-center shrink-0">
                 <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Order #{selectedOrder.id}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                 </div>
                 <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 transition-colors"><i className="bi bi-x-lg"></i></button>
               </div>
               
               <div className="p-6 overflow-y-auto">
                  <div className="text-center mb-8 p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-100 dark:border-gray-600">
                    <p className="text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide font-bold">Total Paid</p>
                    <h2 className="text-4xl font-black text-gray-900 dark:text-gray-100 mt-1 tracking-tight">{formatCurrency(selectedOrder.total)}</h2>
                    <div className="flex justify-center gap-2 mt-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${selectedOrder.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                            <span className={`w-2 h-2 rounded-full ${selectedOrder.status === 'COMPLETED' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            {selectedOrder.status}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                             <i className={selectedOrder.paymentMethod === 'CASH' ? 'bi bi-cash' : 'bi bi-phone'}></i>
                             {selectedOrder.paymentMethod.replace('_', ' ')}
                        </span>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Order Items</h4>
                  <div className="space-y-1 mb-8">
                     {selectedOrder.items.map((item, i) => (
                       <div key={i} className="flex flex-col py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/40 -mx-2 px-2 rounded-lg transition-colors">
                         <div className="flex justify-between items-start">
                             <div className="flex gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-sm shadow-sm border border-indigo-100 dark:border-indigo-700">
                                    {item.quantity}x
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-tight">{item.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.category} • @{formatCurrency(item.price)}</p>
                                    {item.notes && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded border border-amber-100 dark:border-amber-700 w-fit">
                                            <i className="bi bi-sticky"></i> {item.notes}
                                        </p>
                                    )}
                                </div>
                             </div>
                             <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{formatCurrency(item.price * item.quantity)}</p>
                         </div>
                       </div>
                     ))}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-dashed border-gray-200 dark:border-gray-600 text-sm">
                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                        <span>Subtotal</span>
                        <span className="font-mono">{formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                        <div className="flex justify-between text-secondary font-bold">
                            <span>Discount</span>
                            <span className="font-mono">-{formatCurrency(selectedOrder.discount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                        <span>Tax</span>
                        <span className="font-mono">{formatCurrency(selectedOrder.tax)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                         <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                                 <i className="bi bi-person-fill"></i>
                             </div>
                             <span>Cashier: <span className="text-gray-600 dark:text-gray-300 font-medium">{selectedOrder.cashierName}</span></span>
                         </div>
                         <span className="font-mono">ID: {selectedOrder.id}</span>
                      </div>
                  </div>
               </div>
               
               <div className="p-4 bg-gray-50 dark:bg-gray-700/40 border-t border-gray-100 dark:border-gray-600 shrink-0">
                  <button onClick={() => setSelectedOrder(null)} className="w-full py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                    Close Details
                  </button>
               </div>
             </div>
          </div>
       )}
    </div>
  );
};
export default OrderHistory;