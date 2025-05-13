import { motion } from 'framer-motion';

interface Supplier {
  id: string;
  name: string;
  location: string;
  rating?: number;
  [key: string]: any;
}

interface SupplierResultsProps {
  suppliers: Supplier[];
  summary: string;
}

export const SupplierResults = ({ suppliers, summary }: SupplierResultsProps) => {
  if (suppliers.length === 0) {
    return null;
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      className="mt-10 text-left"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="bg-gray-800/40 backdrop-blur-lg p-6 rounded-xl border border-gray-700/50 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-xl font-medium text-cyan-300 mb-3">Summary</h2>
        <p className="text-gray-200 leading-relaxed">{summary}</p>
      </motion.div>

      <h2 className="text-xl font-medium text-cyan-300 mb-4">Suppliers ({suppliers.length})</h2>
      
      <motion.div 
        className="space-y-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {suppliers.map((supplier, index) => (
          <motion.div 
            key={supplier.id || index}
            className="group bg-gray-800/30 backdrop-blur-md p-6 rounded-lg border border-gray-700/30 transition-all duration-300 hover:bg-gray-800/50 hover:border-cyan-500/30"
            variants={item}
            whileHover={{ scale: 1.01, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
          >
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-medium text-white group-hover:text-cyan-300 transition-colors">{supplier.name}</h3>
              {supplier.rating && (
                <div className="flex items-center bg-cyan-900/30 px-3 py-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-400 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                  <span className="text-sm font-medium text-cyan-300">{supplier.rating}</span>
                </div>
              )}
            </div>
            <p className="text-gray-400 mt-1">{supplier.location}</p>
            
            {/* Additional supplier details would go here */}
            <div className="mt-4 pt-4 border-t border-gray-700/30">
              <button className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors flex items-center">
                View details
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};
