export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-AE', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

export const formatWeight = (w) => `${Number(w).toFixed(1)} kg`;

export const getStatusColor = (status) => {
  const map = {
    'Received': 'bg-blue-100 text-blue-700 border border-blue-200',
    'Stored': 'bg-purple-100 text-purple-700 border border-purple-200',
    'Ready for Dispatch': 'bg-amber-100 text-amber-700 border border-amber-200',
    'Dispatched': 'bg-orange-100 text-orange-700 border border-orange-200',
    'Delivered': 'bg-green-100 text-green-700 border border-green-200',
    'In Transit': 'bg-cyan-100 text-cyan-700 border border-cyan-200',
    'Cancelled': 'bg-red-100 text-red-700 border border-red-200',
    'Occupied': 'bg-red-100 text-red-700 border border-red-200',
    'Available': 'bg-green-100 text-green-700 border border-green-200',
    'Maintenance': 'bg-gray-100 text-gray-600 border border-gray-200',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
};

export const getStatusDot = (status) => {
  const map = {
    'Received': 'bg-blue-500',
    'Stored': 'bg-purple-500',
    'Ready for Dispatch': 'bg-amber-500',
    'Dispatched': 'bg-orange-500',
    'Delivered': 'bg-green-500',
    'In Transit': 'bg-cyan-500',
  };
  return map[status] || 'bg-gray-400';
};

export const getActivityIcon = (type) => {
  const map = {
    create: '➕',
    update: '✏️',
    delete: '🗑️',
    dispatch: '🚚',
    login: '🔐',
    report: '📄',
  };
  return map[type] || '📋';
};

export const getActivityColor = (type) => {
  const map = {
    create: 'bg-green-100 text-green-700',
    update: 'bg-blue-100 text-blue-700',
    delete: 'bg-red-100 text-red-700',
    dispatch: 'bg-amber-100 text-amber-700',
    login: 'bg-purple-100 text-purple-700',
    report: 'bg-slate-100 text-slate-700',
  };
  return map[type] || 'bg-gray-100 text-gray-600';
};

export const paginate = (data, page, perPage) => {
  const start = (page - 1) * perPage;
  return data.slice(start, start + perPage);
};

export const totalPages = (data, perPage) => Math.ceil(data.length / perPage);
