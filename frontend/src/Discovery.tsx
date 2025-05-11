import { useState } from 'react';

export default function Discovery() {
  const [component, setComponent] = useState('');
  const [country, setCountry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [activeDevices] = useState(7); // Visual element to match the aesthetics

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
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Header Card with Profile */}
        <div className="col-span-1 md:col-span-2 bg-yellow-300 rounded-3xl p-4 flex items-center">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white rounded-full overflow-hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-gray-400 p-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-4 text-left">
              <h2 className="font-bold">Hi, Sourcing Manager</h2>
              <p className="text-sm">{activeDevices} suppliers found</p>
            </div>
          </div>
          <div className="ml-auto">
            <button className="p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Main Form Panel */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="bg-black bg-opacity-10 p-2 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-xl">Sourcing Analytics</h3>
              <p className="text-sm text-gray-500">Find the right suppliers</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-5">
              <label htmlFor="component" className="block text-sm font-medium text-gray-700 mb-2">
                Component
              </label>
              <div className="flex items-center">
                <div className="bg-white p-3 rounded-xl mr-3 text-lg">
                  📦
                </div>
                <input
                  id="component"
                  type="text"
                  className="flex-1 py-3 px-4 bg-white border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Enter component name"
                  value={component}
                  onChange={(e) => setComponent(e.target.value)}
                />
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-5">
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <div className="flex items-center">
                <div className="bg-white p-3 rounded-xl mr-3 text-lg">
                  🌎
                </div>
                <input
                  id="country"
                  type="text"
                  className="flex-1 py-3 px-4 bg-white border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Enter country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-2xl shadow-sm disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Searching...' : 'Find Suppliers'}
              </button>
              
              <button
                type="button"
                className="bg-gray-100 hover:bg-gray-200 p-4 rounded-2xl"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          </form>
        </div>
        
        {/* Results Section - Only show when there are results */}
        {suppliers.length > 0 && (
          <>
            <div className="col-span-1 md:col-span-2 bg-white rounded-3xl p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="font-bold text-xl">Summary</h3>
                <p className="text-gray-600">{summary}</p>
              </div>
              
              {/* Supplier Cards */}
              <div className="space-y-4">
                {suppliers.map((supplier, index) => (
                  <div key={index} className="bg-gray-50 rounded-2xl p-4 flex items-center">
                    <div className="bg-white p-3 rounded-xl mr-3">
                      <span className="text-lg">🏢</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{supplier.name}</h4>
                      <p className="text-sm text-gray-500">{supplier.location}</p>
                    </div>
                    <button className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-center">
                <button className="bg-black text-white px-6 py-2 rounded-full text-sm">
                  See All Results
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}