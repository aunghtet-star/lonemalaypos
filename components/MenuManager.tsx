import React, { useState } from 'react';
import { MenuItem, Ingredient } from '../types';
import { supabase, addMenuItem as remoteAddMenuItem, updateMenuItem as remoteUpdateMenuItem, deleteMenuItem as remoteDeleteMenuItem } from '../services/supabaseClient';

interface MenuManagerProps {
  menu: MenuItem[];
  setMenu: (menu: MenuItem[]) => void;
  inventory?: Ingredient[]; // Added for ready-made linking
}

interface MenuFormData {
  name: string;
  category: string;
  price: string;
  cost: string;
  description: string;
  isReadyMade: boolean;
  readyMadeStockId: string;
}

const MenuManager: React.FC<MenuManagerProps> = ({ menu, setMenu, inventory = [] }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<MenuFormData>({
    name: '',
    category: 'Food',
    price: '',
    cost: '',
    description: 'Freshly prepared house special.',
    isReadyMade: false,
    readyMadeStockId: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Food',
      price: '',
      cost: '',
      description: 'Freshly prepared house special.',
      isReadyMade: false,
      readyMadeStockId: ''
    });
    setEditingItem(null);
  };

  const handleOpenModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        price: item.price.toString(),
        cost: item.cost.toString(),
        description: item.description || 'Freshly prepared house special.',
        isReadyMade: item.isReadyMade || false,
        readyMadeStockId: item.readyMadeStockId || ''
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(resetForm, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(formData.price);
    const cost = parseFloat(formData.cost || (price * 0.3).toString());

    try {
      if (editingItem) {
        // Local update
        setMenu(menu.map(item =>
          item.id === editingItem.id
            ? {
                ...item,
                name: formData.name,
                category: formData.category,
                price,
                cost,
                description: formData.description,
                isReadyMade: formData.isReadyMade,
                readyMadeStockId: formData.isReadyMade ? formData.readyMadeStockId : undefined
              }
            : item
        ));

        if (supabase) {
          await remoteUpdateMenuItem(editingItem.id, {
            name: formData.name,
            category: formData.category,
            price,
            cost,
            description: formData.description,
            is_ready_made: formData.isReadyMade,
            ready_made_stock_id: formData.isReadyMade ? formData.readyMadeStockId : undefined
          });
        }
      } else {
        // Add new item
        if (supabase) {
          try {
            const remote = await remoteAddMenuItem({
              name: formData.name,
              category: formData.category,
              price,
              cost,
              image: '',
              description: formData.description,
              is_ready_made: formData.isReadyMade,
              ready_made_stock_id: formData.isReadyMade ? formData.readyMadeStockId : undefined
            });
            const newItem: MenuItem = {
              id: remote.id,
              name: remote.name,
              category: remote.category,
              price: remote.price,
              cost: remote.cost,
              image: remote.image,
              description: remote.description,
              isReadyMade: formData.isReadyMade,
              readyMadeStockId: formData.isReadyMade ? formData.readyMadeStockId : undefined,
              ingredients: []
            };
            setMenu([...menu, newItem]);
          } catch (err) {
            console.warn('Remote add failed, falling back to local only:', (err as any).message);
            const fallback: MenuItem = {
              id: Math.random().toString(36).substr(2, 9),
              name: formData.name,
              category: formData.category,
              price,
              cost,
              image: '',
              description: formData.description,
              isReadyMade: formData.isReadyMade,
              readyMadeStockId: formData.isReadyMade ? formData.readyMadeStockId : undefined,
              ingredients: []
            };
            setMenu([...menu, fallback]);
          }
        } else {
          const newItem: MenuItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: formData.name,
            category: formData.category,
            price,
            cost,
            image: '',
            description: formData.description,
            isReadyMade: formData.isReadyMade,
            readyMadeStockId: formData.isReadyMade ? formData.readyMadeStockId : undefined,
            ingredients: []
          };
          setMenu([...menu, newItem]);
        }
      }
    } finally {
      handleCloseModal();
    }
  };

  const handleDelete = async (id: string) => {
    setMenu(menu.filter(m => m.id !== id));
    if (supabase) {
      try {
        await remoteDeleteMenuItem(id);
      } catch (err) {
        console.warn('Remote delete failed, item removed locally only:', (err as any).message);
      }
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
    <>
      <div className="p-4 md:p-8 h-full overflow-y-auto bg-gray-50 pb-20 md:pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Menu Management</h2>
            <p className="text-gray-500 text-sm">Add or remove dishes from your menu</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
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
                  onClick={() => handleOpenModal(item)}
                  className="w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow-sm text-blue-500 hover:bg-blue-500 hover:text-white transition-colors"
                  title="Edit Item"
                 >
                   <i className="bi bi-pencil"></i>
                 </button>
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
          onClick={() => handleOpenModal()}
          className="rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-secondary hover:text-secondary hover:bg-secondary/5 transition-all min-h-[300px]"
        >
          <i className="bi bi-plus-circle text-4xl mb-2"></i>
          <span className="font-medium">Add New Dish</span>
        </button>
      </div>
    </div>

    {/* Modal for Add/Edit Item */}
    {showModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
            <h3 className="text-xl font-bold text-gray-900">
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h3>
            <button
              onClick={handleCloseModal}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Dish Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Dish Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="e.g., Chicken Curry"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="Food">Food</option>
                <option value="Drinks">Drinks</option>
                <option value="Desserts">Desserts</option>
                <option value="Appetizers">Appetizers</option>
                <option value="Main Course">Main Course</option>
                <option value="Sides">Sides</option>
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price (Kyats) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  step="100"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="5000"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Ks</span>
              </div>
            </div>

            {/* Cost */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cost (Kyats) <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Auto-calculated (30%)"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Ks</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">Leave empty to auto-calculate as 30% of price</p>
            </div>

            {/* Ready-Made Toggle */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isReadyMade}
                  onChange={(e) => setFormData({ ...formData, isReadyMade: e.target.checked, readyMadeStockId: e.target.checked ? formData.readyMadeStockId : '' })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="text-sm font-semibold text-gray-800">Ready-Made Item</span>
                  <p className="text-xs text-gray-600 mt-1">
                    Check this for canned/bottled drinks or pre-packaged food that tracks direct stock
                  </p>
                </div>
              </label>
            </div>

            {/* Inventory Linking (only if ready-made) */}
            {formData.isReadyMade && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Link to Inventory <span className="text-red-500">*</span>
                </label>
                <select
                  required={formData.isReadyMade}
                  value={formData.readyMadeStockId}
                  onChange={(e) => setFormData({ ...formData, readyMadeStockId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="">Select inventory item...</option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.stock} {item.unit} available)
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-blue-700 flex items-start gap-1">
                  <i className="bi bi-info-circle-fill mt-0.5"></i>
                  <span>This links the menu item to inventory stock. When sold, stock will decrease by 1.</span>
                </p>
                {inventory.length === 0 && (
                  <p className="mt-2 text-xs text-orange-600 font-medium">
                    ⚠️ No inventory items found. Add inventory items first in the Inventory tab.
                  </p>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                placeholder="Brief description of the dish..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-secondary text-white rounded-lg font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-secondary/20"
              >
                {editingItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </>
  );
};

export default MenuManager;

