import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PlusCircle, RefreshCw, Download, Moon, Sun, Calculator, User, LogOut } from 'lucide-react';

// Backend API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const App = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null); // Simple user state
  const [showLogin, setShowLogin] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
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
    'TSB': '#007A33',
    'SBS': '#FF6600',
    'Cooperative Bank': '#009639',
    'HSBC': '#DB0011',
    'China Construction Bank': '#D52B1E'
  };

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [banksRes, ratesRes] = await Promise.all([
        fetch(`${API_URL}/api/banks`),
        fetch(`${API_URL}/api/rates/latest`)
      ]);

      if (!banksRes.ok || !ratesRes.ok) throw new Error('Failed to fetch data');

      const banksData = await banksRes.json();
      const ratesData = await ratesRes.json();

      setBanks(banksData);
      setRates(ratesData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowAddForm(false);
        fetchData();
        setFormData({
          bank_id: '',
          rate_date: new Date().toISOString().split('T')[0],
          term_1year: '',
          term_2year: '',
          term_3year: '',
          term_5year: ''
        });
      }
    } catch (err) {
      setError('Failed to add rate');
    }
  };

  // Simple login (mock)
  const handleLogin = (email, password) => {
    // Mock auth
    setUser({ email });
    setShowLogin(false);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Mortgage Calculator Component
  const MortgageCalculator = () => {
    const [calcData, setCalcData] = useState({
      loanAmount: '',
      interestRate: '',
      loanTerm: '',
      downPayment: ''
    });
    const [result, setResult] = useState(null);

    const calculate = () => {
      const principal = parseFloat(calcData.loanAmount) - parseFloat(calcData.downPayment || 0);
      const rate = parseFloat(calcData.interestRate) / 100 / 12;
      const payments = parseFloat(calcData.loanTerm) * 12;
      const monthly = (principal * rate * Math.pow(1 + rate, payments)) / (Math.pow(1 + rate, payments) - 1);
      setResult({ monthly: monthly.toFixed(2), total: (monthly * payments).toFixed(2) });
    };

    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Mortgage Calculator</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            placeholder="Loan Amount ($)"
            value={calcData.loanAmount}
            onChange={(e) => setCalcData({ ...calcData, loanAmount: e.target.value })}
            className="p-2 border rounded dark:bg-gray-700 dark:text-white"
            aria-label="Loan Amount"
          />
          <input
            type="number"
            placeholder="Interest Rate (%)"
            value={calcData.interestRate}
            onChange={(e) => setCalcData({ ...calcData, interestRate: e.target.value })}
            className="p-2 border rounded dark:bg-gray-700 dark:text-white"
            aria-label="Interest Rate"
          />
          <input
            type="number"
            placeholder="Loan Term (years)"
            value={calcData.loanTerm}
            onChange={(e) => setCalcData({ ...calcData, loanTerm: e.target.value })}
            className="p-2 border rounded dark:bg-gray-700 dark:text-white"
            aria-label="Loan Term"
          />
          <input
            type="number"
            placeholder="Down Payment ($)"
            value={calcData.downPayment}
            onChange={(e) => setCalcData({ ...calcData, downPayment: e.target.value })}
            className="p-2 border rounded dark:bg-gray-700 dark:text-white"
            aria-label="Down Payment"
          />
        </div>
        <button
          onClick={calculate}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          aria-label="Calculate Mortgage"
        >
          Calculate
        </button>
        {result && (
          <div className="mt-4 text-gray-900 dark:text-white">
            <p>Monthly Payment: ${result.monthly}</p>
            <p>Total Payment: ${result.total}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">NZ Home Loan Tracker</h1>
          <nav className="flex items-center space-x-4">
            <button
              onClick={() => setShowCalculator(!showCalculator)}
              className="flex items-center space-x-1 hover:text-blue-500"
              aria-label="Toggle Mortgage Calculator"
            >
              <Calculator size={20} />
              <span>Calculator</span>
            </button>
            {user ? (
              <>
                <span>Welcome, {user.email}</span>
                <button onClick={handleLogout} className="flex items-center space-x-1 hover:text-red-500" aria-label="Logout">
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <button onClick={() => setShowLogin(true)} className="flex items-center space-x-1 hover:text-blue-500" aria-label="Login">
                <User size={20} />
                <span>Login</span>
              </button>
            )}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {/* Login Modal */}
        {showLogin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4">Login</h2>
              <form onSubmit={(e) => { e.preventDefault(); handleLogin(e.target.email.value, e.target.password.value); }}>
                <input name="email" type="email" placeholder="Email" required className="block w-full p-2 mb-2 border rounded dark:bg-gray-700" />
                <input name="password" type="password" placeholder="Password" required className="block w-full p-2 mb-4 border rounded dark:bg-gray-700" />
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Login</button>
                <button type="button" onClick={() => setShowLogin(false)} className="ml-2 px-4 py-2">Cancel</button>
              </form>
            </div>
          </div>
        )}

        {/* Mortgage Calculator */}
        {showCalculator && <MortgageCalculator />}

        {/* Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Filters</h2>
            <div className="mb-4">
              <label className="block mb-2">Term</label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700"
                aria-label="Select Term"
              >
                {terms.map(term => (
                  <option key={term.value} value={term.value}>{term.label}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2">Banks</label>
              {banks.map(bank => (
                <label key={bank.id} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={selectedBanks.includes(bank.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBanks([...selectedBanks, bank.id]);
                      } else {
                        setSelectedBanks(selectedBanks.filter(id => id !== bank.id));
                      }
                    }}
                    className="mr-2"
                    aria-label={`Select ${bank.name}`}
                  />
                  {bank.name}
                </label>
              ))}
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              aria-label="Add Rate"
            >
              <PlusCircle size={20} />
              <span>Add Rate</span>
            </button>
          </div>

          {/* Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Rate Trends</h2>
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={rates.filter(rate => selectedBanks.length === 0 || selectedBanks.includes(rate.bank_id))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rate_date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {banks.map(bank => (
                    <Line
                      key={bank.id}
                      type="monotone"
                      dataKey={terms.find(t => t.value === selectedTerm)?.key}
                      stroke={colors[bank.name] || '#8884d8'}
                      name={bank.name}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Add Rate Form */}
        {showAddForm && (
          <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Add Rate</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={formData.bank_id}
                onChange={(e) => setFormData({ ...formData, bank_id: e.target.value })}
                required
                className="p-2 border rounded dark:bg-gray-700"
                aria-label="Select Bank"
              >
                <option value="">Select Bank</option>
                {banks.map(bank => <option key={bank.id} value={bank.id}>{bank.name}</option>)}
              </select>
              <input
                type="date"
                value={formData.rate_date}
                onChange={(e) => setFormData({ ...formData, rate_date: e.target.value })}
                required
                className="p-2 border rounded dark:bg-gray-700"
                aria-label="Rate Date"
              />
              {terms.map(term => (
                <input
                  key={term.key}
                  type="number"
                  step="0.01"
                  placeholder={`${term.label} Rate`}
                  value={formData[term.key]}
                  onChange={(e) => setFormData({ ...formData, [term.key]: e.target.value })}
                  className="p-2 border rounded dark:bg-gray-700"
                  aria-label={`${term.label} Rate`}
                />
              ))}
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 col-span-2">
                Submit
              </button>
            </form>
          </div>
        )}
    </div>
};

export default App;
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
      <div className="min-h-screen bg-gradient-to-br from-warm-50 via-warm-100 to-warm-200 flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-accent-orange" size={48} />
          <p className="text-warm-700 font-medium">Loading rates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 via-warm-100 to-warm-200 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-warm-900 mb-2 font-display">
                NZ Home Loan Rates Tracker
              </h1>
              <p className="text-warm-700">Compare mortgage rates across New Zealand banks</p>
              {error && (
                <p className="text-accent-terracotta text-sm mt-2 font-medium">⚠️ {error}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3">
              <button
                onClick={fetchRates}
                className="flex items-center gap-2 glass-card bg-white/70 text-warm-900 px-4 py-2 hover:bg-white/90 transition btn-modern"
              >
                <RefreshCw size={18} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={exportData}
                className="flex items-center gap-2 glass-card bg-white/70 text-warm-900 px-4 py-2 hover:bg-white/90 transition btn-modern"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 bg-gradient-to-r from-accent-orange to-accent-terracotta text-white px-4 py-2 rounded-lg hover:shadow-lg transition btn-modern"
              >
                <PlusCircle size={18} />
                <span className="hidden sm:inline">Add Rate</span>
              </button>
            </div>
          </div>
        </header>

        {showAddForm && (
          <div className="glass-card bg-white/90 p-4 md:p-6 mb-6 animate-slide-up">
            <h3 className="text-lg md:text-xl font-bold text-warm-900 mb-4 font-display">Add New Rate Entry</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-warm-800 mb-1">Bank</label>
                <select
                  value={formData.bank_id}
                  onChange={(e) => setFormData({...formData, bank_id: e.target.value})}
                  className="w-full p-2 modern-input bg-warm-50"
                >
                  <option value="">Select Bank</option>
                  {banks.map(bank => (
                    <option key={bank.id} value={bank.id}>{bank.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-warm-800 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.rate_date}
                  onChange={(e) => setFormData({...formData, rate_date: e.target.value})}
                  className="w-full p-2 modern-input bg-warm-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-warm-800 mb-1">1 Year Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.term_1year}
                  onChange={(e) => setFormData({...formData, term_1year: e.target.value})}
                  className="w-full p-2 modern-input bg-warm-50"
                  placeholder="6.50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-warm-800 mb-1">2 Year Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.term_2year}
                  onChange={(e) => setFormData({...formData, term_2year: e.target.value})}
                  className="w-full p-2 modern-input bg-warm-50"
                  placeholder="6.20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-warm-800 mb-1">3 Year Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.term_3year}
                  onChange={(e) => setFormData({...formData, term_3year: e.target.value})}
                  className="w-full p-2 modern-input bg-warm-50"
                  placeholder="5.90"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-warm-800 mb-1">5 Year Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.term_5year}
                  onChange={(e) => setFormData({...formData, term_5year: e.target.value})}
                  className="w-full p-2 modern-input bg-warm-50"
                  placeholder="5.80"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3 flex gap-3">
                <button
                  onClick={handleAddRate}
                  className="bg-gradient-to-r from-accent-orange to-accent-terracotta text-white px-6 py-2 rounded-lg hover:shadow-lg transition btn-modern"
                >
                  Save Rate
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="glass-card bg-white/70 text-warm-700 px-6 py-2 hover:bg-white/90 transition btn-modern"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 glass-card bg-white/85 p-4 md:p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-xl md:text-2xl font-bold text-warm-900 font-display">Rate Trends</h2>
              <div className="flex gap-2 flex-wrap">
                {terms.map(term => (
                  <button
                    key={term.value}
                    onClick={() => setSelectedTerm(term.value)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                      selectedTerm === term.value
                        ? 'bg-gradient-to-r from-accent-orange to-accent-terracotta text-white shadow-md'
                        : 'glass-card bg-white/50 text-warm-700 hover:bg-white/70'
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#ddd0bc" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#685a4f' }}
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-NZ', { month: 'short', year: '2-digit' })}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#685a4f' }}
                    domain={['dataMin - 0.2', 'dataMax + 0.2']}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value) => `${value}%`}
                    labelFormatter={(date) => new Date(date).toLocaleDateString('en-NZ')}
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: 'none', borderRadius: '8px' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  {selectedBanks.map(bank => (
                    <Line
                      key={bank}
                      type="monotone"
                      dataKey={bank}
                      stroke={colors[bank]}
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-96 flex items-center justify-center text-warm-500">
                <div className="text-center">
                  <p className="text-lg mb-2 font-medium">No data available</p>
                  <p className="text-sm">Select banks or add rate data to see trends</p>
                </div>
              </div>
            )}
          </div>

          <div className="glass-card bg-white/85 p-4 md:p-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
            <h2 className="text-xl md:text-2xl font-bold text-warm-900 mb-4 font-display">Select Banks</h2>
            <div className="space-y-2">
              {banks.map(bank => (
                <label
                  key={bank.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-warm-50 cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedBanks.includes(bank.name)}
                    onChange={() => toggleBank(bank.name)}
                    className="w-4 h-4 rounded accent-accent-orange"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-3 h-3 rounded-full shadow-sm"
                      style={{ backgroundColor: colors[bank.name] }}
                    />
                    <span className="text-warm-800 font-medium">{bank.name}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card bg-white/85 p-4 md:p-6 animate-slide-up" style={{animationDelay: '0.2s'}}>
          <h2 className="text-xl md:text-2xl font-bold text-warm-900 mb-4 font-display">
            Current Best Rates - {terms.find(t => t.value === selectedTerm)?.label}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getCurrentRates().slice(0, 6).map((rate, index) => (
              <div
                key={`${rate.bank}-${index}`}
                className="glass-card bg-gradient-to-br from-warm-50/90 to-warm-100/70 p-4 border-l-4 border-accent-orange hover:shadow-lg transition"
                style={{ 
                  borderLeftColor: colors[rate.bank],
                  animation: `slideUp 0.5s ease-out ${index * 0.1}s both`
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-warm-900">{rate.bank}</h3>
                  {index === 0 && (
                    <span className="text-xs bg-gradient-to-r from-accent-orange to-accent-terracotta text-white px-2 py-1 rounded font-semibold badge-accent">
                      Best Rate
                    </span>
                  )}
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-accent-orange to-accent-terracotta bg-clip-text text-transparent mb-2">
                  {rate[`term${selectedTerm}`]}%
                </div>
                <div className="text-xs text-warm-600 font-medium">
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