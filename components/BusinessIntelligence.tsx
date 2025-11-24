import React, { useState } from 'react';
import { analyzeBusinessData } from '../services/geminiService';
import { Order, MenuItem, Ingredient } from '../types';
import ReactMarkdown from 'react-markdown';

interface BIProps {
  orders: Order[];
  menu: MenuItem[];
  inventory: Ingredient[];
}

const BusinessIntelligence: React.FC<BIProps> = ({ orders, menu, inventory }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);
    const result = await analyzeBusinessData(query, orders, inventory, menu);
    setResponse(result || "No response generated.");
    setLoading(false);
  };

  const suggestions = [
    "Analyze my profit margins and suggest menu price changes.",
    "Which ingredients are running low based on sales trends?",
    "Generate a marketing strategy for my slow-moving items.",
    "What is my best performing category and why?"
  ];

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <i className="bi bi-stars text-primary"></i>
          AI Business Analyst
        </h2>
        <p className="text-slate-500 mt-1">
          Powered by Gemini 3 Pro (Thinking Mode enabled). Ask complex questions about your restaurant's performance.
        </p>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row p-6 gap-6 max-w-7xl mx-auto w-full">
        {/* Input Section */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col">
            <label className="font-semibold text-slate-700 mb-2 block">Your Question</label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., How can I reduce food waste this week?"
              className="w-full flex-1 p-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none mb-4 text-sm"
            ></textarea>
            
            <button
              onClick={handleAnalyze}
              disabled={loading || !query}
              className="w-full py-3 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-lg font-semibold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Thinking...
                </>
              ) : (
                <>
                  <i className="bi bi-magic"></i>
                  Analyze
                </>
              )}
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-3">Suggested Queries</h4>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(s)}
                  className="w-full text-left p-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-sm text-slate-600 transition-colors border border-transparent hover:border-slate-200"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <span className="font-semibold text-slate-700">Analysis Result</span>
            {response && (
              <button 
                onClick={() => setResponse(null)} 
                className="text-xs text-slate-400 hover:text-red-500"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex-1 p-6 overflow-y-auto prose prose-slate max-w-none">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 animate-pulse">
                <i className="bi bi-cpu text-6xl mb-4"></i>
                <p>Analyzing sales patterns, inventory levels, and profitability...</p>
                <p className="text-xs mt-2">This may take a moment for deep reasoning.</p>
              </div>
            ) : response ? (
              // Requires a markdown renderer, simplifying for this output with basic whitespace handling if package missing, 
              // but I included ReactMarkdown in imports assuming standard env.
              // If ReactMarkdown isn't available, standard whitespace-pre-wrap works too.
               <div className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">
                 {response}
               </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <i className="bi bi-chat-square-quote text-6xl mb-4"></i>
                <p>Ask a question to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessIntelligence;