import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FuturisticBackground } from './components/FuturisticBackground';
import { FuturisticInput } from './components/FuturisticInput';
import { FuturisticButton } from './components/FuturisticButton';
import { FuturisticPortal } from './components/FuturisticPortal';

export default function Discovery() {
  const navigate = useNavigate();
  const [component, setComponent] = useState('');
  const [country, setCountry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [showPortal, setShowPortal] = useState(false);
  const [useMockData, setUseMockData] = useState(false);

  // Mock data for testing
  const mockJobResponse = {
    "_id": "mock-task-id-123456",
    "component": "carbon steel sheets",
    "country": "india",
    "status": "queued",
    "message": "Task queued, waiting to start processing",
    "search_result_id": null,
    "supplier_count": null,
    "started_at": new Date().toISOString(),
    "completed_at": null
  };

  const mockStatusResponse = {
    "_id": "mock-task-id-123456",
    "component": "carbon steel sheets",
    "country": "india",
    "status": "completed",
    "message": "Task completed successfully. Found 6 suppliers, saved 6.",
    "search_result_id": "mock-search-result-id",
    "supplier_count": 6,
    "started_at": new Date().toISOString(),
    "completed_at": new Date(Date.now() + 3000).toISOString()
  };

  const mockResults = [
    {
      "_id": "mock-supplier-1",
      "name": "Tata Steel",
      "website": "www.tatasteel.com",
      "location": "Mumbai, India",
      "product": "HR coils, CR coils, cold rolled sheets, galvanized steel sheets",
      "component_type": "carbon steel sheets",
      "country": "india",
      "lead_time_days": 35,
      "min_order_qty": 3000,
      "certifications": [
        "ISO 9001:2015",
        "ISO 14001:2015",
        "ResponsibleSteel Certification"
      ],
      "summary": "Tata Steel represents a century-old legacy of steel manufacturing with world-class quality and sustainability credentials.",
      "created_at": new Date().toISOString()
    },
    {
      "_id": "mock-supplier-2",
      "name": "JSW Steel",
      "website": "www.jsw.in/steel",
      "location": "Mumbai, India",
      "product": "Carbon steel sheets, HR coils, CR coils, galvanized sheets",
      "component_type": "carbon steel sheets",
      "country": "india",
      "lead_time_days": 28,
      "min_order_qty": 5000,
      "certifications": [
        "ISO 9001",
        "ISO 14001"
      ],
      "summary": "JSW Steel is a leading integrated steel manufacturer with extensive R&D capabilities.",
      "created_at": new Date().toISOString()
    }
  ];

  const fetchSuppliers = async (component: string, country: string) => {
    try {
      console.log("Submitting job to backend...");
      
      // Use mock data or real API based on toggle
      if (useMockData) {
        console.log("Using mock data (no API calls will be made)");
        
        // 1. Mock job submission
        console.log("Mock job submitted successfully:", mockJobResponse);
        
        // 2. Mock status polling
        console.log("Simulating status polling...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log("Mock job status:", mockStatusResponse);
        
        // 3. Mock results
        console.log("Mock job completed, fetching mock results...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Received mock results:", mockResults);
        
        // Update state with mock results
        setSuppliers(mockResults);
        const summary = `Found ${mockResults.length} suppliers for ${component} in ${country} (MOCK DATA).`;
        setSummary(summary);
        
        // Show portal animation instead of results
        setShowPortal(true);
        
        return;
      }
      
      // Real API implementation
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
        
        // Show portal animation instead of results
        setShowPortal(true);
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
    // Reset portal when form inputs change
    if (showPortal) {
      setShowPortal(false);
    }
  }, [component, country]);
  
  // When portal animation completes, navigate to results page
  const handlePortalComplete = () => {
    // Store data in sessionStorage for the results page
    sessionStorage.setItem('suppliers', JSON.stringify(suppliers));
    sessionStorage.setItem('summary', summary);
    sessionStorage.setItem('query', JSON.stringify({ component, country }));
    
    // Navigate to results page
    navigate('/results');
  };

  return (
    <div className="min-h-screen text-white overflow-hidden">
      {/* Futuristic animated background */}
      <FuturisticBackground />
      
      {/* Portal overlay - appears when results are ready */}
      <AnimatePresence>
        {showPortal && (
          <FuturisticPortal onAnimationComplete={handlePortalComplete} />
        )}
      </AnimatePresence>
      
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
            {/* Mock data toggle */}
            <div className="flex items-center justify-end mb-4">
              <span className="text-sm text-gray-400 mr-2">Test Mode</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={useMockData}
                  onChange={() => setUseMockData(!useMockData)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>
            
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
        </motion.div>
        
        {/* Footer attribution */}
        <motion.div 
          className="absolute bottom-4 text-xs text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 1.5 }}
        >
          Powered by AI Sourcing Technology
          {useMockData && <span className="ml-1 text-cyan-500">(Test Mode)</span>}
        </motion.div>
      </div>
    </div>
  );
}