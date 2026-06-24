import { useState, useEffect, useRef } from 'react';
import * as MdIcons from 'react-icons/md';
import api from '../utils/api';
import ToastContainer from '../components/ToastContainer';
import { useToast } from '../hooks/useToast';

// ─── Inline Form Components for Chat ──────────────────────────────────────────

const InChatQuoteForm = ({ onSubmit }) => {
  const [customerName, setCustomerName] = useState('');
  const [weight, setWeight] = useState('');
  const [cargoType, setCargoType] = useState('Electronics');
  const [origin, setOrigin] = useState('BOM');
  const [destination, setDestination] = useState('DEL');
  const [rate, setRate] = useState('2.50');
  const [extra, setExtra] = useState('0');
  const [pasteText, setPasteText] = useState('');

  const applyPreset = (preset) => {
    if (preset === 'electronics') {
      setCustomerName('Swift Logistics');
      setWeight('350');
      setCargoType('Electronics');
      setOrigin('BOM');
      setDestination('DXB');
      setRate('3.20');
      setExtra('150');
    } else if (preset === 'foods') {
      setCustomerName('Emirates Foods');
      setWeight('1200');
      setCargoType('Perishables');
      setOrigin('DXB');
      setDestination('BOM');
      setRate('1.95');
      setExtra('250');
    } else if (preset === 'pharma') {
      setCustomerName('Global Pharma');
      setWeight('80');
      setCargoType('Pharmaceuticals');
      setOrigin('LHR');
      setDestination('DEL');
      setRate('5.20');
      setExtra('300');
    }
  };

  const handleParse = () => {
    if (!pasteText.trim()) return;
    const text = pasteText;
    
    // Weight
    const wMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilos?|weight)/i) || text.match(/(?:weight|mass)\s*(?:is|of)?\s*(\d+(?:\.\d+)?)/i);
    if (wMatch) setWeight(wMatch[1]);

    // Cargo Type
    const cargoTypes = ['electronics', 'pharmaceuticals', 'textiles', 'machinery', 'perishables', 'chemicals'];
    for (const type of cargoTypes) {
      if (new RegExp(type, 'i').test(text)) {
        setCargoType(type.charAt(0).toUpperCase() + type.slice(1));
        break;
      }
    }

    // Origin & Destination
    const routeMatch = text.match(/\b([A-Za-z]{3})\s*(?:➔|->|to)\s*([A-Za-z]{3})\b/i);
    if (routeMatch) {
      setOrigin(routeMatch[1].toUpperCase());
      setDestination(routeMatch[2].toUpperCase());
    } else {
      const originMatch = text.match(/(?:from|origin)\s+([A-Za-z]{3})\b/i);
      const destMatch = text.match(/(?:to|destination)\s+([A-Za-z]{3})\b/i);
      if (originMatch) setOrigin(originMatch[1].toUpperCase());
      if (destMatch) setDestination(destMatch[1].toUpperCase());
    }

    // Rate
    const rMatch = text.match(/(?:rate|price)\s*(?:of|is|at)?\s*([\d\.]+)/i) || text.match(/([\d\.]+)\s*(?:\/kg|per\s*kg)/i);
    if (rMatch) setRate(rMatch[1]);

    // Extra
    const exMatch = text.match(/(?:extra|charges|fee)\s*(?:of|is)?\s*(\d+)/i);
    if (exMatch) setExtra(exMatch[1]);

    // Name
    const nameMatch = text.match(/(?:for|customer|name|client)\s+([^,]+)/i);
    if (nameMatch) {
      let name = nameMatch[1].trim();
      name = name.replace(/(?:quote|kilos|kg|electronics|pharmaceuticals|textiles|machinery|perishables|chemicals|rate|extra|charges|from|to)\b.*/i, '').trim();
      if (name) setCustomerName(name);
    }
    setPasteText('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      customer_name: customerName,
      weight,
      cargo_type: cargoType,
      origin,
      destination,
      rate_per_kg: rate,
      extra_charges: extra
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 w-full max-w-sm mt-3 text-slate-200">
      <div className="border-b border-slate-800 pb-2">
        <span className="text-xs font-bold text-blue-400">Generate Cargo Quotation</span>
      </div>
      
      {/* Presets Row */}
      <div className="space-y-1">
        <label className="text-[10px] text-slate-400 font-semibold block">Quick Presets</label>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => applyPreset('electronics')}
            className="bg-slate-950 hover:bg-slate-800 border border-slate-850 px-2 py-1 rounded text-[10px] text-slate-300 font-medium transition-colors"
          >
            📦 Electronics
          </button>
          <button
            type="button"
            onClick={() => applyPreset('foods')}
            className="bg-slate-950 hover:bg-slate-800 border border-slate-850 px-2 py-1 rounded text-[10px] text-slate-300 font-medium transition-colors"
          >
            🍎 Fresh Foods
          </button>
          <button
            type="button"
            onClick={() => applyPreset('pharma')}
            className="bg-slate-950 hover:bg-slate-800 border border-slate-850 px-2 py-1 rounded text-[10px] text-slate-300 font-medium transition-colors"
          >
            💊 Biotech Pharma
          </button>
        </div>
      </div>

      {/* Smart Paste Block */}
      <div className="space-y-1 bg-slate-950 p-2 rounded-lg border border-slate-850">
        <label className="text-[10px] text-blue-400 font-semibold flex items-center gap-1">
          <MdIcons.MdAutoAwesome className="text-xs animate-pulse text-blue-400" /> Smart Text Auto-Fill
        </label>
        <div className="flex gap-1">
          <input
            type="text"
            placeholder="e.g. Swift Logistics, 500kg electronics, BOM to DXB, rate 2.5"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-white focus:outline-none placeholder:text-slate-650"
          />
          <button
            type="button"
            onClick={handleParse}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-2.5 rounded transition-colors"
          >
            Parse
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-slate-400 font-semibold">Customer Name</label>
        <input
          type="text" required
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-semibold">Weight (kg)</label>
          <input
            type="number" required min="1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-semibold">Cargo Type</label>
          <select
            value={cargoType}
            onChange={(e) => setCargoType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
          >
            {['Electronics', 'Pharmaceuticals', 'Textiles', 'Machinery', 'Perishables', 'Chemicals'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-semibold">Origin (IATA)</label>
          <input
            type="text" required maxLength="3"
            value={origin}
            onChange={(e) => setOrigin(e.target.value.toUpperCase())}
            className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-semibold">Destination (IATA)</label>
          <input
            type="text" required maxLength="3"
            value={destination}
            onChange={(e) => setDestination(e.target.value.toUpperCase())}
            className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-semibold">Rate per kg (AED)</label>
          <input
            type="number" step="0.01" required
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-semibold">Extra Charges (AED)</label>
          <input
            type="number" required
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors mt-2"
      >
        Generate Quotation
      </button>
    </form>
  );
};

const InChatClaimForm = ({ onSubmit, cargoList }) => {
  const [cargoId, setCargoId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [pasteText, setPasteText] = useState('');

  const applyPreset = (preset) => {
    if (cargoList.length > 0 && !cargoId) {
      setCargoId(cargoList[0].id);
    }
    if (preset === 'forklift') {
      setAmount('1200');
      setDescription('Water leakage and physical crush during forklift transport in sector A-03.');
      setDocUrl('damage_forklift_report.pdf');
    } else if (preset === 'temp') {
      setAmount('3400');
      setDescription('Cooling unit malfunction in warehouse zone B causing temperature deviation.');
      setDocUrl('temp_log_alert.pdf');
    }
  };

  const handleParse = () => {
    if (!pasteText.trim()) return;
    const text = pasteText;

    // Amount
    const amMatch = text.match(/(?:amount|claim|cost|price)\s*(?:of|is)?\s*(\d+)/i) || text.match(/(\d+)\s*(?:aed|usd|dirhams)/i);
    if (amMatch) setAmount(amMatch[1]);

    // Cargo ID check: look for CRG-XXXXXXX in cargo list
    const refMatch = text.match(/\b(CRG-\d+)\b/i);
    if (refMatch) {
      const matchedCargo = cargoList.find(c => c.cargo_id.toLowerCase() === refMatch[1].toLowerCase());
      if (matchedCargo) setCargoId(matchedCargo.id);
    } else if (cargoList.length > 0 && !cargoId) {
      setCargoId(cargoList[0].id);
    }

    // Description (everything else or the description itself)
    const cleanDesc = text.replace(/(?:amount|claim|cost|price|aed|usd|dirhams|crg-\d+)\s*is?\s*(\d+)?/gi, '').trim();
    setDescription(cleanDesc || text);
    
    setPasteText('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cargoId) return;
    onSubmit({
      cargo_id: cargoId,
      amount,
      description,
      document_url: docUrl || null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 w-full max-w-sm mt-3 text-slate-200">
      <div className="border-b border-slate-800 pb-2">
        <span className="text-xs font-bold text-blue-400">File Insurance Claim</span>
      </div>

      {/* Presets Row */}
      <div className="space-y-1">
        <label className="text-[10px] text-slate-400 font-semibold block">Quick Presets</label>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => applyPreset('forklift')}
            className="bg-slate-950 hover:bg-slate-800 border border-slate-850 px-2 py-1 rounded text-[10px] text-slate-300 font-medium transition-colors"
          >
            📦 Forklift Damage
          </button>
          <button
            type="button"
            onClick={() => applyPreset('temp')}
            className="bg-slate-950 hover:bg-slate-800 border border-slate-850 px-2 py-1 rounded text-[10px] text-slate-300 font-medium transition-colors"
          >
            ❄️ Temp Deviation
          </button>
        </div>
      </div>

      {/* Smart Paste Block */}
      <div className="space-y-1 bg-slate-950 p-2 rounded-lg border border-slate-850">
        <label className="text-[10px] text-blue-400 font-semibold flex items-center gap-1">
          <MdIcons.MdAutoAwesome className="text-xs animate-pulse text-blue-400" /> Smart Text Auto-Fill
        </label>
        <div className="flex gap-1">
          <input
            type="text"
            placeholder="e.g. 1200 AED damage forklift water leak"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-white focus:outline-none placeholder:text-slate-650"
          />
          <button
            type="button"
            onClick={handleParse}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-2.5 rounded transition-colors"
          >
            Parse
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-slate-400 font-semibold">Select Cargo</label>
        <select
          value={cargoId} required
          onChange={(e) => setCargoId(e.target.value)}
          className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
        >
          <option value="">-- Select Shipment --</option>
          {cargoList.map(c => (
            <option key={c.id} value={c.id}>{c.cargo_id} ({c.customer_name})</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-slate-400 font-semibold">Claim Amount (AED)</label>
        <input
          type="number" required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-slate-400 font-semibold">Documents Reference / Photo URL</label>
        <input
          type="text"
          placeholder="E.g. damage_receipt.jpg"
          value={docUrl}
          onChange={(e) => setDocUrl(e.target.value)}
          className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-slate-400 font-semibold">Description of Damage</label>
        <textarea
          rows="2" required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
        />
      </div>

      <button
        type="submit"
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors mt-2"
      >
        Submit Claim
      </button>
    </form>
  );
};

const InChatComplaintForm = ({ onSubmit }) => {
  const [customerName, setCustomerName] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [pasteText, setPasteText] = useState('');

  const applyPreset = (preset) => {
    if (preset === 'delay') {
      setCustomerName('Swift Logistics');
      setSubject('Delay on CRG-20260002');
      setDescription('Expected delivery was delayed by 24 hours at transshipment airport, causing customer complaints.');
    } else if (preset === 'billing') {
      setCustomerName('Falcon Air');
      setSubject('Invoice Overcharge');
      setDescription('Billed extra handling charges of 500 AED for fuel surcharge which was already fully paid in original quote.');
    }
  };

  const handleParse = () => {
    if (!pasteText.trim()) return;
    const text = pasteText;

    // Customer
    const custMatch = text.match(/(?:customer|client|name|company)\s+([^,]+)/i);
    if (custMatch) {
      let name = custMatch[1].trim();
      name = name.replace(/(?:complaint|subject|description|about|delay|fee|billed|invoice)\b.*/i, '').trim();
      if (name) setCustomerName(name);
    } else {
      const words = text.split(/\s+/);
      if (words.length > 2) {
        setCustomerName(words[0] + ' ' + words[1]);
      }
    }

    // Subject
    const subMatch = text.match(/(?:subject|about)\s+([^.]+)/i);
    if (subMatch) {
      setSubject(subMatch[1].trim());
    } else {
      const firstSentence = text.split(/[.!?]/)[0].trim();
      setSubject(firstSentence.slice(0, 50));
    }

    // Description
    setDescription(text);
    setPasteText('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      customer_name: customerName,
      subject,
      description
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 w-full max-w-sm mt-3 text-slate-200">
      <div className="border-b border-slate-800 pb-2">
        <span className="text-xs font-bold text-blue-400">File Customer Complaint</span>
      </div>

      {/* Presets Row */}
      <div className="space-y-1">
        <label className="text-[10px] text-slate-400 font-semibold block">Quick Presets</label>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => applyPreset('delay')}
            className="bg-slate-950 hover:bg-slate-800 border border-slate-850 px-2 py-1 rounded text-[10px] text-slate-300 font-medium transition-colors"
          >
            🚚 Delay Dispute
          </button>
          <button
            type="button"
            onClick={() => applyPreset('billing')}
            className="bg-slate-950 hover:bg-slate-800 border border-slate-850 px-2 py-1 rounded text-[10px] text-slate-300 font-medium transition-colors"
          >
            💵 Overbilling
          </button>
        </div>
      </div>

      {/* Smart Paste Block */}
      <div className="space-y-1 bg-slate-950 p-2 rounded-lg border border-slate-850">
        <label className="text-[10px] text-blue-400 font-semibold flex items-center gap-1">
          <MdIcons.MdAutoAwesome className="text-xs animate-pulse text-blue-400" /> Smart Text Auto-Fill
        </label>
        <div className="flex gap-1">
          <input
            type="text"
            placeholder="e.g. Swift Logistics customer, delayed flight complaint"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-white focus:outline-none placeholder:text-slate-650"
          />
          <button
            type="button"
            onClick={handleParse}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-2.5 rounded transition-colors"
          >
            Parse
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-slate-400 font-semibold">Customer Name</label>
        <input
          type="text" required
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-slate-400 font-semibold">Subject</label>
        <input
          type="text" required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-slate-400 font-semibold">Detailed Description</label>
        <textarea
          rows="2" required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
        />
      </div>

      <button
        type="submit"
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors mt-2"
      >
        File Complaint
      </button>
    </form>
  );
};

const InChatCleanerForm = ({ onSubmit }) => {
  const [description, setDescription] = useState('');

  const applyPreset = (preset) => {
    if (preset === 'messy1') {
      setDescription('5 big boxes of cargo components, fragile handle with care, urgent cargo, stored temp control');
    } else if (preset === 'messy2') {
      setDescription('lot of shirts textile boxes 12 units of size XL weight around 120kg total client nemith reddy');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(description);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 w-full max-w-sm mt-3 text-slate-200">
      <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
        <span className="text-xs font-bold text-blue-400">Clean Cargo Description</span>
      </div>

      {/* Presets Row */}
      <div className="space-y-1">
        <label className="text-[10px] text-slate-400 font-semibold block">Quick Presets</label>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => applyPreset('messy1')}
            className="bg-slate-950 hover:bg-slate-800 border border-slate-850 px-2 py-1 rounded text-[10px] text-slate-300 font-medium transition-colors"
          >
            📋 Messy Cargo 1
          </button>
          <button
            type="button"
            onClick={() => applyPreset('messy2')}
            className="bg-slate-950 hover:bg-slate-800 border border-slate-850 px-2 py-1 rounded text-[10px] text-slate-300 font-medium transition-colors"
          >
            📋 Messy Cargo 2
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-slate-400 font-semibold">Raw Notes / Description</label>
        <textarea
          rows="3" required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
        />
      </div>

      <button
        type="submit"
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors mt-2"
      >
        Clean Manifest Description
      </button>
    </form>
  );
};

const InChatCustomsForm = ({ onSubmit, cargoList }) => {
  const [cargoId, setCargoId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cargoId) return;
    const cargo = cargoList.find(c => c.id.toString() === cargoId);
    onSubmit(cargo);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 w-full max-w-sm mt-3 text-slate-200">
      <div className="border-b border-slate-800 pb-2">
        <span className="text-xs font-bold text-blue-400">Select Cargo for Customs Audit</span>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-slate-400 font-semibold">Cargo Shipment</label>
        <select
          value={cargoId} required
          onChange={(e) => setCargoId(e.target.value)}
          className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
        >
          <option value="">-- Choose Shipment --</option>
          {cargoList.map(c => (
            <option key={c.id} value={c.id}>{c.cargo_id} ({c.customer_name} - {c.cargo_type})</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors mt-2"
      >
        Load Checklist
      </button>
    </form>
  );
};

const InChatRouteSelectForm = ({ onSubmit, cargoList }) => {
  const [cargoId, setCargoId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cargoId) return;
    const cargo = cargoList.find(c => c.id.toString() === cargoId);
    onSubmit(cargo);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 w-full max-w-sm mt-3 text-slate-200">
      <div className="border-b border-slate-800 pb-2">
        <span className="text-xs font-bold text-blue-400">Select Cargo for Flight Path Optimization</span>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-slate-400 font-semibold">Cargo Shipment</label>
        <select
          value={cargoId} required
          onChange={(e) => setCargoId(e.target.value)}
          className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
        >
          <option value="">-- Choose Shipment --</option>
          {cargoList.map(c => (
            <option key={c.id} value={c.id}>{c.cargo_id} ({c.customer_name} - {c.cargo_type})</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors mt-2"
      >
        Calculate Paths
      </button>
    </form>
  );
};

// ─── Main AI Operations Page ──────────────────────────────────────────────────

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

**Choose an operation using the quick action chips below to open an interactive form directly in the chat, or type your request!**`,
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
    }, 400);
  };

  // ─── Guided Flows State Machine ──────────────────────────────────────────

  const handleActionClick = (actionType) => {
    // Add user message indicating action
    setMessages((prev) => [
      ...prev,
      {
        id: `action-${Date.now()}`,
        sender: 'user',
        text: `Opened form: ${actionType.replace('_', ' ').toUpperCase()}`,
        timestamp: new Date()
      }
    ]);

    if (actionType === 'quote') {
      addBotMessage('Please fill out the details below to generate your **Quotation**:', 'form_quote');
    } 
    else if (actionType === 'customs') {
      addBotMessage('Please select a cargo shipment to generate the **Customs Checklist**:', 'form_customs');
    }
    else if (actionType === 'cleaner') {
      addBotMessage('Please enter the raw cargo description manifest to **Clean & Standardize**:', 'form_cleaner');
    }
    else if (actionType === 'routes') {
      addBotMessage('Select a cargo shipment to calculate **Flight Route Recommendations**:', 'form_routes');
    }
    else if (actionType === 'claim') {
      addBotMessage('Please fill out the claim details below to submit a **Damage Claim**:', 'form_claim');
    }
    else if (actionType === 'rates') {
      fetchAirlineRatesDirect();
    }
    else if (actionType === 'complaint') {
      addBotMessage('Please fill out the form below to file a **Customer Complaint**:', 'form_complaint');
    }
    else if (actionType === 'insights') {
      fetchInsightsDirect();
    }
  };

  // Direct fetchers (no inputs needed)
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

  // Handling Text Submissions from Chat Input (NLU Fallback)
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

    // Natural language / command detection fallback
    processGeneralCommand(userText);
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

Could you please select one of the quick actions below to open a form? 👇`);
    }
  };

  // ─── Form Submission Handler APIs ──────────────────────────────────────────

  const handleQuoteFormSubmit = async (formData) => {
    setIsTyping(true);
    try {
      const res = await api.post('/ai-operations/quotations', formData);
      if (res.data.success) {
        success('Quotation generated successfully!');
        fetchLogs(); // refresh sidebar list
        addBotMessage(`🎉 **Air Cargo Quotation generated successfully!**`, 'quotation_result', {
          ...formData,
          quote_id: res.data.data.quote_id,
          total_charge: res.data.data.total_charge
        });
      }
    } catch (err) {
      addBotMessage('❌ Failed to generate quotation. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleCustomsFormSubmit = async (cargoObj) => {
    setIsTyping(true);
    try {
      const res = await api.get(`/ai-operations/customs-checklist/${cargoObj.id}`);
      const checklist = res.data.data || [];
      addBotMessage(`Checklist loaded for cargo **${cargoObj.cargo_id}** (${cargoObj.cargo_type}) 🛃:`, 'customs_checklist', {
        cargoId: cargoObj.id,
        cargoRef: cargoObj.cargo_id,
        cargoType: cargoObj.cargo_type,
        checklist
      });
    } catch (err) {
      addBotMessage('⚠️ Failed to load customs checklist.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleCleanerFormSubmit = async (rawText) => {
    setIsTyping(true);
    try {
      const res = await api.post('/ai-operations/clean-description', { description: rawText });
      if (res.data.success) {
        success('Cargo description cleaned!');
        addBotMessage(`✨ **Standardized Cargo Description Manifest:**`, 'cleaner_result', res.data.data);
      }
    } catch (err) {
      addBotMessage('❌ Description cleaner endpoint error.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleRouteSelectFormSubmit = async (cargoObj) => {
    setIsTyping(true);
    try {
      const res = await api.get(`/ai-operations/route-options/${cargoObj.id}`);
      const routeData = res.data.data || null;
      addBotMessage(`Route recommendations for **${cargoObj.cargo_id}** 🗺️:`, 'route_options', {
        cargoId: cargoObj.id,
        cargoRef: cargoObj.cargo_id,
        selected_route: routeData?.selected_route || '',
        routes: routeData ? JSON.parse(routeData.routes_json) : []
      });
    } catch (err) {
      addBotMessage('⚠️ Failed to fetch route recommendations.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleClaimFormSubmit = async (claimData) => {
    setIsTyping(true);
    try {
      const res = await api.post('/ai-operations/claims', claimData);
      if (res.data.success) {
        success('Claim submitted successfully!');
        fetchLogs();
        addBotMessage(`🛡️ **Insurance Claim submitted successfully!**`, 'claim_result', {
          ...claimData,
          claim_id: res.data.data.claim_id,
          cargo_ref: cargoList.find(c => c.id.toString() === claimData.cargo_id.toString())?.cargo_id || 'Shipment'
        });
      }
    } catch (err) {
      addBotMessage('❌ Failed to submit claim. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleComplaintFormSubmit = async (complaintData) => {
    setIsTyping(true);
    try {
      const res = await api.post('/ai-operations/complaints', complaintData);
      if (res.data.success) {
        success('Complaint filed!');
        fetchLogs();
        addBotMessage(`💬 **Customer Complaint registered successfully!**`, 'complaint_result', {
          ...complaintData,
          complaint_id: res.data.data.complaint_id
        });
      }
    } catch (err) {
      addBotMessage('❌ Failed to register complaint.');
    } finally {
      setIsTyping(false);
    }
  };

  // Interactive buttons inside chat bubbles handlers
  const handleVerifyDocumentInChat = async (messageId, docId, cargoId) => {
    try {
      await api.post('/ai-operations/customs-checklist/verify', { id: docId, verified_by: 'Super Admin' });
      success('Document verified successfully!');
      
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

  const handleSelectRouteInChat = async (messageId, cargoId, route) => {
    try {
      await api.post('/ai-operations/route-options/select', { cargo_id: cargoId, selected_route: route });
      success('Route option selected!');

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

  const handleApproveQuoteInChat = async (messageId, quoteIdStr) => {
    try {
      const quoteObj = quotes.find(q => q.quote_id === quoteIdStr);
      if (!quoteObj) return;

      await api.post(`/ai-operations/quotations/approve/${quoteObj.id}`);
      success('Quotation approved!');
      fetchLogs();
      
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

  // Sidebar controls
  const handleApproveClaimInSidebar = async (id) => {
    try {
      await api.post(`/ai-operations/claims/approve/${id}`);
      success('Claim approved!');
      fetchLogs();
    } catch (err) {
      error('Claim approval failed');
    }
  };

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
    <div className="space-y-6 font-sans">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MdIcons.MdSmartToy className="text-blue-600 text-3xl" /> AI Operations Control
          </h2>
          <p className="text-slate-500 text-sm">Conversational AI chatbot that loads operational forms directly into your message feed</p>
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
          <div className="bg-slate-950 px-6 py-4 border-b border-slate-850 flex justify-between items-center z-10 select-none">
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
            
            <button
              onClick={() => {
                setMessages([
                  {
                    id: 'welcome-reset',
                    sender: 'bot',
                    text: '👋 AI Chat thread reset! Choose an action below or ask a question:',
                    timestamp: new Date()
                  }
                ]);
              }}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 border border-slate-800 hover:bg-slate-800 rounded-xl transition-all"
            >
              Clear Thread
            </button>
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
                  <div className="space-y-2 w-full">
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                      isBot 
                        ? 'bg-slate-850 text-slate-200 rounded-tl-sm border border-slate-800/80' 
                        : 'bg-blue-600 text-white rounded-tr-sm w-fit ml-auto'
                    }`}>
                      {msg.text}

                      {/* INLINE FORMS */}
                      {msg.type === 'form_quote' && (
                        <InChatQuoteForm onSubmit={handleQuoteFormSubmit} />
                      )}
                      
                      {msg.type === 'form_claim' && (
                        <InChatClaimForm onSubmit={handleClaimFormSubmit} cargoList={cargoList} />
                      )}

                      {msg.type === 'form_complaint' && (
                        <InChatComplaintForm onSubmit={handleComplaintFormSubmit} />
                      )}

                      {msg.type === 'form_cleaner' && (
                        <InChatCleanerForm onSubmit={handleCleanerFormSubmit} />
                      )}

                      {msg.type === 'form_customs' && (
                        <InChatCustomsForm onSubmit={handleCustomsFormSubmit} cargoList={cargoList} />
                      )}

                      {msg.type === 'form_routes' && (
                        <InChatRouteSelectForm onSubmit={handleRouteSelectFormSubmit} cargoList={cargoList} />
                      )}

                      {/* OUTPUT CARD RENDERS */}
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

                      {msg.type === 'quotation_result' && msg.data && (
                        <div className="mt-4 bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                            <span className="font-mono text-xs font-bold text-blue-400">{msg.data.quote_id}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              msg.data.status === 'Approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {msg.data.status || 'Pending'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="text-slate-400 font-medium">Customer: <strong className="text-white block font-semibold mt-0.5">{msg.data.customer_name}</strong></div>
                            <div className="text-slate-400 font-medium">Cargo: <strong className="text-white block font-semibold mt-0.5">{msg.data.cargo_type} ({msg.data.weight} kg)</strong></div>
                            <div className="text-slate-400 font-medium mt-2">Flight Path: <strong className="text-white block font-semibold mt-0.5">{msg.data.origin} ➔ {msg.data.destination}</strong></div>
                            <div className="text-slate-400 font-medium mt-2">Estimated Rate: <strong className="text-white block font-semibold mt-0.5">{msg.data.rate_per_kg} AED/kg (+{msg.data.extra_charges} AED)</strong></div>
                          </div>
                          <div className="flex justify-between items-center border-t border-slate-800 pt-3 mt-2">
                            <div>
                              <span className="text-[9px] text-slate-500 uppercase font-semibold">Total Price</span>
                              <p className="text-sm font-black text-white">{parseFloat(msg.data.total_charge).toFixed(2)} AED</p>
                            </div>
                            {(!msg.data.status || msg.data.status === 'Pending') && (
                              <button
                                onClick={() => handleApproveQuoteInChat(msg.id, msg.data.quote_id)}
                                className="bg-green-650 hover:bg-green-700 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors shadow-sm uppercase tracking-wider"
                              >
                                Approve Rate
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {msg.type === 'customs_checklist' && msg.data && (
                        <div className="mt-4 space-y-3">
                          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs">
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">AI Guidelines:</span>
                            <p className="text-slate-300 leading-relaxed">
                              Air cargo regulations for <strong>{msg.data.cargoType}</strong> require verifying these checklist documents.
                            </p>
                          </div>
                          <div className="space-y-2">
                            {msg.data.checklist.map((item) => (
                              <div key={item.id} className="flex justify-between items-center p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
                                <div>
                                  <span className="text-xs font-semibold text-white block">{item.document_type}</span>
                                  <span className="text-[9px] text-slate-500 mt-0.5 block font-mono">
                                    {item.status === 'Verified' ? `Verified by ${item.verified_by}` : 'Awaiting confirmation'}
                                  </span>
                                </div>
                                {item.status === 'Verified' ? (
                                  <span className="text-[10px] font-bold text-green-500 flex items-center gap-0.5 select-none">
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

                      {msg.type === 'route_options' && msg.data && (
                        <div className="mt-4 space-y-3">
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

                      {msg.type === 'cleaner_result' && msg.data && (
                        <div className="mt-4">
                          <pre className="bg-slate-900 border border-slate-800 text-[10px] font-mono px-3 py-2.5 rounded-xl text-green-400 overflow-x-auto select-all">
                            {msg.data}
                          </pre>
                        </div>
                      )}

                      {msg.type === 'claim_result' && msg.data && (
                        <div className="mt-4 bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                          <div className="flex justify-between items-center border-b border-slate-850 pb-2 mb-2 text-xs">
                            <span className="font-mono text-blue-400 font-bold">{msg.data.claim_id}</span>
                            <span className="text-[9px] bg-slate-850 text-slate-400 px-2 py-0.5 rounded uppercase">Submitted</span>
                          </div>
                          <div className="text-xs space-y-1.5">
                            <p className="text-slate-400 font-medium">Cargo ID: <strong className="text-white font-semibold">{msg.data.cargo_ref}</strong></p>
                            <p className="text-slate-400 font-medium">Amount: <strong className="text-white font-semibold">{msg.data.amount} AED</strong></p>
                            <p className="text-slate-400 font-medium">Details: <strong className="text-white font-semibold block italic text-[11px] mt-0.5">"{msg.data.description}"</strong></p>
                          </div>
                        </div>
                      )}

                      {msg.type === 'complaint_result' && msg.data && (
                        <div className="mt-4 bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                          <div className="flex justify-between items-center border-b border-slate-850 pb-2 mb-2 text-xs">
                            <span className="font-mono text-blue-400 font-bold">{msg.data.complaint_id}</span>
                            <span className="text-[9px] bg-red-950 text-red-400 border border-red-900/30 px-2 py-0.5 rounded uppercase font-semibold">Open</span>
                          </div>
                          <div className="text-xs space-y-1.5">
                            <p className="text-slate-400 font-medium">Customer: <strong className="text-white font-semibold">{msg.data.customer_name}</strong></p>
                            <p className="text-slate-400 font-medium">Subject: <strong className="text-white font-semibold">{msg.data.subject}</strong></p>
                            <p className="text-slate-400 font-medium">Details: <strong className="text-white font-semibold block italic text-[11px] mt-0.5">"{msg.data.description}"</strong></p>
                          </div>
                        </div>
                      )}

                    </div>
                    <span className={`text-[9px] text-slate-500 font-mono block pl-1 ${!isBot && 'text-right pr-1'}`}>
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
          <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-850 z-10 select-none">
            <div className="flex gap-2 overflow-x-auto py-1 scrollbar-none">
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
            </div>
          </div>

          {/* Chat Input form */}
          <div className="bg-slate-950 px-6 py-4 border-t border-slate-850 z-10">
            <form onSubmit={handleUserMessageSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder='Type a command (e.g. "insights" or "quote") or select a form chip above...'
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
