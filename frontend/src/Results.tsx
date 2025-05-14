import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FuturisticBackground } from './components/FuturisticBackground';
import { FuturisticButton } from './components/FuturisticButton';
import { SupplierResults } from './components/SupplierResults';

export default function Results() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [summary, setSummary] = useState('');
  const [query, setQuery] = useState<{ component: string, country: string }>({ component: '', country: '' });
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Get data from sessionStorage
    try {
      const suppliersData = sessionStorage.getItem('suppliers');
      const summaryData = sessionStorage.getItem('summary');
      const queryData = sessionStorage.getItem('query');
      
      if (suppliersData && summaryData && queryData) {
        setSuppliers(JSON.parse(suppliersData));
        setSummary(summaryData);
        setQuery(JSON.parse(queryData));
        
        // Animate in after a brief delay
        setTimeout(() => setIsLoaded(true), 300);
      } else {
        // No data found, go back to discovery
        navigate('/');
      }
    } catch (error) {
      console.error('Error retrieving results:', error);
      navigate('/');
    }
  }, [navigate]);
  
  return (
    <div className="min-h-screen text-white">
      {/* Futuristic animated background */}
      <FuturisticBackground />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen container mx-auto px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          <motion.div 
            className="flex items-center mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <button 
              onClick={() => navigate('/')}
              className="mr-4 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-3xl font-light text-gradient">
              Supplier Results
            </h1>
          </motion.div>
          
          <motion.div
            className="mb-8 backdrop-blur-lg bg-black/20 p-6 rounded-xl border border-gray-700/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-xl mb-2 text-cyan-300">Search Query</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Component</p>
                <p className="text-lg">{query.component}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Country</p>
                <p className="text-lg">{query.country}</p>
              </div>
            </div>
          </motion.div>
          
          {/* Staggered entrance for supplier cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <SupplierResults 
              suppliers={suppliers}
              summary={summary} 
            />
          </motion.div>
          
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <FuturisticButton
              onClick={() => navigate('/')}
            >
              New Search
            </FuturisticButton>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
