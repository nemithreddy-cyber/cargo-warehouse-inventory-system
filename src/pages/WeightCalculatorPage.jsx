import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdCalculate, MdDelete, MdAdd, MdRemoveCircle,
  MdSave, MdHistory, MdInfo, MdCompareArrows
} from 'react-icons/md';
import api from '../utils/api';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import { SkeletonTable } from '../components/SkeletonLoader';

export default function WeightCalculatorPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Form inputs
  const [cargoId, setCargoId] = useState('');
  const [description, setDescription] = useState('');
  const [pieces, setPieces] = useState(1);
  const [actualWeightPerPiece, setActualWeightPerPiece] = useState('');
  const [ratePerKg, setRatePerKg] = useState('12.50');

  // Dynamic dimension rows (Length, Width, Height per piece group)
  const [dimensionRows, setDimensionRows] = useState([
    { id: Date.now(), length: '', width: '', height: '', qty: 1 }
  ]);

  // Results
  const [calculated, setCalculated] = useState(false);
  const [results, setResults] = useState({
    totalPieces: 0,
    totalActualWeight: 0,
    totalVolumetricWeight: 0,
    chargeableWeight: 0,
    freightCost: 0
  });

  const { toasts, success, error: toastError, removeToast } = useToast();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/weight/history');
      setHistory(res.data.history || []);
    } catch (err) {
      console.error(err);
      toastError('Failed to fetch calculation history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleAddRow = () => {
    setDimensionRows([
      ...dimensionRows,
      { id: Date.now(), length: '', width: '', height: '', qty: 1 }
    ]);
  };

  const handleRemoveRow = (id) => {
    if (dimensionRows.length === 1) return;
    setDimensionRows(dimensionRows.filter(row => row.id !== id));
  };

  const handleRowChange = (id, field, value) => {
    setDimensionRows(
      dimensionRows.map(row => {
        if (row.id === id) {
          return { ...row, [field]: value };
        }
        return row;
      })
    );
  };

  // Auto-calculate Total Actual Weight
  const parsedPieces = parseInt(pieces, 10) || 0;
  const parsedActualWeight = parseFloat(actualWeightPerPiece) || 0;
  const totalActualWeight = parsedPieces * parsedActualWeight;

  const handleCalculate = (e) => {
    e.preventDefault();
    if (!description) {
      toastError('Please enter a cargo description');
      return;
    }

    // Calculate total volumetric weight
    let totalVol = 0;
    let totalQty = 0;
    
    for (const row of dimensionRows) {
      const l = parseFloat(row.length) || 0;
      const w = parseFloat(row.width) || 0;
      const h = parseFloat(row.height) || 0;
      const q = parseInt(row.qty, 10) || 0;
      
      totalQty += q;
      totalVol += (l * w * h * q) / 6000;
    }

    const volumetricWeight = parseFloat(totalVol.toFixed(2));
    const chargeable = parseFloat(Math.max(totalActualWeight, volumetricWeight).toFixed(2));
    const rate = parseFloat(ratePerKg) || 0;
    const cost = parseFloat((chargeable * rate).toFixed(2));

    setResults({
      totalPieces: totalQty || parsedPieces,
      totalActualWeight: parseFloat(totalActualWeight.toFixed(2)),
      totalVolumetricWeight: volumetricWeight,
      chargeableWeight: chargeable,
      freightCost: cost
    });
    setCalculated(true);
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      // Save primary row dimensions or avg dimensions for DB storage
      const firstRow = dimensionRows[0] || {};
      const payload = {
        cargo_id: cargoId || null,
        description,
        pieces: results.totalPieces,
        actual_weight: results.totalActualWeight,
        volumetric_weight: results.totalVolumetricWeight,
        chargeable_weight: results.chargeableWeight,
        length_cm: parseFloat(firstRow.length) || 0,
        width_cm: parseFloat(firstRow.width) || 0,
        height_cm: parseFloat(firstRow.height) || 0,
        rate_per_kg: parseFloat(ratePerKg) || 0,
        freight_cost: results.freightCost
      };

      await api.post('/weight/calculate', payload);
      success('Calculation saved successfully!');
      fetchHistory();
    } catch (err) {
      console.error(err);
      toastError('Failed to save calculation');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this calculation?')) return;
    try {
      await api.delete(`/weight/delete/${id}`);
      success('Record deleted');
      fetchHistory();
    } catch (err) {
      console.error(err);
      toastError('Failed to delete calculation');
    }
  };

  // Compare winner formatting
  const volumetricWins = results.totalVolumetricWeight > results.totalActualWeight;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Chargeable Weight Calculator</h2>
        <p className="text-sm text-slate-500">Calculate actual vs volumetric weight for air cargo billing</p>
      </div>

      {/* Two Column Calculator + Results */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Enter Details Card */}
        <div className="w-full lg:w-1/2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <MdCalculate className="text-amber-500 text-lg" />
              Enter Cargo Details
            </h3>
          </div>
          <form onSubmit={handleCalculate} className="p-6 space-y-4 flex-1">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo ID (Optional)</label>
                <input
                  type="text"
                  value={cargoId}
                  onChange={(e) => setCargoId(e.target.value)}
                  placeholder="e.g. CRG-20260001"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo Description <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Medical Supplies, Books"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Pieces</label>
                <input
                  type="number"
                  min="1"
                  value={pieces}
                  onChange={(e) => setPieces(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Actual Weight per piece (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={actualWeightPerPiece}
                  onChange={(e) => setActualWeightPerPiece(e.target.value)}
                  placeholder="20"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Actual Weight (kg)</label>
                <input
                  type="text"
                  readOnly
                  value={totalActualWeight ? totalActualWeight.toFixed(2) + ' kg' : '0.00 kg'}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs text-slate-500 outline-none font-semibold"
                />
              </div>
            </div>

            {/* Dynamic Dimension Rows */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Dimensions (per piece group)</span>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700"
                >
                  <MdAdd /> Add Piece Type
                </button>
              </div>

              <div className="space-y-3">
                {dimensionRows.map((row, idx) => (
                  <div key={row.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="grid grid-cols-4 gap-2 flex-1">
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Length (cm)</label>
                        <input
                          type="number"
                          placeholder="L"
                          required
                          value={row.length}
                          onChange={(e) => handleRowChange(row.id, 'length', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Width (cm)</label>
                        <input
                          type="number"
                          placeholder="W"
                          required
                          value={row.width}
                          onChange={(e) => handleRowChange(row.id, 'width', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Height (cm)</label>
                        <input
                          type="number"
                          placeholder="H"
                          required
                          value={row.height}
                          onChange={(e) => handleRowChange(row.id, 'height', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Qty</label>
                        <input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          required
                          value={row.qty}
                          onChange={(e) => handleRowChange(row.id, 'qty', parseInt(e.target.value, 10) || 1)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 text-center font-bold"
                        />
                      </div>
                    </div>

                    {dimensionRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.id)}
                        className="text-red-500 hover:text-red-700 text-lg mt-4 flex-shrink-0"
                      >
                        <MdRemoveCircle />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.97] transition-all duration-150 text-white font-bold py-2.5 rounded-xl text-xs mt-4"
            >
              Calculate Weight
            </button>
          </form>
        </div>

        {/* Results Card */}
        <div className="w-full lg:w-1/2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <MdCompareArrows className="text-blue-500 text-lg" />
              Calculation Results
            </h3>
          </div>
          
          {!calculated ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 text-3xl mb-4">
                <MdCalculate />
              </div>
              <h4 className="font-semibold text-slate-700 mb-1">Calculation Pending</h4>
              <p className="text-xs text-slate-500 max-w-xs">Enter cargo particulars and dynamic dimensions to evaluate the billing parameters.</p>
            </div>
          ) : (
            <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
              
              <div className="space-y-4">
                {/* Statistics breakdown */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Total Pieces</span>
                    <span className="font-bold text-slate-800 text-base">{results.totalPieces}</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Rate per kg</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-slate-500 text-xs font-bold">AED</span>
                      <input
                        type="number"
                        step="0.01"
                        value={ratePerKg}
                        onChange={(e) => setRatePerKg(e.target.value)}
                        className="w-20 px-2 py-0.5 border border-slate-200 rounded-md text-xs font-bold outline-none text-slate-800 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Compare values */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">Total Actual Weight:</span>
                    <span className="text-xs font-bold text-slate-800">{results.totalActualWeight} kg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">Volumetric Weight:</span>
                    <span className="text-xs font-bold text-slate-800">{results.totalVolumetricWeight} kg</span>
                  </div>
                  <div className="text-[10px] text-slate-400 italic">
                    Formula: (L × W × H × qty) / 6000 per piece group
                  </div>

                  {/* Visual Chart indicator */}
                  <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {/* Actual weight bar */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                        <span>ACTUAL WEIGHT</span>
                        <span>{results.totalActualWeight} kg</span>
                      </div>
                      <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, (results.totalActualWeight / (results.chargeableWeight || 1)) * 100)}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${!volumetricWins ? 'bg-amber-500' : 'bg-slate-400'}`}
                        />
                      </div>
                    </div>

                    {/* Volumetric weight bar */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                        <span>VOLUMETRIC WEIGHT</span>
                        <span>{results.totalVolumetricWeight} kg</span>
                      </div>
                      <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, (results.totalVolumetricWeight / (results.chargeableWeight || 1)) * 100)}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${volumetricWins ? 'bg-blue-650' : 'bg-slate-400'}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chargeable weight and cost results */}
                <div className="p-4 rounded-2xl flex items-center justify-between shadow-sm border border-slate-100 bg-slate-50">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Chargeable Weight</span>
                    <span className={`text-xl font-black ${volumetricWins ? 'text-blue-650' : 'text-amber-600'}`}>
                      {results.chargeableWeight} kg
                    </span>
                    <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 bg-white border rounded-full text-slate-500 shadow-sm">
                      {volumetricWins ? 'Volumetric Wins' : 'Actual Weight Wins'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Est. Freight Cost</span>
                    <span className="text-xl font-black text-slate-800">
                      AED {(results.chargeableWeight * (parseFloat(ratePerKg) || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saveLoading}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 active:scale-[0.97] transition-all duration-150 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <MdSave className="text-base" />
                  {saveLoading ? 'Saving...' : 'Save Calculation'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <MdHistory className="text-amber-500 text-lg" />
            Calculation History
          </h3>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6">
              <SkeletonTable rows={4} />
            </div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 text-3xl mb-4">
                <MdHistory />
              </div>
              <h4 className="font-semibold text-slate-700 mb-1">No Saved Calculations</h4>
              <p className="text-xs text-slate-500 max-w-xs">There are no calculation records stored in database history yet.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Cargo ID</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-center">Pieces</th>
                  <th className="px-6 py-4 text-center">Gross Wt</th>
                  <th className="px-6 py-4 text-center">Volumetric Wt</th>
                  <th className="px-6 py-4 text-center">Chargeable Wt</th>
                  <th className="px-6 py-4 text-right">Est. Cost</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs text-slate-700 font-medium">
                {history.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-500">{new Date(row.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-semibold text-slate-500">{row.cargo_id || 'N/A'}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{row.description}</td>
                    <td className="px-6 py-4 text-center">{row.pieces}</td>
                    <td className="px-6 py-4 text-center">{row.actual_weight} kg</td>
                    <td className="px-6 py-4 text-center">{row.volumetric_weight} kg</td>
                    <td className="px-6 py-4 text-center font-bold text-blue-650">{row.chargeable_weight} kg</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">AED {row.freight_cost}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDelete(row.id)}
                        title="Delete calculation"
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors active:scale-[0.9]"
                      >
                        <MdDelete className="text-base" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
