import React from 'react';
import { Ingredient } from '../types';

interface InventoryProps {
  ingredients: Ingredient[];
  onUpdateStock: (id: string, amount: number) => void;
}

const Inventory: React.FC<InventoryProps> = ({ ingredients, onUpdateStock }) => {
  
  const handleRestock = (id: string) => {
    // Quick restock action
    const amountStr = prompt("How much stock to add?", "10");
    const amount = parseFloat(amountStr || "0");
    if (amount > 0) {
      onUpdateStock(id, amount);
    }
  };

  const handleAddNew = () => {
    alert("To add new ingredients, please contact your administrator or use the database tool. (Demo Mode)");
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-gray-50 pb-20 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inventory</h2>
          <p className="text-gray-500 text-sm">Track ingredients and supplies</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="w-full md:w-auto px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center"
        >
          <i className="bi bi-gear mr-2"></i> Manage Items
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Item Name</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Stock Level</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Unit</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Cost/Unit</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ingredients.map(ing => {
                const isLow = ing.stock <= ing.minStockLevel;
                return (
                  <tr key={ing.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-800 font-medium">{ing.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono ${isLow ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                          {ing.stock.toLocaleString()}
                        </span>
                        {isLow && (
                           <div className="relative flex h-2 w-2" title="Critical Stock Warning">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                           </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{ing.unit}</td>
                    <td className="px-6 py-4">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                          Good
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{ing.costPerUnit.toLocaleString()} Ks</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleRestock(ing.id)}
                        className="inline-flex items-center justify-center px-3 py-1.5 border border-primary text-primary hover:bg-primary hover:text-white rounded text-sm font-medium transition-all active:scale-95"
                      >
                        <i className="bi bi-plus-lg mr-1"></i> Add
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;