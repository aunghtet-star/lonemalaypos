import React, { useState, useMemo } from 'react';
import { Order } from '../types';

interface OrderHistoryProps {
  orders: Order[];
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} Ks`;

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.id.includes(searchTerm) || 
      o.cashierName.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, searchTerm]);

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-gray-50 pb-20 md:pb-8">
       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
         <div>
            <h2 className="text-2xl font-bold text-gray-800">Order History</h2>
            <p className="text-gray-500 text-sm">View and manage past transactions</p>
         </div>
         <div className="relative w-full md:w-64">
            <i className="bi bi-search absolute left-3 top-2.5 text-gray-400"></i>
            <input 
              type="text" 
              placeholder="Search Order ID..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
         </div>
       </div>

       {/* Table */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="overflow-x-auto">
           <table className="w-full text-left">
             <thead className="bg-gray-50 border-b border-gray-200">
               <tr>
                 <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Order ID</th>
                 <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Date</th>
                 <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Cashier</th>
                 <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Total</th>
                 <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Method</th>
                 <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Action</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {filteredOrders.map(order => (
                 <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                   <td className="px-6 py-4 font-mono text-sm font-medium text-primary">#{order.id}</td>
                   <td className="px-6 py-4 text-sm text-gray-600">
                     {new Date(order.createdAt).toLocaleDateString()} <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                   </td>
                   <td className="px-6 py-4 text-sm text-gray-800">{order.cashierName}</td>
                   <td className="px-6 py-4 text-sm font-bold text-gray-900">{formatCurrency(order.total)}</td>
                   <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${order.paymentMethod === 'CASH' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {order.paymentMethod.replace('_', ' ')}
                      </span>
                   </td>
                   <td className="px-6 py-4 text-right">
                     <button onClick={() => setSelectedOrder(order)} className="text-gray-400 hover:text-primary transition-colors p-2 hover:bg-gray-100 rounded-lg">
                       <i className="bi bi-eye-fill text-lg"></i>
                     </button>
                   </td>
                 </tr>
               ))}
               {filteredOrders.length === 0 && (
                 <tr><td colSpan={6} className="text-center py-8 text-gray-400">No orders found matching your search.</td></tr>
               )}
             </tbody>
           </table>
         </div>
       </div>

       {/* Order Details Modal */}
       {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
             <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
               <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0">
                 <div>
                    <h3 className="font-bold text-gray-800 text-lg">Order #{selectedOrder.id}</h3>
                    <p className="text-xs text-gray-500">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                 </div>
                 <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition-colors"><i className="bi bi-x-lg"></i></button>
               </div>
               
               <div className="p-6 overflow-y-auto">
                  <div className="text-center mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-gray-400 text-xs uppercase tracking-wide font-bold">Total Paid</p>
                    <h2 className="text-4xl font-black text-gray-900 mt-1 tracking-tight">{formatCurrency(selectedOrder.total)}</h2>
                    <div className="flex justify-center gap-2 mt-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${selectedOrder.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            <span className={`w-2 h-2 rounded-full ${selectedOrder.status === 'COMPLETED' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            {selectedOrder.status}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                             <i className={selectedOrder.paymentMethod === 'CASH' ? 'bi bi-cash' : 'bi bi-phone'}></i>
                             {selectedOrder.paymentMethod.replace('_', ' ')}
                        </span>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Order Items</h4>
                  <div className="space-y-1 mb-8">
                     {selectedOrder.items.map((item, i) => (
                       <div key={i} className="flex flex-col py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                         <div className="flex justify-between items-start">
                             <div className="flex gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shadow-sm border border-indigo-100">
                                    {item.quantity}x
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm leading-tight">{item.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{item.category} • @{formatCurrency(item.price)}</p>
                                    {item.notes && (
                                        <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded border border-amber-100 w-fit">
                                            <i className="bi bi-sticky"></i> {item.notes}
                                        </p>
                                    )}
                                </div>
                             </div>
                             <p className="font-bold text-gray-900 text-sm">{formatCurrency(item.price * item.quantity)}</p>
                         </div>
                       </div>
                     ))}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-dashed border-gray-200 text-sm">
                    <div className="flex justify-between text-gray-500">
                        <span>Subtotal</span>
                        <span className="font-mono">{formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                        <div className="flex justify-between text-secondary font-bold">
                            <span>Discount</span>
                            <span className="font-mono">-{formatCurrency(selectedOrder.discount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-gray-500">
                        <span>Tax</span>
                        <span className="font-mono">{formatCurrency(selectedOrder.tax)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                         <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                 <i className="bi bi-person-fill"></i>
                             </div>
                             <span>Cashier: <span className="text-gray-600 font-medium">{selectedOrder.cashierName}</span></span>
                         </div>
                         <span className="font-mono">ID: {selectedOrder.id}</span>
                      </div>
                  </div>
               </div>
               
               <div className="p-4 bg-gray-50 border-t border-gray-100 shrink-0">
                  <button onClick={() => setSelectedOrder(null)} className="w-full py-3 bg-white border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
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