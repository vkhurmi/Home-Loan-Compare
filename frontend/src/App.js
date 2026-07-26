import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PlusCircle, Moon, Sun, Calculator, User, LogOut } from 'lucide-react';

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
    ANZ: '#0066CC',
    ASB: '#ED1C24',
    BNZ: '#00A9E0',
    Westpac: '#DA1710',
    Kiwibank: '#8DC63F',
    TSB: '#007A33',
    SBS: '#FF6600',
    'Cooperative Bank': '#009639',
    HSBC: '#DB0011',
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
        fetch(`${API_URL}/api/rates`)
      ]);

      if (!banksRes.ok || !ratesRes.ok) throw new Error('Failed to fetch data');

      const banksData = await banksRes.json();
      const ratesData = await ratesRes.json();

      setBanks(banksData);
      setRates(ratesData);
      setSelectedBanks(banksData.map(bank => bank.id));
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

  const getChartData = () => {
    const termKey = terms.find(t => t.value === selectedTerm)?.key;
    const dataMap = new Map();

    rates
      .filter(rate => selectedBanks.length === 0 || selectedBanks.includes(rate.bank_id))
      .forEach(rate => {
        const date = rate.rate_date || rate.date;
        if (!dataMap.has(date)) {
          dataMap.set(date, { date });
        }
        const entry = dataMap.get(date);
        const bankName = rate.bank_name || rate.bank;
        const value = parseFloat(rate[termKey]);
        if (!isNaN(value)) {
          entry[bankName] = value;
        }
      });

    return Array.from(dataMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getCurrentRates = () => {
    const termKey = terms.find(t => t.value === selectedTerm)?.key;
    const latestByBank = new Map();

    rates
      .filter(rate => selectedBanks.length === 0 || selectedBanks.includes(rate.bank_id))
      .forEach(rate => {
        const bankName = rate.bank_name || rate.bank;
        const existing = latestByBank.get(bankName);
        const rateDate = new Date(rate.rate_date || rate.date);
        if (!existing || rateDate > new Date(existing.rate_date || existing.date)) {
          latestByBank.set(bankName, rate);
        }
      });

    return Array.from(latestByBank.values()).map(rate => ({
      bank: rate.bank_name || rate.bank,
      rate: parseFloat(rate[termKey]) || 0,
      date: rate.rate_date || rate.date
    }));
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
          <h1 className="text-2xl font-bold">NZ Loan Tracker</h1>
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
              <ResponsiveContainer width="100%" height={450}>
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('en-NZ', { month: 'short', year: '2-digit' })} />
                  <YAxis tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value) => `${value}%`} labelFormatter={(date) => new Date(date).toLocaleDateString('en-NZ')} />
                  <Legend />
                  {banks
                    .filter(bank => selectedBanks.length === 0 || selectedBanks.includes(bank.id))
                    .map(bank => (
                      <Line
                        key={bank.id}
                        type="monotone"
                        dataKey={bank.name}
                        stroke={colors[bank.name] || '#8884d8'}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            )}

            {!loading && !error && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                {getCurrentRates().map((current) => {
                  const accent = colors[current.bank] || '#8884d8';
                  return (
                    <div
                      key={current.bank}
                      className="flex items-center justify-between p-4 rounded-lg border bg-slate-50 dark:bg-slate-900 transition-shadow duration-200 hover:shadow-xl hover:-translate-y-0.5"
                      style={{ borderColor: accent, borderWidth: '1px', borderStyle: 'solid' }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: accent }} />
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{current.bank}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">As of {new Date(current.date).toLocaleDateString('en-NZ')}</p>
                        </div>
                      </div>
                      <div className="text-2xl font-semibold text-slate-900 dark:text-white">
                        {current.rate}%
                      </div>
                    </div>
                  );
                })}
              </div>
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
      </main>
    </div>
  );
};

export default App;