import { useState } from 'react';

export default function Discovery() {
  const [component, setComponent] = useState('');
  const [country, setCountry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [summary, setSummary] = useState<string>('');

  const fetchSuppliers = async (component: string, country: string) => {
    try {
      // send initial query
      const queryRes = await fetch('/api/discovery/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ component, country }),
      });
      if (!queryRes.ok) throw new Error(`Query request failed: ${queryRes.statusText}`);

      // fetch results
      const params = new URLSearchParams({ component, country });
      const resultsRes = await fetch(`/api/discovery/results?${params.toString()}`);
      if (!resultsRes.ok) throw new Error(`Results request failed: ${resultsRes.statusText}`);

      const resultsData = await resultsRes.json();
      setSuppliers(resultsData.suppliers || []);
      setSummary(resultsData.summary || '');
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await fetchSuppliers(component, country);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">What are you sourcing today?</h1>
        <p className="text-lg text-gray-600 mb-10">
          Tell us the component and country — we’ll find suppliers for you.
        </p>
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">
          <div>
            <label htmlFor="component" className="block text-sm font-medium text-gray-700 mb-1">
              Component
            </label>
            <input
              id="component"
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter component name"
              value={component}
              onChange={(e) => setComponent(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <input
              id="country"
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Loading...' : 'Find Suppliers'}
          </button>
        </form>
      </div>
    </div>
  );
}