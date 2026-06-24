import { useState, useEffect, useRef } from 'react';
import * as MdIcons from 'react-icons/md';
import api from '../utils/api';
import ToastContainer from '../components/ToastContainer';
import { useToast } from '../hooks/useToast';

export default function AIOperationsPage() {
  const { toasts, success, error, removeToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cargoList, setCargoList] = useState([]);
  
  // Data logs (for the persistent sidebar)
  const [quotes, setQuotes] = useState([]);
  const [claims, setClaims] = useState([]);
  const [airlineRates, setAirlineRates] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [insights, setInsights] = useState(null);
  
  // Sidebar tab state
  const [sidebarTab, setSidebarTab] = useState('quotes');

  // Chatbot states
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [chatState, setChatState] = useState(null); // { type, step, data }
  const [isTyping, setIsTyping] = useState(false);

  const chatEndRef = useRef(null);

  // Auto scroll to bottom of chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Fetch log data for sidebar
  const fetchLogs = async () => {
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
      console.error('Failed to load logs', err);
    }
  };

  // Initialize data and welcome message
  useEffect(() => {
    fetchLogs();
    
    // Add welcome message
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: `👋 Hello! I am your **ORBEM AI Operations Assistant**. I can help you automate calculations, check customs compliance, recommend flights, and manage insurance claims.

**Here's what I can do for you:**
* 📋 **Generate Quotation** - Step-by-step air cargo rate estimation
* 🛃 **Customs Checklist** - Verify customs documents for a shipment
* ✨ **Clean Description** - Standardize messy descriptions for airway bills
* 🗺️ **Route Recommendation** - Optimize flight paths for cargo
* 🛡️ **Insurance Claim** - Log cargo damages and files
* ✈️ **Airline Rates** - View current global carrier shipping rates
* 💬 **Customer Complaint** - Register customer issues
* 📊 **Shipment Insights** - General analytics and recommendations

Select a quick action chip below or type your request directly!`,
        timestamp: new Date()
      }
    ]);
  }, []);

  const addBotMessage = (text, type = null, data = null) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text,
          type,
          data,
          timestamp: new Date()
        }
      ]);
    }, 600);
  };

  // ─── Guided Flows State Machine ──────────────────────────────────────────

  const handleActionClick = (actionType) => {
    // Reset any ongoing flow
    setChatState(null);
    
    // Add user message indicating action
    setMessages((prev) => [
      ...prev,
      {
        id: `action-${Date.now()}`,
        sender: 'user',
        text: `Starting action: ${actionType.replace('_', ' ').toUpperCase()}`,
        timestamp: new Date()
      }
    ]);

    if (actionType === 'quote') {
      setChatState({ type: 'quote', step: 'customer', data: {} });
      addBotMessage('Let\'s generate an **Air Cargo Quotation**! 📋\n\nPlease enter the **Customer/Recipient Name**:');
    } 
    else if (actionType === 'customs') {
      setChatState({ type: 'customs', step: 'select_cargo', data: {} });
      addBotMessage('Let\'s check **Customs & Documents** 🛃\n\nPlease select one of the active shipments below to inspect its checklist:');
    }
    else if (actionType === 'cleaner') {
      setChatState({ type: 'cleaner', step: 'text', data: {} });
      addBotMessage('Let\'s **Clean a Cargo Description** ✨\n\nPlease paste or type the raw cargo description you want to clean:');
    }
    else if (actionType === 'routes') {
      setChatState({ type: 'routes', step: 'select_cargo', data: {} });
      addBotMessage('Let\'s check **Route Recommendations** 🗺️\n\nPlease select one of the active shipments below to see flight paths:');
    }
    else if (actionType === 'claim') {
      setChatState({ type: 'claim', step: 'cargo', data: {} });
      addBotMessage('Let\'s submit an **Insurance Damage Claim** 🛡️\n\nPlease select the cargo shipment associated with the claim:');
    }
    else if (actionType === 'rates') {
      fetchAirlineRatesDirect();
    }
    else if (actionType === 'complaint') {
      setChatState({ type: 'complaint', step: 'customer', data: {} });
      addBotMessage('Let\'s file a **Customer Complaint** 💬\n\nPlease enter the **Customer\'s Name**:');
    }
    else if (actionType === 'insights') {
      fetchInsightsDirect();
    }
  };

  const handleAbort = () => {
    setChatState(null);
    setMessages((prev) => [
      ...prev,
      {
        id: `abort-${Date.now()}`,
        sender: 'bot',
        text: '❌ Action aborted. What else can I help you with?',
        timestamp: new Date()
      }
    ]);
  };

  // Direct fetchers (no guided inputs needed)
  const fetchAirlineRatesDirect = async () => {
    setIsTyping(true);
    try {
      const res = await api.get('/ai-operations/airline-rates');
      const rates = res.data.data || [];
      addBotMessage('Here is the current **Airline Cargo Rates Comparison Grid** ✈️:', 'rates', rates);
      setAirlineRates(rates);
    } catch (err) {
      addBotMessage('⚠️ Failed to load airline rates.');
    } finally {
      setIsTyping(false);
    }
  };

  const fetchInsightsDirect = async () => {
    setIsTyping(true);
    try {
      const res = await api.get('/ai-operations/insights');
      const data = res.data.data || null;
      addBotMessage('Here are the latest **AI Shipment Insights & Recommendations** 📊:', 'insights', data);
      setInsights(data);
    } catch (err) {
      addBotMessage('⚠️ Failed to calculate shipment insights.');
    } finally {
      setIsTyping(false);
    }
  };

  // Handling Text Submissions from Chat Input
  const handleUserMessageSubmit = async (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userText = inputVal.trim();
    setInputVal('');

    // Append user message
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'user',
        text: userText,
        timestamp: new Date()
      }
    ]);

    // Check if in a guided chat flow
    if (chatState) {
      processGuidedFlow(userText);
    } else {
      // Natural language / command detection fallback
      processGeneralCommand(userText);
    }
  };

  // Process inputs for guided steps
  const processGuidedFlow = async (text) => {
    const { type, step, data } = chatState;

    // QUOTATION GUIDED FLOW
    if (type === 'quote') {
      if (step === 'customer') {
        const nextData = { ...data, customer_name: text };
        setChatState({ type, step: 'weight', data: nextData });
        addBotMessage(`Customer: **${text}**\n\nNext, enter the **Cargo Weight (in kg)**:`);
      }
      else if (step === 'weight') {
        const weight = parseFloat(text);
        if (isNaN(weight) || weight <= 0) {
          addBotMessage('⚠️ Weight must be a valid positive number. Please enter the weight again:');
          return;
        }
        const nextData = { ...data, weight };
        setChatState({ type, step: 'type', data: nextData });
        addBotMessage(`Weight: **${weight} kg**\n\nChoose **Cargo Type**:\n(Electronics, Pharmaceuticals, Textiles, Machinery, Perishables, Chemicals)`);
      }
      else if (step === 'type') {
        const typeVal = text.trim();
        const nextData = { ...data, cargo_type: typeVal };
        setChatState({ type, step: 'origin', data: nextData });
        addBotMessage(`Type: **${typeVal}**\n\nEnter the 3-letter **Origin Airport IATA Code** (e.g. BOM):`);
      }
      else if (step === 'origin') {
        const origin = text.trim().toUpperCase();
        if (origin.length !== 3) {
          addBotMessage('⚠️ Airport code must be exactly 3 letters. Please re-enter:');
          return;
        }
        const nextData = { ...data, origin };
        setChatState({ type, step: 'destination', data: nextData });
        addBotMessage(`Origin: **${origin}**\n\nEnter the 3-letter **Destination Airport IATA Code** (e.g. DEL):`);
      }
      else if (step === 'destination') {
        const destination = text.trim().toUpperCase();
        if (destination.length !== 3) {
          addBotMessage('⚠️ Airport code must be exactly 3 letters. Please re-enter:');
          return;
        }
        const nextData = { ...data, destination };
        setChatState({ type, step: 'rate', data: nextData });
        addBotMessage(`Destination: **${destination}**\n\nEnter the **Rate per kg (in AED)** (e.g., 2.50):`);
      }
      else if (step === 'rate') {
        const rate = parseFloat(text);
        if (isNaN(rate) || rate <= 0) {
          addBotMessage('⚠️ Rate must be a valid positive number. Please re-enter:');
          return;
        }
        const nextData = { ...data, rate_per_kg: rate };
        setChatState({ type, step: 'extra', data: nextData });
        addBotMessage(`Rate: **${rate} AED/kg**\n\nEnter any **Extra Charges (in AED)** (enter 0 if none):`);
      }
      else if (step === 'extra') {
        const extra = parseFloat(text);
        if (isNaN(extra) || extra < 0) {
          addBotMessage('⚠️ Extra charges must be a valid number. Please re-enter:');
          return;
        }
        const finalData = { ...data, extra_charges: extra };
        setChatState(null); // Clear state

        // Call Quotation Post API
        setIsTyping(true);
        try {
          const res = await api.post('/ai-operations/quotations', finalData);
          if (res.data.success) {
            success('Quotation generated successfully!');
            fetchLogs(); // refresh sidebar list
            addBotMessage(`🎉 **Air Cargo Quotation generated successfully!**`, 'quotation_result', {
              ...finalData,
              quote_id: res.data.data.quote_id,
              total_charge: res.data.data.total_charge
            });
          }
        } catch (err) {
          addBotMessage('❌ Failed to generate quotation. Please try again.');
        } finally {
          setIsTyping(false);
        }
      }
    }

    // CUSTOMS GUIDED FLOW
    else if (type === 'customs') {
      if (step === 'select_cargo') {
        // Try to match the selected cargo
        const cargoObj = cargoList.find(c => c.cargo_id.toLowerCase() === text.toLowerCase() || c.id.toString() === text);
        if (!cargoObj) {
          addBotMessage('⚠️ Cargo ID not found. Please select from the buttons above or enter a valid Cargo ID:');
          return;
        }
        setChatState(null);
        handleFetchCustomsChecklist(cargoObj.id, cargoObj.cargo_id, cargoObj.cargo_type);
      }
    }

    // DESCRIPTION CLEANER FLOW
    else if (type === 'cleaner') {
      if (step === 'text') {
        setChatState(null);
        setIsTyping(true);
        try {
          const res = await api.post('/clean-description', { description: text });
          if (res.data.success) {
            success('Cargo description cleaned!');
            addBotMessage(`✨ **Standardized Cargo Description Manifest:**`, 'cleaner_result', res.data.data);
          }
        } catch (err) {
          addBotMessage('❌ Description cleaner endpoint error.');
        } finally {
          setIsTyping(false);
        }
      }
    }

    // ROUTE RECOMMENDER FLOW
    else if (type === 'routes') {
      if (step === 'select_cargo') {
        const cargoObj = cargoList.find(c => c.cargo_id.toLowerCase() === text.toLowerCase() || c.id.toString() === text);
        if (!cargoObj) {
          addBotMessage('⚠️ Cargo ID not found. Please select from the buttons above or enter a valid Cargo ID:');
          return;
        }
        setChatState(null);
        handleFetchRouteOptions(cargoObj.id, cargoObj.cargo_id);
      }
    }

    // CLAIMS GUIDED FLOW
    else if (type === 'claim') {
      if (step === 'cargo') {
        const cargoObj = cargoList.find(c => c.cargo_id.toLowerCase() === text.toLowerCase() || c.id.toString() === text);
        if (!cargoObj) {
          addBotMessage('⚠️ Cargo ID not found. Please select a valid cargo from the buttons:');
          return;
        }
        const nextData = { ...data, cargo_id: cargoObj.id, cargo_ref: cargoObj.cargo_id };
        setChatState({ type, step: 'amount', data: nextData });
        addBotMessage(`Selected Cargo: **${cargoObj.cargo_id}**\n\nEnter the **Claim Amount (in AED)**:`);
      }
      else if (step === 'amount') {
        const amount = parseFloat(text);
        if (isNaN(amount) || amount <= 0) {
          addBotMessage('⚠️ Claim amount must be a positive number. Please re-enter:');
          return;
        }
        const nextData = { ...data, amount };
        setChatState({ type, step: 'desc', data: nextData });
        addBotMessage(`Claim Amount: **${amount} AED**\n\nPlease describe the **cargo damage or issue details**:`);
      }
      else if (step === 'desc') {
        const nextData = { ...data, description: text };
        setChatState({ type, step: 'doc', data: nextData });
        addBotMessage(`Description logged.\n\n(Optional) Enter **document file name / photo URL** (enter '-' to skip):`);
      }
      else if (step === 'doc') {
        const doc_url = (text === '-' || text.toLowerCase() === 'skip') ? null : text;
        const finalData = { ...data, document_url: doc_url };
        setChatState(null);

        setIsTyping(true);
        try {
          const res = await api.post('/ai-operations/claims', finalData);
          if (res.data.success) {
            success('Claim submitted successfully!');
            fetchLogs();
            addBotMessage(`🛡️ **Insurance Claim submitted successfully!**`, 'claim_result', {
              ...finalData,
              claim_id: res.data.data.claim_id
            });
          }
        } catch (err) {
          addBotMessage('❌ Failed to submit claim. Please try again.');
        } finally {
          setIsTyping(false);
        }
      }
    }

    // COMPLAINT GUIDED FLOW
    else if (type === 'complaint') {
      if (step === 'customer') {
        const nextData = { ...data, customer_name: text };
        setChatState({ type, step: 'subject', data: nextData });
        addBotMessage(`Customer: **${text}**\n\nEnter the **Complaint Subject / Reason**:`);
      }
      else if (step === 'subject') {
        const nextData = { ...data, subject: text };
        setChatState({ type, step: 'desc', data: nextData });
        addBotMessage(`Subject: **${text}**\n\nPlease enter the **detailed description** of the complaint:`);
      }
      else if (step === 'desc') {
        const finalData = { ...data, description: text };
        setChatState(null);

        setIsTyping(true);
        try {
          const res = await api.post('/ai-operations/complaints', finalData);
          if (res.data.success) {
            success('Complaint filed!');
            fetchLogs();
            addBotMessage(`💬 **Customer Complaint registered successfully!**`, 'complaint_result', {
              ...finalData,
              complaint_id: res.data.data.complaint_id
            });
          }
        } catch (err) {
          addBotMessage('❌ Failed to register complaint.');
        } finally {
          setIsTyping(false);
        }
      }
    }
  };

  // General Commands Detection (Natural language heuristics)
  const processGeneralCommand = (text) => {
    const t = text.toLowerCase();
    if (t.includes('quote') || t.includes('quotation') || t.includes('price')) {
      handleActionClick('quote');
    } else if (t.includes('customs') || t.includes('checklist') || t.includes('doc')) {
      handleActionClick('customs');
    } else if (t.includes('clean') || t.includes('description') || t.includes('standardize')) {
      handleActionClick('cleaner');
    } else if (t.includes('route') || t.includes('flight') || t.includes('optimize')) {
      handleActionClick('routes');
    } else if (t.includes('claim') || t.includes('damage') || t.includes('insurance')) {
      handleActionClick('claim');
    } else if (t.includes('rate') || t.includes('compare') || t.includes('airline')) {
      handleActionClick('rates');
    } else if (t.includes('complain') || t.includes('feedback')) {
      handleActionClick('complaint');
    } else if (t.includes('insight') || t.includes('analytics') || t.includes('recommendation')) {
      handleActionClick('insights');
    } else {
      addBotMessage(`I'm not sure how to process: "${text}".

Could you please clarify your request, or select one of the quick actions below? 👇`);
    }
  };

  // Custom checklist retrieval helper
  const handleFetchCustomsChecklist = async (id, cargoIdStr, cargoType) => {
    setIsTyping(true);
    try {
      const res = await api.get(`/ai-operations/customs-checklist/${id}`);
      const checklist = res.data.data || [];
      addBotMessage(`Checklist loaded for cargo **${cargoIdStr}** (${cargoType}) 🛃:`, 'customs_checklist', {
        cargoId: id,
        cargoRef: cargoIdStr,
        cargoType,
        checklist
      });
    } catch (err) {
      addBotMessage('⚠️ Failed to load customs checklist.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleVerifyDocumentInChat = async (messageId, docId, cargoId) => {
    try {
      await api.post('/ai-operations/customs-checklist/verify', { id: docId, verified_by: 'Super Admin' });
      success('Document verified successfully!');
      
      // Update specific message item's checklist data in state
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId && msg.type === 'customs_checklist') {
          const updatedChecklist = msg.data.checklist.map(item => {
            if (item.id === docId) {
              return { ...item, status: 'Verified', verified_by: 'Super Admin' };
            }
            return item;
          });
          return { ...msg, data: { ...msg.data, checklist: updatedChecklist } };
        }
        return msg;
      }));
    } catch (err) {
      error('Verification failed');
    }
  };

  // Route recommendations fetch helper
  const handleFetchRouteOptions = async (id, cargoIdStr) => {
    setIsTyping(true);
    try {
      const res = await api.get(`/ai-operations/route-options/${id}`);
      const routeData = res.data.data || null;
      addBotMessage(`Route recommendations for **${cargoIdStr}** 🗺️:`, 'route_options', {
        cargoId: id,
        cargoRef: cargoIdStr,
        selected_route: routeData?.selected_route || '',
        routes: routeData ? JSON.parse(routeData.routes_json) : []
      });
    } catch (err) {
      addBotMessage('⚠️ Failed to fetch route recommendations.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSelectRouteInChat = async (messageId, cargoId, route) => {
    try {
      await api.post('/ai-operations/route-options/select', { cargo_id: cargoId, selected_route: route });
      success('Route option selected!');

      // Update message selection status in bubble
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId && msg.type === 'route_options') {
          return { ...msg, data: { ...msg.data, selected_route: route } };
        }
        return msg;
      }));
    } catch (err) {
      error('Selection failed');
    }
  };

  // Direct approval for quotation
  const handleApproveQuoteInChat = async (messageId, quoteIdStr) => {
    try {
      // Find database primary ID for this quote
      const quoteObj = quotes.find(q => q.quote_id === quoteIdStr);
      if (!quoteObj) return;

      await api.post(`/ai-operations/quotations/approve/${quoteObj.id}`);
      success('Quotation approved!');
      fetchLogs(); // refresh sidebar list
      
      // Update UI bubble
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId && msg.type === 'quotation_result') {
          return { ...msg, data: { ...msg.data, status: 'Approved' } };
        }
        return msg;
      }));
    } catch (err) {
      error('Approval failed');
    }
  };

  // Direct approval for claim
  const handleApproveClaimInSidebar = async (id) => {
    try {
      await api.post(`/ai-operations/claims/approve/${id}`);
      success('Claim approved!');
      fetchLogs();
    } catch (err) {
      error('Claim approval failed');
    }
  };

  // Direct resolve for complaint
  const handleResolveComplaintInSidebar = async (id) => {
    try {
      await api.post(`/ai-operations/complaints/resolve/${id}`);
      success('Complaint marked as resolved!');
      fetchLogs();
    } catch (err) {
      error('Resolution failed');
    }
  };

  const handleApproveQuoteInSidebar = async (id) => {
    try {
      await api.post(`/ai-operations/quotations/approve/${id}`);
      success('Quotation approved!');
      fetchLogs();
    } catch (err) {
      error('Approval failed');
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MdIcons.MdSmartToy className="text-blue-600 text-3xl" /> AI Operations Control
          </h2>
          <p className="text-slate-500 text-sm">Automate quotes, optimize routes, verify documents, and calculate claims with conversational AI</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors border border-blue-200"
        >
          <MdIcons.MdRefresh className="text-lg" /> Sync Dashboard
        </button>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Area: Chatbot (2/3 width) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col h-[650px] overflow-hidden relative">
          
          {/* Chat Top Header */}
          <div className="bg-slate-950 px-6 py-4 border-b border-slate-850 flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                <MdIcons.MdSmartToy className="text-2xl animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">ORBEM AI Assistant</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Online &amp; Active</span>
                </div>
              </div>
            </div>
            
            {chatState && (
              <button
                onClick={handleAbort}
                className="flex items-center gap-1 text-xs bg-red-950 text-red-400 border border-red-900 hover:bg-red-900 hover:text-white px-3 py-1.5 rounded-xl transition-all"
              >
                <MdIcons.MdClose /> Cancel Flow
              </button>
            )}
          </div>

          {/* Chat Messages Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 select-text">
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${
                    isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'
                  } animate-in fade-in slide-in-from-bottom-2 duration-250`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${
                    isBot ? 'bg-blue-650 text-white' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {isBot ? <MdIcons.MdSmartToy /> : <MdIcons.MdAccountCircle />}
                  </div>

                  {/* Bubble content */}
                  <div className="space-y-2">
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm font-sans whitespace-pre-wrap ${
                      isBot 
                        ? 'bg-slate-850 text-slate-200 rounded-tl-sm border border-slate-800/80' 
                        : 'bg-blue-600 text-white rounded-tr-sm'
                    }`}>
                      {msg.text}

                      {/* CUSTOM RENDER: RATE COMPARISON */}
                      {msg.type === 'rates' && msg.data && (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {msg.data.map(rate => (
                            <div key={rate.id} className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl space-y-2">
                              <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                                <span className="font-bold text-xs text-white">{rate.airline_name}</span>
                                <span className="text-[9px] bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded font-bold">{rate.transit_days}d</span>
                              </div>
                              <div className="flex justify-between text-[11px] text-slate-400">
                                <span>Route: {rate.origin} ➔ {rate.destination}</span>
                                <span className="font-bold text-white">{rate.rate_per_kg} AED/kg</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* CUSTOM RENDER: SYSTEM INSIGHTS */}
                      {msg.type === 'insights' && msg.data && (
                        <div className="mt-4 space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-center">
                              <span className="text-[10px] text-slate-400 block font-semibold">Active Shipments</span>
                              <span className="text-lg font-bold text-white mt-1 block">{msg.data.total_shipments}</span>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-center">
                              <span className="text-[10px] text-slate-400 block font-semibold">Managed Weight</span>
                              <span className="text-lg font-bold text-white mt-1 block">{(parseFloat(msg.data.total_weight || 0)/1000).toFixed(1)}t</span>
                            </div>
                          </div>
                          <div className="bg-slate-900/40 border border-slate-800 p-3 rounded-xl space-y-2">
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">AI Recommendations:</span>
                            {msg.data.insights.map((item, idx) => (
                              <p key={idx} className="text-xs text-slate-300 pl-3 border-l border-blue-500 leading-relaxed">{item}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* CUSTOM RENDER: GENERATED QUOTE */}
                      {msg.type === 'quotation_result' && msg.data && (
                        <div className="mt-4 bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 font-sans">
                          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                            <span className="font-mono text-xs font-bold text-blue-400">{msg.data.quote_id}</span>
                            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase">
                              {msg.data.status || 'Pending'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="text-slate-400">Customer: <strong className="text-white block">{msg.data.customer_name}</strong></div>
                            <div className="text-slate-400">Cargo Type: <strong className="text-white block">{msg.data.cargo_type} ({msg.data.weight} kg)</strong></div>
                            <div className="text-slate-400 mt-2">Flight Path: <strong className="text-white block">{msg.data.origin} ➔ {msg.data.destination}</strong></div>
                            <div className="text-slate-400 mt-2">Estimated Rate: <strong className="text-white block">{msg.data.rate_per_kg} AED/kg (+{msg.data.extra_charges} AED)</strong></div>
                          </div>
                          <div className="flex justify-between items-center border-t border-slate-800 pt-3 mt-2">
                            <div>
                              <span className="text-[9px] text-slate-500 uppercase font-semibold">Total Price</span>
                              <p className="text-sm font-black text-white">{parseFloat(msg.data.total_charge).toFixed(2)} AED</p>
                            </div>
                            {(!msg.data.status || msg.data.status === 'Pending') && (
                              <button
                                onClick={() => handleApproveQuoteInChat(msg.id, msg.data.quote_id)}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors shadow-sm uppercase tracking-wider"
                              >
                                Approve Rate
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* CUSTOM RENDER: CUSTOMS CHECKLIST */}
                      {msg.type === 'customs_checklist' && msg.data && (
                        <div className="mt-4 space-y-3 font-sans">
                          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1.5">
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">AI Custom Guidelines:</span>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              Air cargo regulations for <strong>{msg.data.cargoType}</strong> require validating compliance documents.
                            </p>
                          </div>
                          <div className="space-y-2">
                            {msg.data.checklist.map((item) => (
                              <div key={item.id} className="flex justify-between items-center p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
                                <div>
                                  <span className="text-xs font-semibold text-white block">{item.document_type}</span>
                                  <span className="text-[9px] text-slate-500 mt-0.5 block">
                                    {item.status === 'Verified' ? `Approved by ${item.verified_by}` : 'Pending validation'}
                                  </span>
                                </div>
                                {item.status === 'Verified' ? (
                                  <span className="text-[10px] font-bold text-green-500 flex items-center gap-0.5">
                                    <MdIcons.MdCheckCircle /> Verified
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleVerifyDocumentInChat(msg.id, item.id, msg.data.cargoId)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] px-2.5 py-1.5 rounded-lg uppercase tracking-wider"
                                  >
                                    Verify
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* CUSTOM RENDER: ROUTE RECOMMENDATIONS */}
                      {msg.type === 'route_options' && msg.data && (
                        <div className="mt-4 space-y-3 font-sans">
                          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs text-slate-400">
                            Current flight path: <strong className="text-blue-400">{msg.data.selected_route || 'None'}</strong>
                          </div>
                          <div className="space-y-2">
                            {msg.data.routes.map((route) => (
                              <div
                                key={route}
                                onClick={() => handleSelectRouteInChat(msg.id, msg.data.cargoId, route)}
                                className={`p-3 border rounded-xl cursor-pointer text-xs transition-all flex justify-between items-center ${
                                  msg.data.selected_route === route
                                    ? 'bg-blue-950/60 border-blue-500/80 text-white font-bold'
                                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                                }`}
                              >
                                <span>{route}</span>
                                {msg.data.selected_route === route && (
                                  <span className="bg-blue-600 text-white font-black text-[8px] px-1.5 py-0.5 rounded-md uppercase">Selected</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* CUSTOM RENDER: TEXT CLEANER OUTPUT */}
                      {msg.type === 'cleaner_result' && msg.data && (
                        <div className="mt-4">
                          <pre className="bg-slate-900 border border-slate-800 text-[10px] font-mono px-3 py-2.5 rounded-xl text-green-400 overflow-x-auto">
                            {msg.data}
                          </pre>
                        </div>
                      )}

                      {/* CUSTOM RENDER: DAMAGE CLAIM CONFIRM */}
                      {msg.type === 'claim_result' && msg.data && (
                        <div className="mt-4 bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                          <div className="flex justify-between items-center border-b border-slate-850 pb-2 mb-2 text-xs">
                            <span className="font-mono text-blue-400 font-bold">{msg.data.claim_id}</span>
                            <span className="text-[9px] bg-slate-850 text-slate-400 px-2 py-0.5 rounded uppercase">Submitted</span>
                          </div>
                          <div className="text-xs space-y-1.5">
                            <p className="text-slate-400">Cargo ID: <strong className="text-white">{msg.data.cargo_ref}</strong></p>
                            <p className="text-slate-400">Amount: <strong className="text-white">{msg.data.amount} AED</strong></p>
                            <p className="text-slate-400">Description: <strong className="text-white block italic text-[11px] mt-0.5">"{msg.data.description}"</strong></p>
                          </div>
                        </div>
                      )}

                      {/* CUSTOM RENDER: COMPLAINT REGISTER CONFIRM */}
                      {msg.type === 'complaint_result' && msg.data && (
                        <div className="mt-4 bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                          <div className="flex justify-between items-center border-b border-slate-850 pb-2 mb-2 text-xs">
                            <span className="font-mono text-blue-400 font-bold">{msg.data.complaint_id}</span>
                            <span className="text-[9px] bg-red-950 text-red-400 border border-red-900/30 px-2 py-0.5 rounded uppercase">Open</span>
                          </div>
                          <div className="text-xs space-y-1.5">
                            <p className="text-slate-400">Customer: <strong className="text-white">{msg.data.customer_name}</strong></p>
                            <p className="text-slate-400">Subject: <strong className="text-white">{msg.data.subject}</strong></p>
                            <p className="text-slate-400">Description: <strong className="text-white block italic text-[11px] mt-0.5">"{msg.data.description}"</strong></p>
                          </div>
                        </div>
                      )}

                    </div>
                    <span className="text-[9px] text-slate-500 font-mono block pl-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-3 max-w-[85%] mr-auto">
                <div className="w-8 h-8 rounded-xl bg-blue-650 text-white flex items-center justify-center flex-shrink-0 font-bold">
                  <MdIcons.MdSmartToy />
                </div>
                <div className="bg-slate-850 text-slate-400 p-4 rounded-2xl rounded-tl-sm border border-slate-800/80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-850 z-10">
            <div className="flex gap-2 overflow-x-auto py-1 scrollbar-none select-none">
              {chatState?.type === 'customs' && chatState?.step === 'select_cargo' ? (
                // Show cargo options inline
                cargoList.slice(0, 8).map(cargo => (
                  <button
                    key={cargo.id}
                    onClick={() => processGuidedFlow(cargo.cargo_id)}
                    className="flex-shrink-0 bg-blue-900/40 text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-900 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  >
                    📦 {cargo.cargo_id}
                  </button>
                ))
              ) : chatState?.type === 'routes' && chatState?.step === 'select_cargo' ? (
                // Show cargo options for routing
                cargoList.slice(0, 8).map(cargo => (
                  <button
                    key={cargo.id}
                    onClick={() => processGuidedFlow(cargo.cargo_id)}
                    className="flex-shrink-0 bg-blue-900/40 text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-900 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  >
                    📦 {cargo.cargo_id}
                  </button>
                ))
              ) : chatState?.type === 'claim' && chatState?.step === 'cargo' ? (
                // Show cargo options for claims
                cargoList.slice(0, 8).map(cargo => (
                  <button
                    key={cargo.id}
                    onClick={() => processGuidedFlow(cargo.cargo_id)}
                    className="flex-shrink-0 bg-blue-900/40 text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-900 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  >
                    📦 {cargo.cargo_id}
                  </button>
                ))
              ) : chatState?.type === 'quote' && chatState?.step === 'type' ? (
                // Show type options inline
                ['Electronics', 'Pharmaceuticals', 'Textiles', 'Machinery', 'Perishables', 'Chemicals'].map(t => (
                  <button
                    key={t}
                    onClick={() => processGuidedFlow(t)}
                    className="flex-shrink-0 bg-blue-900/40 text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-900 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  >
                    🏷️ {t}
                  </button>
                ))
              ) : (
                // Standard quick action chips
                <>
                  <button
                    onClick={() => handleActionClick('quote')}
                    className="flex-shrink-0 bg-slate-900 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
                  >
                    📋 Generate Quote
                  </button>
                  <button
                    onClick={() => handleActionClick('customs')}
                    className="flex-shrink-0 bg-slate-900 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
                  >
                    🛃 Customs Check
                  </button>
                  <button
                    onClick={() => handleActionClick('cleaner')}
                    className="flex-shrink-0 bg-slate-900 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
                  >
                    ✨ Clean Description
                  </button>
                  <button
                    onClick={() => handleActionClick('routes')}
                    className="flex-shrink-0 bg-slate-900 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
                  >
                    🗺️ Route Recommend
                  </button>
                  <button
                    onClick={() => handleActionClick('claim')}
                    className="flex-shrink-0 bg-slate-900 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
                  >
                    🛡️ Submit Claim
                  </button>
                  <button
                    onClick={() => handleActionClick('rates')}
                    className="flex-shrink-0 bg-slate-900 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
                  >
                    ✈️ Compare Rates
                  </button>
                  <button
                    onClick={() => handleActionClick('complaint')}
                    className="flex-shrink-0 bg-slate-900 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
                  >
                    💬 File Complaint
                  </button>
                  <button
                    onClick={() => handleActionClick('insights')}
                    className="flex-shrink-0 bg-slate-900 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
                  >
                    📊 System Insights
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Chat Input form */}
          <div className="bg-slate-950 px-6 py-4 border-t border-slate-850 z-10">
            <form onSubmit={handleUserMessageSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder={
                  chatState 
                    ? `Guided: Type details for ${chatState.type}...` 
                    : 'Type a command or ask a question (e.g. "compare rates")...'
                }
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 font-semibold text-xs transition-colors flex items-center justify-center gap-1 shadow-md shadow-blue-500/10"
              >
                <MdIcons.MdSend className="text-sm" /> Send
              </button>
            </form>
          </div>

        </div>

        {/* Right Area: Operational Log Panel (1/3 width) */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col h-[650px] overflow-hidden select-text">
          
          {/* Panel Top Header Tabs */}
          <div className="bg-slate-50 border-b border-slate-100 flex p-2 gap-1 flex-shrink-0 select-none">
            {['quotes', 'claims', 'complaints'].map(tab => (
              <button
                key={tab}
                onClick={() => setSidebarTab(tab)}
                className={`flex-1 text-center py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                  sidebarTab === tab
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'
                }`}
              >
                {tab === 'quotes' ? 'Quotations' : tab === 'claims' ? 'Claims' : 'Complaints'}
              </button>
            ))}
          </div>

          {/* Panel Content list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Syncing database...
              </div>
            ) : (
              <>
                {/* Quotations tab list */}
                {sidebarTab === 'quotes' && (
                  quotes.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">No quotations generated yet.</p>
                  ) : (
                    quotes.map(q => (
                      <div key={q.id} className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-xs font-bold text-slate-800">{q.quote_id}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            q.status === 'Approved' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-250'
                          }`}>
                            {q.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 space-y-0.5">
                          <p>Customer: <strong className="text-slate-800">{q.customer_name}</strong></p>
                          <p>Cargo: {q.cargo_type} ({q.weight} kg)</p>
                          <p>Route: {q.origin} ➔ {q.destination}</p>
                          <p className="font-semibold text-blue-600 text-xs mt-1">Total: {parseFloat(q.total_charge).toFixed(2)} AED</p>
                        </div>
                        {q.status === 'Pending' && (
                          <button
                            onClick={() => handleApproveQuoteInSidebar(q.id)}
                            className="w-full text-center py-1.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-[9px] uppercase tracking-wider transition-colors mt-1.5"
                          >
                            Approve Quote
                          </button>
                        )}
                      </div>
                    ))
                  )
                )}

                {/* Claims tab list */}
                {sidebarTab === 'claims' && (
                  claims.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">No claims submitted yet.</p>
                  ) : (
                    claims.map(c => (
                      <div key={c.id} className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-xs font-bold text-slate-800">{c.claim_id}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            c.status === 'Approved' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-250'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 space-y-0.5">
                          <p>Cargo Ref: <strong className="text-slate-800">{c.cargo_ref}</strong></p>
                          <p className="italic">"{c.description}"</p>
                          <p className="font-semibold text-blue-600 text-xs mt-1">Amount: {c.amount} AED</p>
                        </div>
                        {c.status === 'Submitted' && (
                          <button
                            onClick={() => handleApproveClaimInSidebar(c.id)}
                            className="w-full text-center py-1.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-[9px] uppercase tracking-wider transition-colors mt-1.5"
                          >
                            Approve Claim
                          </button>
                        )}
                      </div>
                    ))
                  )
                )}

                {/* Complaints tab list */}
                {sidebarTab === 'complaints' && (
                  complaints.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">No complaints registered yet.</p>
                  ) : (
                    complaints.map(c => (
                      <div key={c.id} className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-xs font-bold text-slate-800">{c.complaint_id}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            c.status === 'Resolved' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 space-y-0.5">
                          <p>Customer: <strong className="text-slate-800">{c.customer_name}</strong></p>
                          <p className="font-medium text-slate-700">Subject: {c.subject}</p>
                          <p className="italic">"{c.description}"</p>
                        </div>
                        {c.status === 'Open' && (
                          <button
                            onClick={() => handleResolveComplaintInSidebar(c.id)}
                            className="w-full text-center py-1.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-[9px] uppercase tracking-wider transition-colors mt-1.5"
                          >
                            Resolve Complaint
                          </button>
                        )}
                      </div>
                    ))
                  )
                )}
              </>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
