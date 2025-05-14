import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FuturisticBackground } from './components/FuturisticBackground';
import { FuturisticInput } from './components/FuturisticInput';
import { FuturisticButton } from './components/FuturisticButton';
import { SupplierResults } from './components/SupplierResults';

export default function Discovery() {
  const [component, setComponent] = useState('');
  const [country, setCountry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [showResults, setShowResults] = useState(false);

  const fetchSuppliers = async (component: string, country: string) => {
    try {
      console.log("Submitting job to backend...");
      
      // 1. Submit job to the async endpoint
      const queryRes = await fetch('http://localhost:8000/discovery/query/async', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ component, country }),
      });
      
      if (!queryRes.ok) throw new Error(`Query request failed: ${queryRes.statusText}`);
      
      const jobData = await queryRes.json();
      const jobId = jobData._id;
      
      console.log("Job submitted successfully:", jobData);
      
      // 2. Poll for job status
      let taskCompleted = false;
      let statusData;
      
      while (!taskCompleted) {
        console.log(`Checking status for job ${jobId}...`);
        
        const statusRes = await fetch(`http://localhost:8000/discovery/tasks/${jobId}`);
        if (!statusRes.ok) throw new Error(`Status check failed: ${statusRes.statusText}`);
        
        statusData = await statusRes.json();
        console.log("Current job status:", statusData);
        
        if (statusData.status === 'completed' || statusData.status === 'failed') {
          taskCompleted = true;
        } else {
          // Wait 3 seconds before checking again
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      // 3. Fetch results if job was successful
      if (statusData.status === 'completed') {
        console.log("Job completed successfully, fetching results...");
        
        const resultsRes = await fetch(`http://localhost:8000/discovery/tasks/${jobId}/results`);
        if (!resultsRes.ok) throw new Error(`Results request failed: ${resultsRes.statusText}`);
        
        const supplierData = await resultsRes.json();
        console.log("Received results:", supplierData);
        
        // Update state with the results (suppliers list)
        setSuppliers(supplierData || []);
        
        // Create a summary based on the results
        const summary = `Found ${supplierData.length} suppliers for ${component} in ${country}.`;
        setSummary(summary);
        setShowResults(true);
      } else {
        console.error("Job failed:", statusData.message);
      }
      
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

  useEffect(() => {
    // Reset showResults when form inputs change
    if (showResults) {
      setShowResults(false);
    }
  }, [component, country]);

  return (
    <div className="min-h-screen text-white overflow-hidden">
      {/* Futuristic animated background */}
      <FuturisticBackground />
      
      {/* Content overlay */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <motion.div 
          className="max-w-md w-full"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="text-center mb-10">
            <motion.div
              className="mb-2 inline-block"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <svg className="w-16 h-16 mx-auto mb-4 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </motion.div>
            
            <motion.h1 
              className="text-4xl font-light mb-2 text-gradient"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              What are you sourcing today?
            </motion.h1>
            
            <motion.p 
              className="text-lg text-gray-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Tell us the component and country — we'll find suppliers for you.
            </motion.p>
          </div>
          
          {/* Form */}
          <motion.div
            className="backdrop-blur-lg bg-black/20 p-8 rounded-2xl border border-gray-700/40 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <form onSubmit={handleSubmit}>
              <FuturisticInput
                id="component"
                label="Component"
                value={component}
                onChange={(e) => setComponent(e.target.value)}
                placeholder="Enter component name"
              />
              
              <FuturisticInput
                id="country"
                label="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Enter country"
              />
              
              <motion.div 
                className="mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
              >
                <FuturisticButton 
                  type="submit" 
                  disabled={isLoading} 
                  isLoading={isLoading}
                >
                  {isLoading ? 'Searching...' : 'Find Suppliers'}
                </FuturisticButton>
              </motion.div>
            </form>
          </motion.div>
          
          {/* Results */}
          <AnimatePresence>
            {showResults && (
              <motion.div
                key="results"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5 }}
              >
                <SupplierResults 
                  suppliers={suppliers} 
                  summary={summary} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Footer attribution */}
        <motion.div 
          className="absolute bottom-4 text-xs text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 1.5 }}
        >
          Powered by AI Sourcing Technology
        </motion.div>
      </div>
    </div>
  );
}