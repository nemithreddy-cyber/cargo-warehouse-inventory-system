import { useState, useEffect } from 'react';
import {
  MdSmartToy, MdRequestQuote, MdVerifiedUser, MdAssignmentTurnedIn,
  MdAutorenew, MdRoute, MdSecurity, MdAirplanemodeActive,
  MdFeedback, MdAnalytics, MdCheckCircle, MdPendingActions, MdClose, MdRefresh
} from 'react-icons/md';
import api from '../utils/api';
import ToastContainer from '../components/ToastContainer';
import { useToast } from '../hooks/useToast';

export default function AIOperationsPage() {
  const { toasts, success, error, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState('quotations');
  const [loading, setLoading] = useState(false);
  const [cargoList, setCargoList] = useState([]);

  // Quotations state
  const [quotes, setQuotes] = useState([]);
  const [newQuote, setNewQuote] = useState({
    customer_name: '', weight: '', cargo_type: 'Electronics',
    origin: 'BOM', destination: 'DEL', rate_per_kg: '2.50', extra_charges: '0'
  });

  // Customs checklist state
  const [selectedCargoId, setSelectedCargoId] = useState('');
  const [customsList, setCustomsList] = useState([]);

  // Description cleaner state
  const [rawDesc, setRawDesc] = useState('');
  const [cleanDesc, setCleanDesc] = useState('');

  // Route recommender state
  const [routeOptions, setRouteOptions] = useState(null);

  // Claims state
  const [claims, setClaims] = useState([]);
  const [newClaim, setNewClaim] = useState({ cargo_id: '', amount: '', description: '', document_url: '' });

  // Airline rates state
  const [airlineRates, setAirlineRates] = useState([]);

  // Complaints state
  const [complaints, setComplaints] = useState([]);
  const [newComplaint, setNewComplaint] = useState({ customer_name: '', subject: '', description: '' });

  // Shipment Insights state
  const [insights, setInsights] = useState(null);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [cargoRes, quotesRes, claimsRes, ratesRes, complaintsRes, insightsRes] = await Promise.all([
        api.get('/cargo?limit=1000'),
        api.get('/ai-operations/quotations'),
        api.get('/ai-operations/claims'),
        api.get('/ai-operations/airline-rates'),
        api.get('/ai-operations/complaints'),
        api.get('/ai-operations/insights'),
      ]);
      setCargoList(cargoRes.data.data?.cargo || cargoRes.data.cargo || cargoRes.data.data || []);
      setQuotes(quotesRes.data.data || []);
      setClaims(claimsRes.data.data || []);
      setAirlineRates(ratesRes.data.data || []);
      setComplaints(complaintsRes.data.data || []);
      setInsights(insightsRes.data.data || null);
    } catch (err) {
      console.error('Failed to load AI operations data', err);
      error('Failed to load operations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ─── Quotations Actions ──────────────────────────────────────────────────
  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/ai-operations/quotations', newQuote);
      success(res.data.message || 'Quotation generated and saved!');
      setNewQuote({
        customer_name: '', weight: '', cargo_type: 'Electronics',
        origin: 'BOM', destination: 'DEL', rate_per_kg: '2.50', extra_charges: '0'
      });
      fetchData();
    } catch (err) {
      error('Failed to generate quotation');
    }
  };

  const handleApproveQuote = async (id) => {
    try {
      await api.post(`/ai-operations/quotations/approve/${id}`);
      success('Quotation approved!');
      fetchData();
    } catch (err) {
      error('Approval failed');
    }
  };

  // ─── Customs Explainer Actions ───────────────────────────────────────────
  const fetchCustomsChecklist = async (cargoId) => {
    if (!cargoId) return;
    try {
      const res = await api.get(`/ai-operations/customs-checklist/${cargoId}`);
      setCustomsList(res.data.data || []);
    } catch (err) {
      error('Failed to load customs checklist');
    }
  };

  const handleVerifyDocument = async (docId) => {
    try {
      await api.post('/ai-operations/customs-checklist/verify', { id: docId, verified_by: 'Super Admin' });
      success('Document verified successfully!');
      fetchCustomsChecklist(selectedCargoId);
    } catch (err) {
      error('Verification failed');
    }
  };

  // ─── Description Cleaner Actions ─────────────────────────────────────────
  const handleCleanDescription = async () => {
    if (!rawDesc.trim()) return;
    try {
      const res = await api.post('/ai-operations/clean-description', { description: rawDesc });
      setCleanDesc(res.data.data);
      success('Cargo description cleaned successfully!');
    } catch (err) {
      error('Cleaning failed');
    }
  };

  // ─── Route Recommender Actions ───────────────────────────────────────────
  const fetchRouteRecommendations = async (cargoId) => {
    if (!cargoId) return;
    try {
      const res = await api.get(`/ai-operations/route-options/${cargoId}`);
      setRouteOptions(res.data.data || null);
    } catch (err) {
      error('Failed to recommend routes');
    }
  };

  const handleSelectRoute = async (route) => {
    try {
      await api.post('/ai-operations/route-options/select', { cargo_id: routeOptions.cargo_id, selected_route: route });
      success('Route option selected!');
      fetchRouteRecommendations(routeOptions.cargo_id);
    } catch (err) {
      error('Selection failed');
    }
  };

  // ─── Claims Actions ──────────────────────────────────────────────────────
  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/ai-operations/claims', newClaim);
      success(res.data.message || 'Claim submitted!');
      setNewClaim({ cargo_id: '', amount: '', description: '', document_url: '' });
      fetchData();
    } catch (err) {
      error('Failed to submit claim');
    }
  };

  const handleApproveClaim = async (id) => {
    try {
      await api.post(`/ai-operations/claims/approve/${id}`);
      success('Claim approved!');
      fetchData();
    } catch (err) {
      error('Claim approval failed');
    }
  };

  // ─── Complaints Actions ──────────────────────────────────────────────────
  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/ai-operations/complaints', newComplaint);
      success(res.data.message || 'Complaint registered!');
      setNewComplaint({ customer_name: '', subject: '', description: '' });
      fetchData();
    } catch (err) {
      error('Failed to file complaint');
    }
  };

  const handleResolveComplaint = async (id) => {
    try {
      await api.post(`/ai-operations/complaints/resolve/${id}`);
      success('Complaint marked as resolved!');
      fetchData();
    } catch (err) {
      error('Resolution failed');
    }
  };

  // Tabs structure
  const tabs = [
    { id: 'quotations', label: 'Cargo Quotations', icon: MdRequestQuote },
    { id: 'customs', label: 'Customs & Documents', icon: MdVerifiedUser },
    { id: 'cleaner', label: 'Description Cleaner', icon: MdAutorenew },
    { id: 'routes', label: 'Route Recommender', icon: MdRoute },
    { id: 'claims', label: 'Insurance Claims', icon: MdSecurity },
    { id: 'rates', label: 'Airline Rates', icon: MdAirplanemodeActive },
    { id: 'complaints', label: 'Customer Complaints', icon: MdFeedback },
    { id: 'insights', label: 'Shipment Insights', icon: MdAnalytics },
  ];

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MdSmartToy className="text-blue-600 text-3xl" /> AI &amp; Operations Suite
          </h2>
          <p className="text-slate-500 text-sm">Deploy rule-based AI helpers for airway bills, quotations, route optimization, and claims</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors border border-blue-200"
        >
          <MdRefresh className="text-lg animate-spin-slow" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 overflow-x-auto gap-2 py-1 scrollbar-thin">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="text-lg" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        {activeTab === 'quotations' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-1 border-r border-slate-100 pr-0 lg:pr-8 space-y-4">
              <h3 className="font-bold text-slate-800 text-lg mb-2">Generate Air Cargo Quotation</h3>
              <form onSubmit={handleQuoteSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Customer Name</label>
                  <input
                    type="text" required
                    placeholder="Enter customer name"
                    value={newQuote.customer_name}
                    onChange={(e) => setNewQuote({ ...newQuote, customer_name: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Weight (kg)</label>
                    <input
                      type="number" required min="1"
                      value={newQuote.weight}
                      onChange={(e) => setNewQuote({ ...newQuote, weight: e.target.value })}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Cargo Type</label>
                    <select
                      value={newQuote.cargo_type}
                      onChange={(e) => setNewQuote({ ...newQuote, cargo_type: e.target.value })}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {['Electronics', 'Pharmaceuticals', 'Textiles', 'Machinery', 'Perishables', 'Chemicals'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Origin (IATA)</label>
                    <input
                      type="text" required maxLength="3"
                      value={newQuote.origin}
                      onChange={(e) => setNewQuote({ ...newQuote, origin: e.target.value.toUpperCase() })}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Destination (IATA)</label>
                    <input
                      type="text" required maxLength="3"
                      value={newQuote.destination}
                      onChange={(e) => setNewQuote({ ...newQuote, destination: e.target.value.toUpperCase() })}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Rate per kg (AED)</label>
                    <input
                      type="number" step="0.01" required
                      value={newQuote.rate_per_kg}
                      onChange={(e) => setNewQuote({ ...newQuote, rate_per_kg: e.target.value })}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Extra Charges (AED)</label>
                    <input
                      type="number"
                      value={newQuote.extra_charges}
                      onChange={(e) => setNewQuote({ ...newQuote, extra_charges: e.target.value })}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 font-medium text-sm transition-colors shadow-sm"
                >
                  Generate Quotation
                </button>
              </form>
            </div>
            {/* Table list */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-bold text-slate-800 text-lg">Recent Quotations</h3>
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                      <th className="px-4 py-3">Quote ID</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Details</th>
                      <th className="px-4 py-3">Route</th>
                      <th className="px-4 py-3">Total Cost</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {quotes.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-semibold text-slate-700">{q.quote_id}</td>
                        <td className="px-4 py-3">{q.customer_name}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{q.cargo_type} ({q.weight} kg)</td>
                        <td className="px-4 py-3">{q.origin} ➔ {q.destination}</td>
                        <td className="px-4 py-3 font-semibold text-blue-600">{q.total_charge} AED</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            q.status === 'Approved' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                          }`}>{q.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          {q.status === 'Pending' && (
                            <button
                              onClick={() => handleApproveQuote(q.id)}
                              className="text-xs bg-green-500 hover:bg-green-600 text-white font-medium px-2.5 py-1 rounded-lg transition-colors"
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customs' && (
          <div className="space-y-6">
            <div className="max-w-md">
              <label className="text-sm font-semibold text-slate-600">Select Cargo Shipment to verify Customs checklists</label>
              <select
                value={selectedCargoId}
                onChange={(e) => {
                  setSelectedCargoId(e.target.value);
                  fetchCustomsChecklist(e.target.value);
                }}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 mt-2 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">-- Choose Cargo --</option>
                {cargoList.map((c) => (
                  <option key={c.id} value={c.id}>{c.cargo_id} ({c.customer_name} - {c.cargo_type})</option>
                ))}
              </select>
            </div>

            {selectedCargoId && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* AI Customs requirements explainer card */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                    <MdSmartToy className="text-blue-600" /> AI Customs Explainer Insights
                  </h4>
                  <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
                    <p>
                      Based on standard air cargo policies, shipments of type <strong>
                      {cargoList.find(c => c.id == selectedCargoId)?.cargo_type || 'Selected Cargo'}</strong> crossing regional airports require specific validations.
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs">
                      <li>Commercial Invoice showing final valuation matches customs declaration.</li>
                      <li>Packing lists detailing item quantities and dimension packaging.</li>
                      <li>Ensure hazardous or chemical classifications include current MSDS data sheets.</li>
                    </ul>
                    <p className="text-xs text-amber-600 font-semibold bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
                      ⚠️ Warning: Ensure cargo ID matches ID Proofs submitted by customer prior to warehousing.
                    </p>
                  </div>
                </div>

                {/* Customs checklists list */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-lg">Customs Checklist Verification</h4>
                  <div className="space-y-3">
                    {customsList.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{item.document_type}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.status === 'Verified' ? `Verified by ${item.verified_by}` : 'Awaiting manual check'}
                          </p>
                        </div>
                        <div>
                          {item.status === 'Verified' ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                              <MdCheckCircle className="text-lg" /> Verified
                            </span>
                          ) : (
                            <button
                              onClick={() => handleVerifyDocument(item.id)}
                              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                            >
                              Verify Doc
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cleaner' && (
          <div className="max-w-2xl mx-auto space-y-5">
            <h3 className="font-bold text-slate-800 text-lg">Standardize Cargo Description (AI Cleaner)</h3>
            <p className="text-sm text-slate-500">
              Input messy description texts, package counts, or notes, and standardise them into clean formatting strings.
            </p>
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-500">Raw Description / Packing Details</label>
              <textarea
                rows="4"
                placeholder="Example: 5 boxes of electronic components, extremely fragile, handle with care, keep dry urgent shipment..."
                value={rawDesc}
                onChange={(e) => setRawDesc(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              onClick={handleCleanDescription}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-colors"
            >
              Clean &amp; Standardize Description
            </button>

            {cleanDesc && (
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mt-6 space-y-2">
                <h4 className="font-bold text-slate-800 text-sm">AI Standard Output Description:</h4>
                <p className="bg-white border border-slate-200 font-mono text-sm px-4 py-3 rounded-xl text-slate-700">
                  {cleanDesc}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'routes' && (
          <div className="space-y-6">
            <div className="max-w-md">
              <label className="text-sm font-semibold text-slate-600">Select Cargo Shipment to Recommend Route Options</label>
              <select
                value={routeOptions?.cargo_id || ''}
                onChange={(e) => {
                  fetchRouteRecommendations(e.target.value);
                }}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 mt-2 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">-- Choose Cargo --</option>
                {cargoList.map((c) => (
                  <option key={c.id} value={c.id}>{c.cargo_id} ({c.customer_name} - {c.origin_airport}➔{c.destination_airport})</option>
                ))}
              </select>
            </div>

            {routeOptions && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Options List */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-lg">AI Route Recommendations</h4>
                  <div className="space-y-3">
                    {JSON.parse(routeOptions.routes_json).map((route) => (
                      <div
                        key={route}
                        onClick={() => handleSelectRoute(route)}
                        className={`p-4 border rounded-xl shadow-sm cursor-pointer transition-all ${
                          routeOptions.selected_route === route
                            ? 'bg-blue-50 border-blue-500'
                            : 'bg-white border-slate-200 hover:border-blue-400'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-slate-800">{route}</span>
                          {routeOptions.selected_route === route && (
                            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Selected
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated Map / Route description */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col justify-center text-center">
                  <MdRoute className="text-6xl text-blue-600 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-800 text-base">Selected Flight Path details</h4>
                  <p className="text-sm text-slate-500 mt-2">
                    Current selected path: <strong className="text-blue-700">{routeOptions.selected_route}</strong>.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Route optimization calculated by matching airline cargo networks with shortest transit times.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'claims' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Submit Claim Form */}
            <div className="lg:col-span-1 border-r border-slate-100 pr-0 lg:pr-8 space-y-4">
              <h3 className="font-bold text-slate-800 text-lg mb-2">Submit Insurance Claim</h3>
              <form onSubmit={handleClaimSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Cargo Shipment</label>
                  <select
                    value={newClaim.cargo_id} required
                    onChange={(e) => setNewClaim({ ...newClaim, cargo_id: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- Select Cargo --</option>
                    {cargoList.map((c) => (
                      <option key={c.id} value={c.id}>{c.cargo_id} ({c.customer_name})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Claim Amount (AED)</label>
                  <input
                    type="number" required
                    placeholder="Enter claim amount"
                    value={newClaim.amount}
                    onChange={(e) => setNewClaim({ ...newClaim, amount: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Document URL / File Reference</label>
                  <input
                    type="text"
                    placeholder="E.g. claim_manifest_docs.pdf"
                    value={newClaim.document_url}
                    onChange={(e) => setNewClaim({ ...newClaim, document_url: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Claim Description</label>
                  <textarea
                    rows="3" required
                    placeholder="Describe cargo damage or issue"
                    value={newClaim.description}
                    onChange={(e) => setNewClaim({ ...newClaim, description: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 font-medium text-sm transition-colors shadow-sm"
                >
                  Submit Claim
                </button>
              </form>
            </div>

            {/* Claims list */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-bold text-slate-800 text-lg">Damage Claims Directory</h3>
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                      <th className="px-4 py-3">Claim ID</th>
                      <th className="px-4 py-3">Cargo ID</th>
                      <th className="px-4 py-3">Damage Description</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Documents</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {claims.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-semibold text-slate-700">{c.claim_id}</td>
                        <td className="px-4 py-3 font-medium text-slate-600">{c.cargo_ref}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{c.description}</td>
                        <td className="px-4 py-3 font-semibold text-blue-600">{c.amount} AED</td>
                        <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-[120px]">
                          {c.document_url ? (
                            <a href={c.document_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                              {c.document_url.split('/').pop()}
                            </a>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            c.status === 'Approved' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                          }`}>{c.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          {c.status === 'Submitted' && (
                            <button
                              onClick={() => handleApproveClaim(c.id)}
                              className="text-xs bg-green-500 hover:bg-green-600 text-white font-medium px-2.5 py-1 rounded-lg transition-colors"
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rates' && (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-800 text-lg">Airline Cargo Rates Comparison Grid</h3>
            <p className="text-sm text-slate-500">Compare dynamic pricing structures and standard route transit times across airlines.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {airlineRates.map((rate) => (
                <div key={rate.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 hover:border-blue-500 transition-colors">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <h4 className="font-bold text-slate-800 text-base">{rate.airline_name}</h4>
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">
                      {rate.transit_days} Day(s) Transit
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Route</span>
                    <span className="font-semibold text-slate-700">{rate.origin} ➔ {rate.destination}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Rate per kg</span>
                    <span className="font-bold text-blue-600 text-base">{rate.rate_per_kg} AED</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'complaints' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Submit Complaint Form */}
            <div className="lg:col-span-1 border-r border-slate-100 pr-0 lg:pr-8 space-y-4">
              <h3 className="font-bold text-slate-800 text-lg mb-2">Register Customer Complaint</h3>
              <form onSubmit={handleComplaintSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Customer Name</label>
                  <input
                    type="text" required
                    placeholder="Enter customer name"
                    value={newComplaint.customer_name}
                    onChange={(e) => setNewComplaint({ ...newComplaint, customer_name: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Subject</label>
                  <input
                    type="text" required
                    placeholder="E.g. Delayed handling or package damage"
                    value={newComplaint.subject}
                    onChange={(e) => setNewComplaint({ ...newComplaint, subject: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Complaint Details</label>
                  <textarea
                    rows="4" required
                    placeholder="Provide detailed description of complaint..."
                    value={newComplaint.description}
                    onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 font-medium text-sm transition-colors shadow-sm"
                >
                  File Complaint
                </button>
              </form>
            </div>

            {/* Complaints directory */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-bold text-slate-800 text-lg">Complaints Directory</h3>
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                      <th className="px-4 py-3">Complaint ID</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {complaints.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-semibold text-slate-700">{c.complaint_id}</td>
                        <td className="px-4 py-3">{c.customer_name}</td>
                        <td className="px-4 py-3 font-medium text-slate-700">{c.subject}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{c.description}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            c.status === 'Resolved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}>{c.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          {c.status === 'Open' && (
                            <button
                              onClick={() => handleResolveComplaint(c.id)}
                              className="text-xs bg-green-500 hover:bg-green-600 text-white font-medium px-2.5 py-1 rounded-lg transition-colors"
                            >
                              Resolve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-800 text-lg">AI Shipment Insights &amp; Analytics Summary</h3>
            {insights ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Total Active Shipments</p>
                  <p className="text-3xl font-extrabold text-blue-900 mt-2">{insights.total_shipments}</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-purple-600 font-bold uppercase tracking-wider">Total Managed Weight</p>
                  <p className="text-3xl font-extrabold text-purple-900 mt-2">{(parseFloat(insights.total_weight || 0) / 1000).toFixed(1)} tons</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-2xl p-5 shadow-sm md:col-span-1">
                  <p className="text-xs text-green-600 font-bold uppercase tracking-wider">Database Status health</p>
                  <p className="text-3xl font-extrabold text-green-900 mt-2">Nominal</p>
                </div>

                <div className="md:col-span-3 bg-slate-50 border border-slate-100 rounded-2xl p-5 mt-4 space-y-3">
                  <h4 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                    <MdSmartToy className="text-blue-600 text-lg" /> Automated AI Recommendations
                  </h4>
                  <div className="space-y-2">
                    {insights.insights.map((item, idx) => (
                      <p key={idx} className="text-sm text-slate-600 leading-relaxed pl-4 border-l-2 border-blue-400">
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Insights calculating...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
