import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PlusCircle, RefreshCw, Download } from 'lucide-react';

// Backend API URL - make sure backend is running on port 3001
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Debug: Log API calls
const fetchWithLog = async (url, options) => {
  console.log('Fetching:', url);
  try {
    const response = await fetch(url, options);
    console.log('Response status:', response.status);
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

const NZHomeLoanTracker = () => {
  const [rates, setRates] = useState([]);
  const [banks, setBanks] = useState([]);
  const [selectedBanks, setSelectedBanks] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('1year');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    bank_id: '',
    rate_date: new Date().toISOString().split('T')[0],
    term_1year: '',
    term_2year: '',
    term_3year: '',
    term_5year: ''
  });

  const terms = [
    { value: '1year', label: '1 Year', key: 'term_1year' },
    { value: '2year', label: '2 Year', key: 'term_2year' },
    { value: '3year', label: '3 Year', key: 'term_3year' },
    { value: '5year', label: '5 Year', key: 'term_5year' }
  ];

  const colors = {
    'ANZ': '#0066CC',
    'ASB': '#ED1C24',
    'BNZ': '#00A9E0',
    'Westpac': '#DA1710',
    'Kiwibank': '#8DC63F',
    'TSB': '#009FE3',
    'SBS': '#E31937',
    'Cooperative Bank': '#00A651',
    'HSBC': '#DB0011',
    'China Construction Bank': '#003F87'
  };

  const fetchBanks = useCallback(async () => {
    try {
      const response = await fetchWithLog(`${API_URL}/api/banks`);
      const data = await response.json();
      console.log('Banks loaded:', data);
      setBanks(data);
      setSelectedBanks(data.slice(0, 3).map(b => b.name));
    } catch (err) {
      console.error('Error fetching banks:', err);
      setError('Failed to load banks. Is the backend running on port 3001?');
    }
  }, []);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchWithLog(`${API_URL}/api/rates`);
      const data = await response.json();
      console.log('Rates loaded:', data.length, 'entries');
      
      const formattedRates = data.map(rate => ({
        bank: rate.bank_name,
        bank_id: rate.bank_id,
        date: rate.rate_date,
        term1year: parseFloat(rate.term_1year),
        term2year: parseFloat(rate.term_2year),
        term3year: parseFloat(rate.term_3year),
        term5year: parseFloat(rate.term_5year)
      }));
      
      console.log('Formatted rates:', formattedRates);
      setRates(formattedRates);
      setError(null);
    } catch (err) {
      console.error('Error fetching rates:', err);
      setError('Failed to load rates. Using sample data.');
      loadSampleData();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanks();
    fetchRates();
  }, [fetchBanks, fetchRates]);

  const loadSampleData = () => {
    const sampleData = [
      { bank: 'ANZ', date: '2024-01-01', term1year: 6.89, term2year: 6.59, term3year: 6.29, term5year: 6.19 },
      { bank: 'ANZ', date: '2024-06-01', term1year: 6.69, term2year: 6.39, term3year: 6.09, term5year: 5.99 },
      { bank: 'ANZ', date: '2025-01-01', term1year: 6.19, term2year: 5.89, term3year: 5.79, term5year: 5.99 },
      { bank: 'ASB', date: '2024-01-01', term1year: 6.85, term2year: 6.55, term3year: 6.25, term5year: 6.15 },
      { bank: 'ASB', date: '2024-06-01', term1year: 6.65, term2year: 6.35, term3year: 6.05, term5year: 5.95 },
      { bank: 'ASB', date: '2025-01-01', term1year: 6.15, term2year: 5.85, term3year: 5.75, term5year: 5.95 },
      { bank: 'Kiwibank', date: '2024-01-01', term1year: 6.79, term2year: 6.49, term3year: 6.19, term5year: 6.09 },
      { bank: 'Kiwibank', date: '2024-06-01', term1year: 6.59, term2year: 6.29, term3year: 5.99, term5year: 5.89 },
      { bank: 'Kiwibank', date: '2025-01-01', term1year: 6.09, term2year: 5.79, term3year: 5.69, term5year: 5.89 },
    ];
    setRates(sampleData);
  };

  const handleAddRate = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchRates();
        setFormData({
          bank_id: '',
          rate_date: new Date().toISOString().split('T')[0],
          term_1year: '',
          term_2year: '',
          term_3year: '',
          term_5year: ''
        });
        setShowAddForm(false);
      } else {
        setError('Failed to add rate');
      }
    } catch (err) {
      console.error('Error adding rate:', err);
      setError('Failed to add rate');
    }
  };

  const toggleBank = (bank) => {
    setSelectedBanks(prev =>
      prev.includes(bank) ? prev.filter(b => b !== bank) : [...prev, bank]
    );
  };

  const getChartData = () => {
    const dataMap = new Map();
    
    rates
      .filter(r => selectedBanks.includes(r.bank))
      .forEach(rate => {
        if (!dataMap.has(rate.date)) {
          dataMap.set(rate.date, { date: rate.date });
        }
        const dateData = dataMap.get(rate.date);
        const termKey = `term${selectedTerm}`;
        const rateValue = rate[termKey];
        if (rateValue && !isNaN(rateValue)) {
          dateData[rate.bank] = rateValue;
        }
      });

    const chartData = Array.from(dataMap.values()).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    console.log('Chart data:', chartData);
    return chartData;
  };

  const getCurrentRates = () => {
    const latest = {};
    rates.forEach(rate => {
      if (!latest[rate.bank] || new Date(rate.date) > new Date(latest[rate.bank].date)) {
        latest[rate.bank] = rate;
      }
    });
    
    const termKey = `term${selectedTerm}`;
    const sortedRates = Object.values(latest)
      .filter(r => r[termKey] && !isNaN(r[termKey]))
      .sort((a, b) => a[termKey] - b[termKey]);
    
    console.log('Current rates:', sortedRates);
    return sortedRates;
  };

  const exportData = () => {
    const csv = [
      ['Bank', 'Date', '1 Year', '2 Year', '3 Year', '5 Year'],
      ...rates.map(r => [
        r.bank,
        r.date,
        r.term1year || '',
        r.term2year || '',
        r.term3year || '',
        r.term5year || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nz-home-loan-rates-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading && rates.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-slate-600">Loading rates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">
                NZ Home Loan Rates Tracker
              </h1>
              <p className="text-slate-600">Compare mortgage rates across New Zealand banks</p>
              {error && (
                <p className="text-amber-600 text-sm mt-2">⚠️ {error}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchRates}
                className="flex items-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition"
              >
                <RefreshCw size={20} />
                Refresh
              </button>
              <button
                onClick={exportData}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                <Download size={20} />
                Export CSV
              </button>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <PlusCircle size={20} />
                Add Rate
              </button>
            </div>
          </div>
        </header>

        {showAddForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Add New Rate Entry</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bank</label>
                <select
                  value={formData.bank_id}
                  onChange={(e) => setFormData({...formData, bank_id: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Select Bank</option>
                  {banks.map(bank => (
                    <option key={bank.id} value={bank.id}>{bank.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.rate_date}
                  onChange={(e) => setFormData({...formData, rate_date: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">1 Year Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.term_1year}
                  onChange={(e) => setFormData({...formData, term_1year: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  placeholder="6.50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">2 Year Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.term_2year}
                  onChange={(e) => setFormData({...formData, term_2year: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  placeholder="6.20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">3 Year Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.term_3year}
                  onChange={(e) => setFormData({...formData, term_3year: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  placeholder="5.90"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">5 Year Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.term_5year}
                  onChange={(e) => setFormData({...formData, term_5year: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  placeholder="5.80"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3 flex gap-3">
                <button
                  onClick={handleAddRate}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Save Rate
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="bg-slate-300 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-400 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-2xl font-semibold text-slate-800">Rate Trends</h2>
              <div className="flex gap-2 flex-wrap">
                {terms.map(term => (
                  <button
                    key={term.value}
                    onClick={() => setSelectedTerm(term.value)}
                    className={`px-3 py-1 rounded-lg text-sm transition ${
                      selectedTerm === term.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {term.label}
                  </button>
                ))}
              </div>
            </div>
            {getChartData().length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-NZ', { month: 'short', year: '2-digit' })}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    domain={['dataMin - 0.2', 'dataMax + 0.2']}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value) => `${value}%`}
                    labelFormatter={(date) => new Date(date).toLocaleDateString('en-NZ')}
                  />
                  <Legend />
                  {selectedBanks.map(bank => (
                    <Line
                      key={bank}
                      type="monotone"
                      dataKey={bank}
                      stroke={colors[bank]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-96 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <p className="text-lg mb-2">No data available</p>
                  <p className="text-sm">Select banks or add rate data to see trends</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Select Banks</h2>
            <div className="space-y-2">
              {banks.map(bank => (
                <label
                  key={bank.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedBanks.includes(bank.name)}
                    onChange={() => toggleBank(bank.name)}
                    className="w-4 h-4"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors[bank.name] }}
                    />
                    <span className="text-slate-700">{bank.name}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">
            Current Best Rates - {terms.find(t => t.value === selectedTerm)?.label}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getCurrentRates().slice(0, 6).map((rate, index) => (
              <div
                key={`${rate.bank}-${index}`}
                className="border-l-4 p-4 rounded-lg bg-slate-50"
                style={{ borderColor: colors[rate.bank] }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-800">{rate.bank}</h3>
                  {index === 0 && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Best Rate
                    </span>
                  )}
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {rate[`term${selectedTerm}`]}%
                </div>
                <div className="text-xs text-slate-500">
                  As of {new Date(rate.date).toLocaleDateString('en-NZ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NZHomeLoanTracker;