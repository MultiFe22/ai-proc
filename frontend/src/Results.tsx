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
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Add scroll listener to show/hide back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
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
            <h2 className="text-xl mb-3 text-cyan-300">Search Query</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  <p className="text-gray-300 text-sm font-medium">Component</p>
                </div>
                <p className="text-lg ml-7">{query.component}</p>
              </div>
              <div>
                <div className="flex items-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-300 text-sm font-medium">Country</p>
                </div>
                <p className="text-lg ml-7">{query.country}</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-700/40 flex justify-end">
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-sm text-cyan-400 hover:text-cyan-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                New Search
              </button>
            </div>
          </motion.div>
          
          {/* Staggered entrance for supplier cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="max-w-6xl mx-auto"
          >
            <SupplierResults 
              suppliers={suppliers}
              summary={summary} 
            />
          </motion.div>
          
          <motion.div
            className="mt-12 text-center"
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
        
        {/* Back to Top floating button */}
        <motion.button
          className="fixed right-6 bottom-6 p-3 rounded-full bg-cyan-600 text-white shadow-lg z-50"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: showScrollTop ? 1 : 0, 
            scale: showScrollTop ? 1 : 0.8,
            y: showScrollTop ? 0 : 20
          }}
          transition={{ duration: 0.3 }}
          onClick={() => {
            window.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
          }}
          aria-label="Back to top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}
