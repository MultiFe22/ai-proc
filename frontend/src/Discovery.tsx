import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FuturisticBackground } from './components/FuturisticBackground';
import { FuturisticInput } from './components/FuturisticInput';
import { FuturisticButton } from './components/FuturisticButton';
import { FuturisticPortal } from './components/FuturisticPortal';
import { FuturisticToggle } from './components/FuturisticToggle';
import { FuturisticLoader } from './components/FuturisticLoader';

export default function Discovery() {
  const navigate = useNavigate();
  const [component, setComponent] = useState('');
  const [country, setCountry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [showPortal, setShowPortal] = useState(false);
  const [useMockData, setUseMockData] = useState(false);
  
  // Debug mode states
  const [debugMode, setDebugMode] = useState(false);
  const [taskId, setTaskId] = useState('');
  
  // Loading state
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Initializing search...');
  const [isError, setIsError] = useState(false);

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
      
      // Debug mode - directly check task status and fetch results
      if (debugMode && taskId) {
        console.log(`Debug mode: Checking existing task ${taskId}`);
        
        // Show loading progress
        setLoadingMessage(`Checking task ID: ${taskId}...`);
        setLoadingProgress(10);
        
        // Skip job submission and go straight to status check
        let taskCompleted = false;
        let statusData;
        let pollCount = 0;
        const maxPolls = 5; // Keep polls lower for debug mode
        
        while (!taskCompleted) {
          pollCount++;
          console.log(`Checking status for job ${taskId}...`);
          
          // Update loading UI
          setLoadingProgress(10 + Math.min(60, (pollCount / maxPolls) * 60));
          
          try {
            const statusRes = await fetch(`http://localhost:8000/discovery/tasks/${taskId}`);
            if (!statusRes.ok) {
              setLoadingMessage(`Error checking task: ${statusRes.statusText}`);
              throw new Error(`Status check failed: ${statusRes.statusText}`);
            }
            
            statusData = await statusRes.json();
            console.log("Current job status:", statusData);
            
            // Update loading message based on status
            if (statusData.message) {
              setLoadingMessage(statusData.message);
            }
            
            if (statusData.status === 'completed' || statusData.status === 'failed') {
              taskCompleted = true;
              setLoadingProgress(70);
            } else {
              // Wait 2 seconds before checking again in debug mode
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          } catch (error) {
            console.error("Error fetching task status:", error);
            setLoadingMessage(`Error: Failed to check task status. Please try again.`);
            return; // Exit on error
          }
        }
        
        if (statusData.status === 'completed') {
          console.log("Job completed, fetching results from debug task ID...");
          setLoadingMessage('Fetching supplier data from task...');
          setLoadingProgress(80);
          
          try {
            const resultsRes = await fetch(`http://localhost:8000/discovery/tasks/${taskId}/results`);
            if (!resultsRes.ok) {
              setLoadingMessage(`Error fetching results: ${resultsRes.statusText}`);
              throw new Error(`Results request failed: ${resultsRes.statusText}`);
            }
            
            const supplierData = await resultsRes.json();
            console.log("Debug mode: Received results:", supplierData);
            
            // Update component and country from status data
            if (statusData.component) setComponent(statusData.component);
            if (statusData.country) setCountry(statusData.country);
            
            // Update state with the results
            setSuppliers(supplierData || []);
            
            const summary = `Found ${supplierData.length} suppliers for ${statusData.component || component} in ${statusData.country || country} (DEBUG MODE).`;
            setSummary(summary);
            
            setLoadingProgress(100);
            setLoadingMessage('Data ready!');
            
            // Short delay before showing portal for better UX
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Show portal animation
            setShowPortal(true);
          } catch (error) {
            console.error("Error fetching results:", error);
            setLoadingMessage(`Error: Failed to fetch results for task ${taskId}`);
          }
          return;
        } else {
          console.error("Debug task failed or not completed:", statusData.message);
          setLoadingMessage(`Task failed: ${statusData.message || 'Unknown error'}`);
          return;
        }
      }
      
      // Use mock data or real API based on toggle
      if (useMockData) {
        console.log("Using mock data (no API calls will be made)");
        
        // 1. Mock job submission
        setLoadingMessage('Submitting mock job...');
        setLoadingProgress(10);
        console.log("Mock job submitted successfully:", mockJobResponse);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // 2. Mock status polling
        setLoadingMessage('Processing request...');
        setLoadingProgress(30);
        console.log("Simulating status polling...");
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        setLoadingMessage('Finding suppliers for component...');
        setLoadingProgress(50);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        console.log("Mock job status:", mockStatusResponse);
        
        // 3. Mock results
        setLoadingMessage('Preparing results...');
        setLoadingProgress(80);
        console.log("Mock job completed, fetching mock results...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Received mock results:", mockResults);
        
        // Update state with mock results
        setSuppliers(mockResults);
        const summary = `Found ${mockResults.length} suppliers for ${component} in ${country} (MOCK DATA).`;
        setSummary(summary);
        
        setLoadingProgress(100);
        setLoadingMessage('Data ready!');
        await new Promise(resolve => setTimeout(resolve, 500));
        
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
      let pollCount = 0;
      const maxPolls = 10; // Assuming max 10 polls for 100% progress
      
      setLoadingMessage('Searching for suppliers...');
      setLoadingProgress(10); // Initial progress after job submission
      
      while (!taskCompleted) {
        pollCount++;
        console.log(`Checking status for job ${jobId}...`);
        
        // Update progress based on poll count (10-90%)
        setLoadingProgress(10 + Math.min(80, (pollCount / maxPolls) * 80));
        
        const statusRes = await fetch(`http://localhost:8000/discovery/tasks/${jobId}`);
        if (!statusRes.ok) throw new Error(`Status check failed: ${statusRes.statusText}`);
        
        statusData = await statusRes.json();
        console.log("Current job status:", statusData);
        
        // Update loading message based on status
        if (statusData.message) {
          setLoadingMessage(statusData.message);
        }
        
        if (statusData.status === 'completed' || statusData.status === 'failed') {
          taskCompleted = true;
          setLoadingProgress(90); // Nearly complete
        } else {
          // Wait 3 seconds before checking again
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      // 3. Fetch results if job was successful
      if (statusData.status === 'completed') {
        console.log("Job completed successfully, fetching results...");
        setLoadingMessage('Preparing supplier data...');
        
        const resultsRes = await fetch(`http://localhost:8000/discovery/tasks/${jobId}/results`);
        if (!resultsRes.ok) throw new Error(`Results request failed: ${resultsRes.statusText}`);
        
        const supplierData = await resultsRes.json();
        console.log("Received results:", supplierData);
        
        // Update state with the results (suppliers list)
        setSuppliers(supplierData || []);
        
        // Create a summary based on the results
        const summary = `Found ${supplierData.length} suppliers for ${component} in ${country}.`;
        setSummary(summary);
        
        setLoadingProgress(100); // Complete
        setLoadingMessage('Supplier data ready!');
        
        // Short delay before showing portal for better UX
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Show portal animation instead of results
        setShowPortal(true);
      } else {
        console.error("Job failed:", statusData.message);
      }
      
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
      setIsError(true);
      setLoadingMessage(`Error: ${error instanceof Error ? error.message : 'Failed to fetch suppliers'}. Please try again.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsError(false); // Reset error state
    
    if (debugMode && taskId) {
      // In debug mode, we use the task ID directly
      await fetchSuppliers('', ''); // Component and country will be updated from the task data
    } else {
      // Normal mode
      await fetchSuppliers(component, country);
    }
    
    // Only set loading to false if there's no error (in error case we want to keep the loader visible)
    if (!isError) {
      setIsLoading(false);
    }
  };

  // Retry function when there's an error
  const handleRetry = async () => {
    setIsError(false);
    if (debugMode && taskId) {
      await fetchSuppliers('', '');
    } else {
      await fetchSuppliers(component, country);
    }
  };

  useEffect(() => {
    // Reset portal when form inputs change
    if (showPortal) {
      setShowPortal(false);
    }
  }, [component, country, debugMode, taskId]);
  
  // Toggle between mock data and debug mode
  const handleModeToggle = (mode: string) => {
    if (mode === 'mock') {
      setUseMockData(true);
      setDebugMode(false);
    } else if (mode === 'debug') {
      setUseMockData(false);
      setDebugMode(true);
    } else {
      setUseMockData(false);
      setDebugMode(false);
    }
  };
  
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
      
      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && !showPortal && (
          <FuturisticLoader 
            isVisible={isLoading} 
            message={loadingMessage}
            progress={loadingProgress}
            isError={isError}
            onRetry={handleRetry}
          />
        )}
      </AnimatePresence>
      
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
            {/* Debug controls */}
            <motion.div 
              className="mb-8 backdrop-blur-sm bg-black/20 p-4 rounded-lg border border-gray-700/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm text-cyan-400 font-medium">Debug Options</h3>
                <div className="text-xs text-gray-500">Advanced Settings</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FuturisticToggle
                  id="mockDataToggle"
                  label="Use Mock Data"
                  isChecked={useMockData}
                  onChange={() => {
                    handleModeToggle(useMockData ? 'none' : 'mock');
                  }}
                  color="purple"
                />
                
                <FuturisticToggle
                  id="debugModeToggle"
                  label="Debug Mode (Task ID)"
                  isChecked={debugMode}
                  onChange={() => {
                    handleModeToggle(debugMode ? 'none' : 'debug');
                  }}
                  color="cyan"
                />
              </div>
            </motion.div>
            
            <form onSubmit={handleSubmit}>
              {/* Debug task ID input */}
              <AnimatePresence>
                {debugMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 backdrop-blur-sm bg-black/20 p-4 rounded-lg border border-cyan-900/40"
                  >
                    <div className="flex items-center mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                      <h3 className="text-sm text-cyan-400 font-medium">Task ID Lookup</h3>
                    </div>
                    
                    <FuturisticInput
                      id="taskId"
                      label="Task ID"
                      value={taskId}
                      onChange={(e) => setTaskId(e.target.value)}
                      placeholder="Enter existing task ID"
                    />
                    <p className="text-xs text-cyan-400 mt-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Use this to check results of a previously submitted job
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Regular form inputs - hide when in debug mode with a task ID */}
              <AnimatePresence>
                {(!debugMode || !taskId) && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
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
                  </motion.div>
                )}
              </AnimatePresence>
              
              <motion.div 
                className="mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
              >
                <FuturisticButton 
                  type="submit" 
                  disabled={isLoading || (debugMode && !taskId)} 
                  isLoading={isLoading}
                >
                  {isLoading ? 'Processing...' : debugMode ? 'Load Results' : 'Find Suppliers'}
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
          {useMockData && <span className="ml-1 text-cyan-500">(Mock Mode)</span>}
          {debugMode && <span className="ml-1 text-cyan-500">(Debug Mode)</span>}
        </motion.div>
      </div>
    </div>
  );
}