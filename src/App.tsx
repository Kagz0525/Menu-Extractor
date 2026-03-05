/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Upload, FileText, Download, Loader2, AlertCircle, Settings, Utensils, Coffee } from 'lucide-react';
import { extractFoodMenuData, extractDrinkMenuData } from './lib/gemini';
import { jsonToCsv, drinksJsonToCsv, MenuItem, DrinkItem } from './lib/csv';

type MenuType = 'food' | 'drinks';

export default function App() {
  const [menuType, setMenuType] = useState<MenuType>('food');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [customInstructions, setCustomInstructions] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [foodItems, setFoodItems] = useState<MenuItem[]>([]);
  const [drinkItems, setDrinkItems] = useState<DrinkItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [extractionResult, setExtractionResult] = useState<{ count: number, errors: string[] } | null>(null);

  const handleMenuTypeChange = (type: MenuType) => {
    setMenuType(type);
    setFoodItems([]);
    setDrinkItems([]);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (selected.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(selected));
      } else {
        setPreviewUrl(null);
      }
      setFoodItems([]);
      setDrinkItems([]);
      setError(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        try {
          if (menuType === 'food') {
            const { items, errors } = await extractFoodMenuData(base64data, file.type, customInstructions);
            setFoodItems(items);
            setExtractionResult({ count: items.length, errors });
          } else {
            const { items, errors } = await extractDrinkMenuData(base64data, file.type, customInstructions);
            setDrinkItems(items);
            setExtractionResult({ count: items.length, errors });
          }
          setShowModal(true);
        } catch (err: any) {
          setError(err.message || "Failed to process menu");
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || "Failed to read file");
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    let csv = '';
    let filename = '';
    if (menuType === 'food') {
      csv = jsonToCsv(foodItems);
      filename = 'food_menu_data.csv';
    } else {
      csv = drinksJsonToCsv(drinkItems);
      filename = 'drinks_menu_data.csv';
    }
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasItems = menuType === 'food' ? foodItems.length > 0 : drinkItems.length > 0;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-emerald-600" />
          <h1 className="text-xl font-semibold tracking-tight">Menu to Spreadsheet</h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
            <h2 className="text-lg font-medium mb-4">1. Select Menu Type</h2>
            <div className="flex bg-stone-100 p-1 rounded-xl">
              <button
                onClick={() => handleMenuTypeChange('food')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                  menuType === 'food' 
                    ? 'bg-white text-stone-900 shadow-sm' 
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <Utensils className="w-4 h-4" />
                Food Menu
              </button>
              <button
                onClick={() => handleMenuTypeChange('drinks')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                  menuType === 'drinks' 
                    ? 'bg-white text-stone-900 shadow-sm' 
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <Coffee className="w-4 h-4" />
                Drinks Menu
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
            <h2 className="text-lg font-medium mb-4">2. Upload Menu</h2>
            <div className="border-2 border-dashed border-stone-300 rounded-xl p-8 text-center hover:bg-stone-50 transition-colors relative">
              <input 
                type="file" 
                accept="image/*,application/pdf" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-stone-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-stone-700">Click or drag file to upload</p>
              <p className="text-xs text-stone-500 mt-1">Supports Images & PDF</p>
            </div>
            {file && (
              <div className="mt-4 p-3 bg-stone-100 rounded-lg flex items-center gap-3">
                <FileText className="w-5 h-5 text-stone-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-stone-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            )}
            
            {previewUrl && (
              <div className="mt-4 aspect-[3/4] relative rounded-lg overflow-hidden border border-stone-200">
                <img src={previewUrl} alt="Menu preview" className="object-cover w-full h-full" />
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-stone-500" />
              <h2 className="text-lg font-medium">3. Custom Structure (Optional)</h2>
            </div>
            <p className="text-sm text-stone-500 mb-3">
              Paste your expected column headers or specific instructions here. We'll try to adapt the extraction.
            </p>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g., Make sure to extract 'Spicy Level' as a separate modifier..."
              className="w-full h-32 p-3 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
            />
          </div>

          <button
            onClick={handleProcess}
            disabled={!file || isProcessing}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing {menuType === 'food' ? 'Food' : 'Drinks'} Menu...
              </>
            ) : (
              `Extract ${menuType === 'food' ? 'Food' : 'Drinks'} Data`
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3 border border-red-100">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 h-full flex flex-col overflow-hidden min-h-[600px]">
            <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
              <h2 className="text-lg font-medium">Extracted Data ({menuType === 'food' ? 'Food' : 'Drinks'})</h2>
              {hasItems && (
                <button
                  onClick={handleDownload}
                  className="py-2 px-4 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-auto p-0">
              {!hasItems ? (
                <div className="h-full flex flex-col items-center justify-center text-stone-400 p-12">
                  <FileText className="w-12 h-12 mb-4 opacity-20" />
                  <p>Upload and process a menu to see the extracted data here.</p>
                </div>
              ) : menuType === 'food' ? (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-stone-50 text-stone-500 sticky top-0 border-b border-stone-200 shadow-sm">
                    <tr>
                      <th className="px-6 py-3 font-medium">Name</th>
                      <th className="px-6 py-3 font-medium">Description</th>
                      <th className="px-6 py-3 font-medium">Price</th>
                      <th className="px-6 py-3 font-medium">Category</th>
                      <th className="px-6 py-3 font-medium">Variations (JSON)</th>
                      <th className="px-6 py-3 font-medium">Options (JSON)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {foodItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/50">
                        <td className="px-6 py-4 font-medium text-stone-900">{item.Name}</td>
                        <td className="px-6 py-4 max-w-[200px] truncate" title={item.Description}>{item.Description}</td>
                        <td className="px-6 py-4">{item.Price}</td>
                        <td className="px-6 py-4">{item.Category}</td>
                        <td className="px-6 py-4 max-w-[200px] truncate text-stone-500" title={JSON.stringify(item.Variations || [])}>
                          {JSON.stringify(item.Variations || [])}
                        </td>
                        <td className="px-6 py-4 max-w-[200px] truncate text-stone-500" title={JSON.stringify(item.Options || [])}>
                          {JSON.stringify(item.Options || [])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-stone-50 text-stone-500 sticky top-0 border-b border-stone-200 shadow-sm">
                    <tr>
                      <th className="px-6 py-3 font-medium">Alcohol/Non Alcohol</th>
                      <th className="px-6 py-3 font-medium">Category</th>
                      <th className="px-6 py-3 font-medium">Item Name</th>
                      <th className="px-6 py-3 font-medium">Unknown</th>
                      <th className="px-6 py-3 font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {drinkItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/50">
                        <td className="px-6 py-4 font-medium text-stone-900">{item.AlcoholicStatus}</td>
                        <td className="px-6 py-4">{item.Category}</td>
                        <td className="px-6 py-4 font-medium text-stone-900">{item.Name}</td>
                        <td className="px-6 py-4 text-stone-500">{item.Unknown}</td>
                        <td className="px-6 py-4">{item.Price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

      {showModal && extractionResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Extraction Complete</h3>
            <div className="space-y-4">
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="font-bold text-lg">{extractionResult.count}</span>
                </div>
                <p className="font-medium">Items successfully extracted</p>
              </div>
              
              {extractionResult.errors.length > 0 && (
                <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-100">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Warnings / Unparsed Items ({extractionResult.errors.length})
                  </h4>
                  <ul className="list-disc pl-5 text-sm space-y-1 max-h-32 overflow-y-auto">
                    {extractionResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-colors"
              >
                View Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
