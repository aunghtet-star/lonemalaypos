import React from 'react';
import { MenuItem } from '../types';

interface MenuManagerProps {
  menu: MenuItem[];
  setMenu: (menu: MenuItem[]) => void;
}

const MenuManager: React.FC<MenuManagerProps> = ({ menu, setMenu }) => {
  
  const handleAddItem = () => {
    // Simple prompt for the family restaurant user
    const name = prompt("Enter Dish Name:");
    if (!name) return;
    
    const priceStr = prompt("Enter Price (Ks):", "5000");
    const price = parseFloat(priceStr || "0");
    if (isNaN(price)) return;

    const category = prompt("Enter Category (e.g., Food, Drinks):", "Food") || "Food";

    const newItem: MenuItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      category,
      price,
      cost: price * 0.3, // Assume 30% cost estimate
      image: '', // No longer used in UI
      description: 'Freshly prepared house special.',
      ingredients: []
    };

    setMenu([...menu, newItem]);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this item?")) {
      setMenu(menu.filter(m => m.id !== id));
    }
  };

  // Helper for category icons
  const getCategoryIcon = (category: string) => {
    if (category.toLowerCase().includes('drink') || category.toLowerCase().includes('coffee')) return 'bi-cup-hot';
    if (category.toLowerCase().includes('burger') || category.toLowerCase().includes('food')) return 'bi-egg-fried';
    if (category.toLowerCase().includes('salad') || category.toLowerCase().includes('veg')) return 'bi-flower1';
    return 'bi-basket';
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-gray-50 pb-20 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Menu Management</h2>
          <p className="text-gray-500 text-sm">Add or remove dishes from your menu</p>
        </div>
        <button 
          onClick={handleAddItem}
          className="w-full md:w-auto px-6 py-3 bg-secondary text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-secondary/20 flex items-center justify-center gap-2 active:scale-95 transform"
        >
          <i className="bi bi-plus-circle-fill text-lg"></i> 
          Add New Dish
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {menu.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col group hover:shadow-md transition-all">
             <div className="relative h-48 overflow-hidden bg-slate-50 flex items-center justify-center">
               {/* Replaced Image with Icon */}
               <i className={`bi ${getCategoryIcon(item.category)} text-6xl text-slate-300 group-hover:scale-105 group-hover:text-secondary/50 transition-all duration-500`}></i>
               
               <div className="absolute top-3 right-3 flex gap-2">
                 <button 
                  onClick={() => handleDelete(item.id)}
                  className="w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow-sm text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                  title="Remove Item"
                 >
                   <i className="bi bi-trash"></i>
                 </button>
               </div>
             </div>
             <div className="p-5 flex-1 flex flex-col">
               <div className="flex justify-between items-start mb-2">
                 <h3 className="font-bold text-lg text-gray-900 leading-tight">{item.name}</h3>
                 <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-bold whitespace-nowrap">{item.price.toLocaleString()} Ks</span>
               </div>
               <div className="flex items-center gap-2 mb-3">
                 <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">{item.category}</span>
               </div>
               <p className="text-gray-500 text-sm mb-4 line-clamp-2">{item.description}</p>
               
               <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-400">
                 <span>Est. Cost: {item.cost.toLocaleString()} Ks</span>
               </div>
             </div>
          </div>
        ))}
        
        {/* Empty State / Add Button */}
        <button 
          onClick={handleAddItem}
          className="rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-secondary hover:text-secondary hover:bg-secondary/5 transition-all min-h-[300px]"
        >
          <i className="bi bi-plus-circle text-4xl mb-2"></i>
          <span className="font-medium">Add New Dish</span>
        </button>
      </div>
    </div>
  );
};

export default MenuManager;