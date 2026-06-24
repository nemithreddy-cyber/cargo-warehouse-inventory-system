import { useState, useEffect } from 'react';
import { 
  MdMessage, MdSend, MdSmartphone, MdEmail, MdRefresh, 
  MdDoneAll, MdError, MdSchedule, MdFilterList, MdSearch, 
  MdClose, MdReplay, MdInfoOutline 
} from 'react-icons/md';
import api from '../utils/api';
import ToastContainer from '../components/ToastContainer';
import { useToast } from '../hooks/useToast';

export default function MessagingSimulatorPage() {
  const { toasts, success, error, removeToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({ total: 0, whatsapp: 0, email: 0, failed: 0, pending: 0 });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [retryingId, setRetryingId] = useState(null);

  // Form state
  const [newMessage, setNewMessage] = useState({
    channel: 'whatsapp',
    recipientName: '',
    recipientAddress: '',
    subject: 'Cargo Update',
    cargoId: '',
    message: ''
  });

  // Filters state
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    channel: 'All',
    status: 'All',
    cargoId: '',
    search: ''
  });

  // Modal detail view state
  const [selectedMessage, setSelectedMessage] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await api.get('/messages/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load messaging stats', err);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.channel !== 'All') params.channel = filters.channel;
      if (filters.status !== 'All') params.status = filters.status;
      if (filters.cargoId) params.cargoId = filters.cargoId;
      if (filters.search) params.search = filters.search;

      const res = await api.get('/messages/logs', { params });
      if (res.data.success) {
        setMessages(res.data.data || []);
      }
    } catch (err) {
      error('Failed to load communication log history.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and fetch when filters update
  useEffect(() => {
    fetchStats();
    fetchMessages();
  }, [filters.startDate, filters.endDate, filters.channel, filters.status, filters.cargoId]);

  const handleSearchTrigger = (e) => {
    e.preventDefault();
    fetchMessages();
    fetchStats();
  };

  const validateInputs = () => {
    const address = newMessage.recipientAddress.trim();
    if (newMessage.channel === 'whatsapp') {
      // Validate phone number format (standard: + followed by digits, length 10-15)
      const phoneRegex = /^\+?[1-9]\d{9,14}$/;
      if (!phoneRegex.test(address.replace(/[\s-()]/g, ''))) {
        error('Invalid phone number. Use international format (e.g. +919876543210).');
        return false;
      }
    } else {
      // Validate email syntax
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(address)) {
        error('Invalid email address format.');
        return false;
      }
    }
    return true;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setSending(true);
    try {
      let res;
      if (newMessage.channel === 'whatsapp') {
        res = await api.post('/messages/whatsapp', {
          phoneNumber: newMessage.recipientAddress,
          message: newMessage.message,
          recipientName: newMessage.recipientName,
          cargoId: newMessage.cargoId
        });
      } else {
        res = await api.post('/messages/email', {
          email: newMessage.recipientAddress,
          subject: newMessage.subject,
          message: newMessage.message,
          recipientName: newMessage.recipientName,
          cargoId: newMessage.cargoId
        });
      }

      if (res.data.success) {
        success(res.data.message || 'Alert dispatched successfully!');
        setNewMessage({
          channel: 'whatsapp',
          recipientName: '',
          recipientAddress: '',
          subject: 'Cargo Update',
          cargoId: '',
          message: ''
        });
        fetchMessages();
        fetchStats();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Error executing message dispatch API.');
    } finally {
      setSending(false);
    }
  };

  const handleRetry = async (e, id) => {
    e.stopPropagation();
    setRetryingId(id);
    try {
      const res = await api.post(`/messages/retry/${id}`);
      if (res.data.success) {
        success('Notification resent and status updated successfully!');
        fetchMessages();
        fetchStats();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to retry sending.');
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MdMessage className="text-blue-600 text-2xl" /> Live Client Messaging Center
          </h2>
          <p className="text-slate-500 text-sm">Dispatches actual confirmations and invoices to customer phones &amp; mailboxes via Meta Cloud API and Gmail SMTP.</p>
        </div>
        <button
          onClick={() => { fetchMessages(); fetchStats(); }}
          className="flex items-center gap-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-xl transition-all border border-blue-200"
        >
          <MdRefresh className={`text-lg ${loading && 'animate-spin'}`} /> Sync Center
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <MdMessage className="text-lg" />
            </div>
          </div>
          <h4 className="text-2xl font-bold text-slate-800 mt-2">{stats.total}</h4>
          <p className="text-[10px] text-slate-400 mt-1">Dispatches logged</p>
        </div>

        {/* WhatsApp */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">WhatsApp</span>
            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <MdSmartphone className="text-lg" />
            </div>
          </div>
          <h4 className="text-2xl font-bold text-slate-800 mt-2">{stats.whatsapp}</h4>
          <p className="text-[10px] text-slate-400 mt-1">Sent via Meta Cloud API</p>
        </div>

        {/* Email */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Emails</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MdEmail className="text-lg" />
            </div>
          </div>
          <h4 className="text-2xl font-bold text-slate-800 mt-2">{stats.email}</h4>
          <p className="text-[10px] text-slate-400 mt-1">Sent via SMTP server</p>
        </div>

        {/* Failed */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Failed</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <MdError className="text-lg" />
            </div>
          </div>
          <h4 className="text-2xl font-bold text-red-600 mt-2">{stats.failed}</h4>
          <p className="text-[10px] text-slate-400 mt-1">Errors logged</p>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Pending</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <MdSchedule className="text-lg" />
            </div>
          </div>
          <h4 className="text-2xl font-bold text-amber-600 mt-2">{stats.pending}</h4>
          <p className="text-[10px] text-slate-400 mt-1">Queued for retry</p>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Outbound sending pane (1/3) */}
        <div className="lg:col-span-1 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm h-fit">
          <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
            <MdSend className="text-blue-600" /> New Alert Dispatcher
          </h3>
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">API Messaging Channel</label>
              <select
                value={newMessage.channel}
                onChange={(e) => setNewMessage({ ...newMessage, channel: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none font-sans"
              >
                <option value="whatsapp">WhatsApp Business API</option>
                <option value="email">SMTP Email Client</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Customer/Recipient Name</label>
              <input
                type="text" required
                placeholder="E.g. Raj Enterprises"
                value={newMessage.recipientName}
                onChange={(e) => setNewMessage({ ...newMessage, recipientName: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none font-sans"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">
                {newMessage.channel === 'whatsapp' ? 'Recipient Phone Number' : 'Recipient Email Address'}
              </label>
              <input
                type="text" required
                placeholder={newMessage.channel === 'whatsapp' ? '+919876543210' : 'billing@client.com'}
                value={newMessage.recipientAddress}
                onChange={(e) => setNewMessage({ ...newMessage, recipientAddress: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>

            {newMessage.channel === 'email' && (
              <div>
                <label className="text-xs font-semibold text-slate-500">Email Subject</label>
                <input
                  type="text" required
                  placeholder="E.g. Cargo Storage Update"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none font-sans"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-500">Cargo Tracking ID (Optional)</label>
              <input
                type="text"
                placeholder="E.g. CRG-20260001"
                value={newMessage.cargoId}
                onChange={(e) => setNewMessage({ ...newMessage, cargoId: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500">Message Body</label>
              <textarea
                rows="4" required
                placeholder={
                  newMessage.channel === 'whatsapp'
                    ? 'Your cargo CRG-20260001 has been received and stored in Zone A.'
                    : 'Dear Customer,\nYour cargo has been successfully dispatched from the airport.'
                }
                value={newMessage.message}
                onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-450 text-white rounded-xl py-2.5 font-medium text-xs transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Dispatched...
                </>
              ) : (
                <>
                  <MdSend /> Broadcast Live Message
                </>
              )}
            </button>
          </form>
        </div>

        {/* Message Logs Table (2/3) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col min-h-[500px] min-w-0">
          <h3 className="font-bold text-slate-800 text-base mb-4">Communication Dispatch History</h3>

          {/* Search/Filters toolbar */}
          <form onSubmit={handleSearchTrigger} className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            {/* Search */}
            <div className="relative col-span-2">
              <MdSearch className="absolute left-2.5 top-2 text-slate-400 text-base" />
              <input
                type="text"
                placeholder="Search recipient or ID..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-7 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Date filter */}
            <div>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] focus:outline-none"
                title="Start Date"
              />
            </div>

            {/* Date filter end */}
            <div>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] focus:outline-none"
                title="End Date"
              />
            </div>

            {/* Search button */}
            <div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1 py-1 bg-blue-600 hover:bg-blue-750 text-white rounded-lg text-[10px] font-bold shadow-sm"
              >
                Apply Search
              </button>
            </div>

            {/* Secondary filters row */}
            <div className="col-span-2 grid grid-cols-2 gap-2 mt-1">
              <select
                value={filters.channel}
                onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
                className="bg-white border border-slate-200 text-[10px] p-1 rounded-lg"
              >
                <option value="All">All Channels</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="bg-white border border-slate-200 text-[10px] p-1 rounded-lg"
              >
                <option value="All">All Statuses</option>
                <option value="Sent">Sent</option>
                <option value="Delivered">Delivered</option>
                <option value="Failed">Failed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            
            <div className="col-span-2 mt-1">
              <input
                type="text"
                placeholder="Cargo ID Filter..."
                value={filters.cargoId}
                onChange={(e) => setFilters({ ...filters, cargoId: e.target.value })}
                className="w-full p-1 bg-white border border-slate-200 rounded-lg text-[10px] focus:outline-none"
              />
            </div>

            <div className="mt-1">
              <button
                type="button"
                onClick={() => setFilters({ startDate: '', endDate: '', channel: 'All', status: 'All', cargoId: '', search: '' })}
                className="w-full text-center py-1 text-slate-500 hover:text-slate-800 text-[10px]"
              >
                Reset Filters
              </button>
            </div>
          </form>

          {/* Table list */}
          {loading ? (
            <div className="flex-1 flex justify-center items-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center text-slate-400">
              <MdMessage className="text-4xl text-slate-350 mb-2" />
              <p className="text-xs">No outbound dispatch records found matching filters.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto select-text scrollbar-thin">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] text-slate-500 uppercase font-semibold">
                    <th className="py-2.5 px-2">Recipient</th>
                    <th className="py-2.5 px-2 w-24">Cargo ID</th>
                    <th className="py-2.5 px-2 w-20">Channel</th>
                    <th className="py-2.5 px-2">Preview</th>
                    <th className="py-2.5 px-2 w-20 text-center">Status</th>
                    <th className="py-2.5 px-2 w-24 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {messages.map((msg) => {
                    const recipientLabel = msg.recipient_name;
                    const recipientAddr = msg.channel === 'whatsapp' ? msg.phone_number : msg.email;
                    const channelName = msg.channel || (msg.type?.toLowerCase());
                    const cargoRef = msg.cargo_id;
                    const previewText = msg.message;
                    const showSubject = channelName === 'email' && previewText.startsWith('Subject:');
                    
                    let subjectStr = '';
                    let bodyPreview = previewText;
                    if (showSubject) {
                      const lines = previewText.split('\n');
                      subjectStr = lines[0].replace('Subject:', '').trim();
                      bodyPreview = lines.slice(1).join(' ').trim();
                    }

                    return (
                      <tr 
                        key={msg.id} 
                        onClick={() => setSelectedMessage(msg)}
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      >
                        <td className="py-2.5 px-2 max-w-[120px] truncate">
                          <p className="font-semibold text-slate-800">{recipientLabel}</p>
                          <p className="text-[10px] text-slate-400 truncate">{recipientAddr}</p>
                        </td>
                        <td className="py-2.5 px-2 font-mono text-[10px] text-slate-500 font-semibold">{cargoRef || '—'}</td>
                        <td className="py-2.5 px-2">
                          <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            channelName === 'whatsapp' ? 'bg-green-50 text-green-700' : 'bg-indigo-50 text-indigo-700'
                          }`}>
                            {channelName === 'whatsapp' ? <MdSmartphone /> : <MdEmail />}
                            {channelName === 'whatsapp' ? 'WA' : 'Mail'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 max-w-[150px] truncate text-slate-500 font-sans">
                          {subjectStr && <span className="font-semibold text-slate-700 block text-[10px] truncate">{subjectStr}</span>}
                          <span className="truncate">{bodyPreview}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`inline-flex text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            msg.status === 'Sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            msg.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                            msg.status === 'Failed' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {msg.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1 justify-center">
                            {msg.status === 'Failed' && (
                              <button
                                onClick={(e) => handleRetry(e, msg.id)}
                                disabled={retryingId === msg.id}
                                className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded"
                                title="Retry sending"
                              >
                                <MdReplay className={`text-base ${retryingId === msg.id && 'animate-spin'}`} />
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedMessage(msg)}
                              className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded text-[9px] font-semibold"
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View Details Popup Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-550 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm">Message Dispatch Details</h4>
              <button 
                onClick={() => setSelectedMessage(null)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1"
              >
                <MdClose className="text-xl" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Recipient</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedMessage.recipient_name}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {selectedMessage.channel === 'whatsapp' ? selectedMessage.phone_number : selectedMessage.email}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Cargo Reference</p>
                  <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">{selectedMessage.cargo_id || '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Channel</p>
                  <span className={`inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-1 capitalize ${
                    selectedMessage.channel === 'whatsapp' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}>
                    {selectedMessage.channel}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                  <span className={`inline-flex text-[9px] font-bold px-2 py-0.5 rounded-full border mt-1 ${
                    selectedMessage.status === 'Sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    selectedMessage.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                    selectedMessage.status === 'Failed' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {selectedMessage.status}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Sent Time</p>
                  <p className="text-slate-500 mt-1 font-mono text-[9px]">{new Date(selectedMessage.sent_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Message Text</p>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl max-h-[160px] overflow-y-auto select-text font-mono text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>

              {selectedMessage.error_message && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-700 flex gap-2">
                  <MdInfoOutline className="text-lg flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-[10px] uppercase">Error Log Summary</p>
                    <p className="font-mono text-[10px] leading-relaxed break-all select-text">{selectedMessage.error_message}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              {selectedMessage.status === 'Failed' && (
                <button
                  onClick={(e) => { handleRetry(e, selectedMessage.id); setSelectedMessage(null); }}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-sm transition-all"
                >
                  <MdReplay className="text-base" /> Resend Alert
                </button>
              )}
              <button 
                onClick={() => setSelectedMessage(null)}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs px-4 py-2 rounded-xl transition-all"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
