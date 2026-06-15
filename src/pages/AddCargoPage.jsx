import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdSave, MdArrowBack, MdCheckCircle } from 'react-icons/md';
import ToastContainer from '../components/ToastContainer';
import { cargoTypeOptions, airportOptions, zoneOptions, statusOptions } from '../data/dummyData';
import { useToast } from '../hooks/useToast';

const initialForm = {
  customerName: '', customerPhone: '', cargoType: '', originAirport: '',
  destinationAirport: '', pickupCity: '', packageCount: '', weight: '',
  length: '', width: '', height: '', chargeableWeight: '', storageLocation: '',
  warehouseZone: '', arrivalDate: '', status: 'Received',
};

const Field = ({ label, required, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const inputClass = (hasError) =>
  `w-full px-3 py-2.5 rounded-xl border text-sm text-slate-700 outline-none transition-all duration-200 ${
    hasError
      ? 'border-red-300 focus:border-red-500 bg-red-50'
      : 'border-slate-200 focus:border-blue-500 bg-white'
  }`;

export default function AddCargoPage() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toasts, success, error: toastError, removeToast } = useToast();
  const navigate = useNavigate();

  const actualWeight = parseFloat(form.weight) || 0;
  const length = parseFloat(form.length) || 0;
  const width = parseFloat(form.width) || 0;
  const height = parseFloat(form.height) || 0;
  const chargeableWeight = (length * width * height) / 6000;
  const billingWeight = Math.max(actualWeight, chargeableWeight);

  const set = (key) => (e) => {
    setForm((prev) => {
      const nextForm = { ...prev, [key]: e.target.value };
      if (errors[key]) setErrors((prevErrs) => ({ ...prevErrs, [key]: '' }));

      // Auto-calculate chargeable weight
      if (['length', 'width', 'height', 'weight'].includes(key)) {
        const l = parseFloat(key === 'length' ? e.target.value : nextForm.length) || 0;
        const w = parseFloat(key === 'width' ? e.target.value : nextForm.width) || 0;
        const h = parseFloat(key === 'height' ? e.target.value : nextForm.height) || 0;
        const chargeable = ((l * w * h) / 6000).toFixed(2);
        nextForm.chargeableWeight = chargeable;
      }
      return nextForm;
    });
  };

  const validate = () => {
    const req = { customerName: 'Customer name is required', customerPhone: 'Phone is required',
      cargoType: 'Cargo type is required', originAirport: 'Origin airport is required',
      destinationAirport: 'Destination is required', pickupCity: 'Pickup city is required',
      packageCount: 'Package count is required', weight: 'Weight is required',
      storageLocation: 'Storage location is required', warehouseZone: 'Zone is required',
      arrivalDate: 'Arrival date is required' };
    const errs = {};
    Object.entries(req).forEach(([k, msg]) => { if (!form[k]) errs[k] = msg; });
    if (form.packageCount && isNaN(Number(form.packageCount))) errs.packageCount = 'Must be a number';
    if (form.weight && isNaN(Number(form.weight))) errs.weight = 'Must be a number';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); toastError('Please fix the errors below.'); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
    success('Cargo added successfully! Redirecting...');
    setTimeout(() => navigate('/cargo'), 2000);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <MdCheckCircle className="text-5xl text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Cargo Added Successfully!</h3>
        <p className="text-slate-500 text-sm">Redirecting to cargo list...</p>
      </div>
    );
  }

  const Section = ({ title, children }) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <h3 className="font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{children}</div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Add New Cargo</h2>
          <p className="text-slate-500 text-sm">Fill in the cargo details below</p>
        </div>
        <button onClick={() => navigate('/cargo')} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm transition-colors">
          <MdArrowBack /> Back to List
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Section title="📋 Customer Information">
          <Field label="Customer Name" required error={errors.customerName}>
            <input className={inputClass(errors.customerName)} value={form.customerName} onChange={set('customerName')} placeholder="e.g. Emirates Logistics LLC" />
          </Field>
          <Field label="Customer Phone" required error={errors.customerPhone}>
            <input className={inputClass(errors.customerPhone)} value={form.customerPhone} onChange={set('customerPhone')} placeholder="+971 4 234 5678" />
          </Field>
          <Field label="Cargo Type" required error={errors.cargoType}>
            <select className={inputClass(errors.cargoType)} value={form.cargoType} onChange={set('cargoType')}>
              <option value="">Select type...</option>
              {cargoTypeOptions.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
        </Section>

        <Section title="✈️ Flight & Route Information">
          <Field label="Origin Airport" required error={errors.originAirport}>
            <select className={inputClass(errors.originAirport)} value={form.originAirport} onChange={set('originAirport')}>
              <option value="">Select origin...</option>
              {airportOptions.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Destination Airport" required error={errors.destinationAirport}>
            <select className={inputClass(errors.destinationAirport)} value={form.destinationAirport} onChange={set('destinationAirport')}>
              <option value="">Select destination...</option>
              {airportOptions.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Pickup City" required error={errors.pickupCity}>
            <input className={inputClass(errors.pickupCity)} value={form.pickupCity} onChange={set('pickupCity')} placeholder="e.g. Dubai" />
          </Field>
          <Field label="Arrival Date" required error={errors.arrivalDate}>
            <input type="date" className={inputClass(errors.arrivalDate)} value={form.arrivalDate} onChange={set('arrivalDate')} />
          </Field>
          <Field label="Status" required>
            <select className={inputClass(false)} value={form.status} onChange={set('status')}>
              {statusOptions.filter(s => s !== 'All').map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
        </Section>

        <Section title="📦 Package & Weight Details">
          <Field label="Package Count" required error={errors.packageCount}>
            <input type="number" min="1" className={inputClass(errors.packageCount)} value={form.packageCount} onChange={set('packageCount')} placeholder="e.g. 12" />
          </Field>
          <Field label="Weight (kg)" required error={errors.weight}>
            <input type="number" step="0.1" min="0" className={inputClass(errors.weight)} value={form.weight} onChange={set('weight')} placeholder="e.g. 450.5" />
          </Field>
          <Field label="Length (cm)">
            <input type="number" step="0.1" min="0" className={inputClass(false)} value={form.length} onChange={set('length')} placeholder="e.g. 120" />
          </Field>
          <Field label="Width (cm)">
            <input type="number" step="0.1" min="0" className={inputClass(false)} value={form.width} onChange={set('width')} placeholder="e.g. 80" />
          </Field>
          <Field label="Height (cm)">
            <input type="number" step="0.1" min="0" className={inputClass(false)} value={form.height} onChange={set('height')} placeholder="e.g. 60" />
          </Field>
          <Field label="Chargeable Weight (kg)">
            <input type="number" step="0.01" className={`${inputClass(false)} bg-slate-50 text-slate-500`} value={form.chargeableWeight} readOnly placeholder="Auto-calculated" />
          </Field>

          {/* Dynamic Billing Weight Calculator Summary */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 mt-2">
            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span>⚖️ Chargeable Weight Calculator Summary</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100/50">
                <p className="text-xs text-slate-400 font-medium">Actual Weight</p>
                <p className="text-lg font-bold text-slate-800 mt-1">{actualWeight.toFixed(1)} kg</p>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100/50">
                <p className="text-xs text-slate-400 font-medium">Chargeable Weight (Volumetric)</p>
                <p className="text-lg font-bold text-slate-800 mt-1">{chargeableWeight.toFixed(2)} kg</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">(L × W × H) / 6000</p>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-blue-200 bg-blue-50/20">
                <p className="text-xs text-blue-600 font-semibold">Final Billing Weight</p>
                <p className="text-xl font-extrabold text-blue-800 mt-1">{billingWeight.toFixed(2)} kg</p>
              </div>
            </div>
            <div className="mt-3.5 pt-3.5 border-t border-blue-100/50 flex items-center justify-between text-xs font-medium text-slate-600">
              <span>Rule Selection:</span>
              <span className="text-blue-700 bg-blue-100/60 px-2.5 py-1 rounded-full font-bold">
                {chargeableWeight > actualWeight 
                  ? `Volumetric Weight is larger (Billing Weight = Chargeable Weight)` 
                  : `Actual Weight is larger (Billing Weight = Actual Weight)`}
              </span>
            </div>
          </div>
        </Section>

        <Section title="🏭 Storage Information">
          <Field label="Warehouse Zone" required error={errors.warehouseZone}>
            <select className={inputClass(errors.warehouseZone)} value={form.warehouseZone} onChange={set('warehouseZone')}>
              <option value="">Select zone...</option>
              {zoneOptions.filter(z => z !== 'All').map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Storage Location" required error={errors.storageLocation}>
            <input className={inputClass(errors.storageLocation)} value={form.storageLocation} onChange={set('storageLocation')} placeholder="e.g. A-01" />
          </Field>
        </Section>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => setForm(initialForm)} className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
            Reset Form
          </button>
          <button
            id="submit-cargo-btn"
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-70"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Saving...</>
            ) : (
              <><MdSave /> Save Cargo</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
