import { motion } from 'framer-motion';

export default function StatusBadge({ status, size = 'sm' }) {
  const colorMap = {
    'Received': 'bg-blue-100 text-blue-700 border-blue-200',
    'Stored': 'bg-purple-100 text-purple-700 border-purple-200',
    'Ready for Dispatch': 'bg-amber-100 text-amber-700 border-amber-200',
    'Ready For Dispatch': 'bg-amber-100 text-amber-700 border-amber-200',
    'Dispatched': 'bg-orange-100 text-orange-700 border-orange-200',
    'Delivered': 'bg-green-100 text-green-700 border-green-200',
    'In Transit': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'Cancelled': 'bg-red-100 text-red-700 border-red-200',
    'Occupied': 'bg-red-100 text-red-700 border-red-200',
    'Available': 'bg-green-100 text-green-700 border-green-200',
    'Maintenance': 'bg-gray-100 text-gray-600 border-gray-200',
  };

  const dotMap = {
    'Received': 'bg-blue-500',
    'Stored': 'bg-purple-500',
    'Ready for Dispatch': 'bg-amber-500',
    'Ready For Dispatch': 'bg-amber-500',
    'Dispatched': 'bg-orange-500',
    'Delivered': 'bg-green-500',
    'In Transit': 'bg-cyan-500',
    'Cancelled': 'bg-red-500',
    'Occupied': 'bg-red-500',
    'Available': 'bg-green-500',
    'Maintenance': 'bg-gray-400',
  };

  const sizeClass = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1';

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0.5 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${sizeClass} ${colorMap[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotMap[status] || 'bg-gray-400'}`}></span>
      {status}
    </motion.span>
  );
}
