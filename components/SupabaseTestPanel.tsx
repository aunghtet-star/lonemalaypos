/// <reference types="../vite-env.d.ts" />
import React, { useState } from 'react';
import { testConnection, fetchInventory, fetchMenuWithIngredients } from '../services/supabaseClient';

/**
 * SupabaseTestPanel - A simple component to test Supabase connection
 * Add this to your app temporarily to verify your database connection
 *
 * Usage: Import and add <SupabaseTestPanel /> to your App.tsx
 */
const SupabaseTestPanel: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [details, setDetails] = useState<any>(null);

  const handleTestConnection = async () => {
    setStatus('loading');
    setMessage('Testing connection...');
    setDetails(null);

    try {
      const result = await testConnection();
      if (result.success) {
        setStatus('success');
        setMessage('✅ ' + result.message);
      } else {
        setStatus('error');
        setMessage('❌ Connection failed: ' + result.message);
      }
    } catch (error: any) {
      setStatus('error');
      setMessage('❌ Error: ' + error.message);
    }
  };

  const handleFetchData = async () => {
    setStatus('loading');
    setMessage('Fetching data from Supabase...');
    setDetails(null);

    try {
      const [menuRes, inventoryRes] = await Promise.all([
        fetchMenuWithIngredients(),
        fetchInventory()
      ]);

      setStatus('success');
      setMessage('✅ Data fetched successfully!');
      setDetails({
        menuItems: menuRes.menu?.length || 0,
        ingredients: inventoryRes?.length || 0,
        refs: menuRes.refs?.length || 0
      });
    } catch (error: any) {
      setStatus('error');
      setMessage('❌ Error fetching data: ' + error.message);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading': return 'text-blue-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="font-bold text-lg mb-3 text-gray-800">
        🔧 Supabase Debug Panel
      </h3>

      <div className="space-y-2 mb-3">
        <button
          onClick={handleTestConnection}
          disabled={status === 'loading'}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Test Connection
        </button>

        <button
          onClick={handleFetchData}
          disabled={status === 'loading'}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Fetch Data
        </button>
      </div>

      {message && (
        <div className={`text-sm ${getStatusColor()} mb-2`}>
          {message}
        </div>
      )}

      {details && (
        <div className="text-xs bg-gray-50 p-2 rounded mt-2 space-y-1">
          <div>📦 Menu Items: <strong>{details.menuItems}</strong></div>
          <div>🥕 Ingredients: <strong>{details.ingredients}</strong></div>
          <div>🔗 Refs: <strong>{details.refs}</strong></div>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-3 pt-2 border-t">
        <strong>Env Check:</strong>
        <div className="mt-1">
          URL: {import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌'}
        </div>
        <div>
          Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌'}
        </div>
      </div>
    </div>
  );
};

export default SupabaseTestPanel;

