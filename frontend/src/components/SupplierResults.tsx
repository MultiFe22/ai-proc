import { useState } from 'react';
import { motion } from 'framer-motion';
import { FuturisticDataCard } from './FuturisticDataCard';

interface Supplier {
  _id: string;
  name: string;
  website: string;
  location: string;
  product: string;
  component_type: string;
  country: string;
  lead_time_days: number;
  min_order_qty: number;
  certifications: string[];
  summary: string;
  created_at: string;
}

interface SupplierResultsProps {
  suppliers: Supplier[];
  summary: string;
}

export const SupplierResults = ({ suppliers, summary }: SupplierResultsProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortCriteria, setSortCriteria] = useState<string>('default');

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };
  
  if (suppliers.length === 0) {
    return null;
  }
  
  // Calculate summary metrics
  const avgLeadTime = suppliers.reduce((sum, s) => sum + s.lead_time_days, 0) / suppliers.length;
  const minLeadTime = Math.min(...suppliers.map(s => s.lead_time_days));
  const maxLeadTime = Math.max(...suppliers.map(s => s.lead_time_days));
  const avgMinOrder = suppliers.reduce((sum, s) => sum + s.min_order_qty, 0) / suppliers.length;
  
  // Sort suppliers based on criteria
  const sortedSuppliers = [...suppliers].sort((a, b) => {
    switch (sortCriteria) {
      case 'lead-time-asc':
        return a.lead_time_days - b.lead_time_days;
      case 'lead-time-desc':
        return b.lead_time_days - a.lead_time_days;
      case 'min-order-asc':
        return a.min_order_qty - b.min_order_qty;
      case 'min-order-desc':
        return b.min_order_qty - a.min_order_qty;
      case 'certifications':
        return b.certifications.length - a.certifications.length;
      default:
        return 0;
    }
  });
  
  // Helper function to determine lead time rating
  const getLeadTimeRating = (days: number) => {
    if (days <= minLeadTime + (maxLeadTime - minLeadTime) * 0.3) return { class: 'bg-green-500', text: 'Fast' };
    if (days <= minLeadTime + (maxLeadTime - minLeadTime) * 0.7) return { class: 'bg-yellow-500', text: 'Moderate' };
    return { class: 'bg-red-400', text: 'Slow' };
  };

  return (
    <motion.div 
      className="mt-10 text-left"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Summary Section */}
      <motion.div
        className="bg-gray-800/40 backdrop-blur-lg p-6 rounded-xl border border-gray-700/50 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-xl font-medium text-cyan-300 mb-4">{summary}</h2>
        
        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <FuturisticDataCard
            title="Suppliers Found"
            value={suppliers.length}
            color="cyan"
            highlight={true}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
          
          <FuturisticDataCard
            title="Avg. Lead Time"
            value={`${avgLeadTime.toFixed(0)} days`}
            color="amber"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          
          <FuturisticDataCard
            title="Min. Order Qty"
            value={avgMinOrder.toLocaleString(undefined, {maximumFractionDigits: 0})}
            color="purple"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
          
          <FuturisticDataCard
            title="Certifications"
            value={Array.from(new Set(suppliers.flatMap(s => s.certifications))).length}
            color="green"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            }
          />
        </div>
        
        {/* Sort Controls */}
        <div className="mt-6">
          <label className="text-sm text-gray-400 mr-3">Sort by:</label>
          <select 
            className="bg-black/30 text-white border border-gray-700 rounded-lg px-3 py-1"
            value={sortCriteria}
            onChange={(e) => setSortCriteria(e.target.value)}
          >
            <option value="default">Default</option>
            <option value="lead-time-asc">Fastest Lead Time</option>
            <option value="lead-time-desc">Slowest Lead Time</option>
            <option value="min-order-asc">Lowest Min. Order</option>
            <option value="min-order-desc">Highest Min. Order</option>
            <option value="certifications">Most Certifications</option>
          </select>
        </div>
      </motion.div>

      <h2 className="text-xl font-medium text-cyan-300 mb-4">Suppliers ({suppliers.length})</h2>
      
      {/* Supplier Cards */}
      <div className="space-y-5">
        {sortedSuppliers.map((supplier, index) => {
          const leadTimeRating = getLeadTimeRating(supplier.lead_time_days);
          const isExpanded = expandedId === supplier._id;
          
          return (
            <motion.div 
              key={supplier._id}
              className={`backdrop-blur-md rounded-xl border shadow-lg overflow-hidden
                ${isExpanded ? 'border-cyan-500/50' : 'border-gray-700/40'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Card Header - Always Visible */}
              <div 
                className="flex flex-col md:flex-row md:items-center justify-between p-5 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleExpand(supplier._id)}
              >
                <div className="flex-1">
                  <h3 className="text-xl font-medium text-white mb-1">{supplier.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <div className="text-gray-300 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{supplier.location}</span>
                    </div>
                    <div className="text-gray-300 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <a href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="text-cyan-400 hover:text-cyan-300"
                         onClick={(e) => e.stopPropagation()}>
                        {supplier.website}
                      </a>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm line-clamp-2">{supplier.product}</p>
                </div>
                <div className="flex gap-4 mt-4 md:mt-0">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Lead Time</p>
                    <div className="flex items-center mt-1">
                      <span className={`w-3 h-3 rounded-full ${leadTimeRating.class} mr-2`}></span>
                      <span className="text-sm">{supplier.lead_time_days} days</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Min. Order</p>
                    <p className="text-sm">{supplier.min_order_qty.toLocaleString()} units</p>
                  </div>
                </div>
              </div>
              
              {/* Expandable Content */}
              <motion.div
                initial={false}
                animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden bg-black/30"
              >
                <div className="p-5 border-t border-gray-700/40">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Overview</h4>
                      <p className="text-gray-200">{supplier.summary}</p>
                      
                      <h4 className="text-sm font-medium text-gray-400 mt-4 mb-2">Products</h4>
                      <p className="text-gray-200">{supplier.product}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Certifications</h4>
                      {supplier.certifications.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {supplier.certifications.map((cert, i) => (
                            <span 
                              key={i}
                              className="px-2 py-1 bg-cyan-900/30 text-cyan-100 text-xs rounded-md border border-cyan-700/30"
                            >
                              {cert}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400">No certifications listed</p>
                      )}
                      
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Business Details</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex justify-between">
                            <span className="text-gray-400">Lead Time:</span>
                            <span className="text-white">{supplier.lead_time_days} days</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-400">Minimum Order:</span>
                            <span className="text-white">{supplier.min_order_qty.toLocaleString()} units</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-400">Component Type:</span>
                            <span className="text-white">{supplier.component_type}</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <button
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`mailto:contact@${supplier.website.replace('www.', '').split('/')[0]}`, '_blank');
                      }}
                    >
                      Contact Supplier
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
