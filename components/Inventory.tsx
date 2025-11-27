import React, { useState } from 'react';
import { Ingredient } from '../types';
import { supabase } from '../services/supabaseClient';

interface InventoryProps {
  ingredients: Ingredient[];
  onUpdateStock: (id: string, amount: number) => void;
  onAddIngredient?: (ingredient: Omit<Ingredient, 'id'>) => void;
  onDeleteIngredient?: (id: string) => void;
  onUpdateIngredient?: (id: string, ingredient: Partial<Ingredient>) => void;
  onRefresh?: () => void;
}

interface StockFormData {
  amount: string;
  notes: string;
}

interface IngredientFormData {
  name: string;
  unit: string;
  stock: string;
  minStockLevel: string;
  costPerUnit: string;
}

const Inventory: React.FC<InventoryProps> = ({ ingredients, onUpdateStock, onAddIngredient, onDeleteIngredient, onUpdateIngredient, onRefresh }) => {
  const [showStockModal, setShowStockModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stockFormData, setStockFormData] = useState<StockFormData>({
    amount: '',
    notes: ''
  });
  const [ingredientFormData, setIngredientFormData] = useState<IngredientFormData>({
    name: '',
    unit: 'pcs',
    stock: '',
    minStockLevel: '',
    costPerUnit: ''
  });

  const handleOpenStockModal = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setStockFormData({ amount: '', notes: '' });
    setShowStockModal(true);
  };

  const handleCloseStockModal = () => {
    setShowStockModal(false);
    setSelectedIngredient(null);
    setStockFormData({ amount: '', notes: '' });
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(stockFormData.amount);
    if (amount > 0 && selectedIngredient) {
      setLoading(true);
      setError(null);

      try {
        if (supabase) {
          // Update in Supabase
          const newStock = selectedIngredient.stock + amount;
          const { error: updateError } = await supabase
            .from('ingredients')
            .update({ stock: newStock })
            .eq('id', selectedIngredient.id);

          if (updateError) throw updateError;

          setSuccess(`Successfully added ${amount} ${selectedIngredient.unit} to ${selectedIngredient.name}`);

          // Refresh data from backend - wait for it to complete
          if (onRefresh) {
            await onRefresh();
          }

          // Close modal after short delay to show success message
          setTimeout(() => {
            handleCloseStockModal();
            setSuccess(null);
            setLoading(false);
          }, 1500);
        } else {
          // Update local state if no database
          onUpdateStock(selectedIngredient.id, amount);
          setSuccess(`Successfully added ${amount} ${selectedIngredient.unit} to ${selectedIngredient.name}`);

          setTimeout(() => {
            handleCloseStockModal();
            setSuccess(null);
            setLoading(false);
          }, 1500);
        }
      } catch (err: any) {
        console.error('Error updating stock:', err);
        setError(err.message || 'Failed to update stock. Please try again.');
        setLoading(false);
      }
    }
  };

  const handleOpenManageModal = (ingredient?: Ingredient) => {
    if (ingredient) {
      // Edit mode
      setEditingIngredient(ingredient);
      setIngredientFormData({
        name: ingredient.name,
        unit: ingredient.unit,
        stock: ingredient.stock.toString(),
        minStockLevel: ingredient.minStockLevel.toString(),
        costPerUnit: ingredient.costPerUnit.toString()
      });
    } else {
      // Add mode
      setEditingIngredient(null);
      setIngredientFormData({
        name: '',
        unit: 'pcs',
        stock: '',
        minStockLevel: '',
        costPerUnit: ''
      });
    }
    setShowManageModal(true);
  };

  const handleCloseManageModal = () => {
    setShowManageModal(false);
    setEditingIngredient(null);
    setError(null);
    setSuccess(null);
  };

  const handleManageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editingIngredient) {
        // Update existing ingredient
        const updates = {
          name: ingredientFormData.name,
          unit: ingredientFormData.unit,
          stock: parseFloat(ingredientFormData.stock),
          min_stock_level: parseFloat(ingredientFormData.minStockLevel),
          cost_per_unit: parseFloat(ingredientFormData.costPerUnit)
        };

        if (supabase) {
          const { error: updateError } = await supabase
            .from('ingredients')
            .update(updates)
            .eq('id', editingIngredient.id);

          if (updateError) throw updateError;

          setSuccess(`Successfully updated "${ingredientFormData.name}"`);

          // Refresh data from backend - wait for it to complete
          if (onRefresh) {
            await onRefresh();
          }

          setTimeout(() => {
            handleCloseManageModal();
            setSuccess(null);
            setLoading(false);
          }, 1500);
        } else {
          // Fallback to local state only
          if (onUpdateIngredient) {
            onUpdateIngredient(editingIngredient.id, {
              name: updates.name,
              unit: updates.unit,
              stock: updates.stock,
              minStockLevel: updates.min_stock_level,
              costPerUnit: updates.cost_per_unit
            });
          }
          setSuccess(`Successfully updated "${ingredientFormData.name}"`);
          setTimeout(() => {
            handleCloseManageModal();
            setSuccess(null);
            setLoading(false);
          }, 1500);
        }
      } else {
        // Add new ingredient
        const newIngredient = {
          name: ingredientFormData.name,
          unit: ingredientFormData.unit,
          stock: parseFloat(ingredientFormData.stock),
          min_stock_level: parseFloat(ingredientFormData.minStockLevel),
          cost_per_unit: parseFloat(ingredientFormData.costPerUnit)
        };

        if (supabase) {
          // Insert into Supabase
          const { error: insertError } = await supabase
            .from('ingredients')
            .insert([newIngredient])
            .select()
            .single();

          if (insertError) throw insertError;

          setSuccess(`Successfully added "${ingredientFormData.name}" to inventory`);

          // Refresh data from backend - wait for it to complete
          if (onRefresh) {
            await onRefresh();
          }

          // Close modal after short delay to show success message
          setTimeout(() => {
            handleCloseManageModal();
            setSuccess(null);
            setLoading(false);
          }, 1500);
        } else {
          // Fallback to local state only
          if (onAddIngredient) {
            onAddIngredient({
              name: ingredientFormData.name,
              unit: ingredientFormData.unit,
              stock: parseFloat(ingredientFormData.stock),
              minStockLevel: parseFloat(ingredientFormData.minStockLevel),
              costPerUnit: parseFloat(ingredientFormData.costPerUnit)
            });
            setSuccess('Ingredient added locally. Connect to Supabase to persist.');
            setTimeout(() => {
              handleCloseManageModal();
              setSuccess(null);
              setLoading(false);
            }, 1500);
          }
        }
      }
    } catch (err: any) {
      console.error('Error managing ingredient:', err);
      setError(err.message || 'Failed to save ingredient. Please try again.');
      setLoading(false);
    }
  };

  const handleDeleteIngredient = async (ingredient: Ingredient) => {
    if (!confirm(`Are you sure you want to delete "${ingredient.name}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (supabase) {
        const { error: deleteError } = await supabase
          .from('ingredients')
          .delete()
          .eq('id', ingredient.id);

        if (deleteError) throw deleteError;

        setSuccess(`Successfully deleted "${ingredient.name}"`);

        // Refresh data from backend - wait for it to complete
        if (onRefresh) {
          await onRefresh();
        }

        setTimeout(() => {
          setSuccess(null);
          setLoading(false);
        }, 1500);
      } else {
        // Fallback to local state only
        if (onDeleteIngredient) {
          onDeleteIngredient(ingredient.id);
          setSuccess(`"${ingredient.name}" deleted locally.`);
          setTimeout(() => {
            setSuccess(null);
            setLoading(false);
          }, 1500);
        }
      }
    } catch (err: any) {
      console.error('Error deleting ingredient:', err);
      setError(err.message || 'Failed to delete ingredient. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="p-4 md:p-8 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 pb-20 md:pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Inventory</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Track ingredients and supplies</p>
          </div>
          <button
            onClick={() => handleOpenManageModal()}
            className="w-full md:w-auto px-6 py-3 bg-white dark:bg-gray-800 border-2 border-primary text-primary rounded-xl text-sm font-bold hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2 active:scale-95"
          >
            <i className="bi bi-plus-circle-fill"></i> Add New Ingredient
          </button>
        </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Item Name</th>
                <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Stock Level</th>
                <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Unit</th>
                <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Cost/Unit</th>
                <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {ingredients.map(ing => {
                const isLow = ing.stock <= ing.minStockLevel;
                return (
                  <tr key={ing.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 text-gray-800 dark:text-gray-200 font-medium">{ing.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono ${isLow ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-600 dark:text-gray-300'}`}>
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
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">{ing.unit}</td>
                    <td className="px-6 py-4">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400"></span>
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400"></span>
                          Good
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-sm">{ing.costPerUnit.toLocaleString()} Ks</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenManageModal(ing)}
                          className="inline-flex items-center justify-center px-3 py-1.5 border border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white rounded text-sm font-medium transition-all active:scale-95"
                          title="Edit Ingredient"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          onClick={() => handleOpenStockModal(ing)}
                          className="inline-flex items-center justify-center px-3 py-1.5 border border-primary text-primary hover:bg-primary hover:text-white rounded text-sm font-medium transition-all active:scale-95"
                          title="Add Stock"
                        >
                          <i className="bi bi-plus-lg"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteIngredient(ing)}
                          disabled={loading}
                          className="inline-flex items-center justify-center px-3 py-1.5 border border-red-500 text-red-600 hover:bg-red-500 hover:text-white rounded text-sm font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete Ingredient"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {/* Stock Update Modal */}
    {showStockModal && selectedIngredient && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCloseStockModal}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="bg-gradient-to-r from-primary to-indigo-600 text-white px-6 py-4 rounded-t-2xl">
            <h3 className="text-xl font-bold">Add Stock</h3>
            <p className="text-sm opacity-90 mt-1">{selectedIngredient.name}</p>
          </div>

          <form onSubmit={handleStockSubmit} className="p-6 space-y-4">
            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <i className="bi bi-check-circle-fill text-green-600 text-xl"></i>
                <div>
                  <p className="text-green-800 font-medium">{success}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <i className="bi bi-exclamation-circle-fill text-red-600 text-xl"></i>
                <div>
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Current Stock Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Current Stock:</span>
                <span className="font-bold text-gray-900">{selectedIngredient.stock.toLocaleString()} {selectedIngredient.unit}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Minimum Level:</span>
                <span className="font-medium text-gray-700">{selectedIngredient.minStockLevel.toLocaleString()} {selectedIngredient.unit}</span>
              </div>
            </div>

            {/* Amount to Add */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Amount to Add <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={stockFormData.amount}
                  onChange={(e) => setStockFormData({ ...stockFormData, amount: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-lg font-semibold"
                  placeholder="0"
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">{selectedIngredient.unit}</span>
              </div>
              {stockFormData.amount && (
                <p className="mt-2 text-sm text-primary font-medium">
                  New stock will be: {(selectedIngredient.stock + parseFloat(stockFormData.amount || '0')).toLocaleString()} {selectedIngredient.unit}
                </p>
              )}
            </div>

            {/* Quick Add Buttons */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Quick Add</label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 25, 50, 100].map(amount => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setStockFormData({ ...stockFormData, amount: amount.toString() })}
                    className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium hover:border-primary hover:bg-primary hover:text-white transition-colors"
                  >
                    +{amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <textarea
                value={stockFormData.notes}
                onChange={(e) => setStockFormData({ ...stockFormData, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                placeholder="Supplier, batch number, etc..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleCloseStockModal}
                disabled={loading}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !stockFormData.amount}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Updating...</span>
                  </>
                ) : (
                  'Add Stock'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Manage Ingredients Modal */}
    {showManageModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCloseManageModal}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {editingIngredient ? 'Edit Ingredient' : 'Add New Ingredient'}
            </h3>
            <button
              onClick={handleCloseManageModal}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <form onSubmit={handleManageSubmit} className="p-6 space-y-4">
            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <i className="bi bi-check-circle-fill text-green-600 text-xl"></i>
                <div>
                  <p className="text-green-800 font-medium">{success}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <i className="bi bi-exclamation-circle-fill text-red-600 text-xl"></i>
                <div>
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Ingredient Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Ingredient Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={ingredientFormData.name}
                onChange={(e) => setIngredientFormData({ ...ingredientFormData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="e.g., Tomatoes"
              />
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Unit of Measurement <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={ingredientFormData.unit}
                onChange={(e) => setIngredientFormData({ ...ingredientFormData, unit: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-gray-800 dark:text-gray-100"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="g">Grams (g)</option>
                <option value="L">Liters (L)</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="lb">Pounds (lb)</option>
                <option value="oz">Ounces (oz)</option>
              </select>
            </div>

            {/* Initial Stock */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Initial Stock <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={ingredientFormData.stock}
                onChange={(e) => setIngredientFormData({ ...ingredientFormData, stock: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-gray-800 dark:text-gray-100"
                placeholder="0"
              />
            </div>

            {/* Minimum Stock Level */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Minimum Stock Level <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={ingredientFormData.minStockLevel}
                onChange={(e) => setIngredientFormData({ ...ingredientFormData, minStockLevel: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-gray-800 dark:text-gray-100"
                placeholder="0"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">You'll be alerted when stock falls below this level</p>
            </div>

            {/* Cost Per Unit */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Cost Per Unit (Kyats) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={ingredientFormData.costPerUnit}
                  onChange={(e) => setIngredientFormData({ ...ingredientFormData, costPerUnit: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-gray-800 dark:text-gray-100"
                  placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">Ks</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleCloseManageModal}
                disabled={loading}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{editingIngredient ? 'Updating...' : 'Adding...'}</span>
                  </>
                ) : (
                  editingIngredient ? 'Update Ingredient' : 'Add Ingredient'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </>
  );
};

export default Inventory;







