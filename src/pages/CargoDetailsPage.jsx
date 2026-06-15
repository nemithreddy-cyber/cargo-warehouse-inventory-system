import { useParams, useNavigate } from 'react-router-dom';
import { MdArrowBack, MdEdit, MdLocalShipping, MdWarehouse, MdFlightLand, MdPhone, MdCalendarToday, MdHistory, MdPerson } from 'react-icons/md';
import { FaBoxes, FaRuler, FaWeight } from 'react-icons/fa';
import StatusBadge from '../components/StatusBadge';
import { cargoData, dispatchRecords, activityLogs } from '../data/dummyData';
import { formatDate, formatWeight } from '../utils/helpers';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="text-blue-500 text-sm" />
    </div>
    <div>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-sm text-slate-800 font-semibold mt-0.5">{value || '—'}</p>
    </div>
  </div>
);

export default function CargoDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const cargo = cargoData.find((c) => c.id === id);
  const dispatch = dispatchRecords.find((d) => d.cargoId === id);
  const relatedLogs = activityLogs.filter((log) => log.details.includes(id));

  if (!cargo) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <span className="text-6xl">📦</span>
        <h3 className="text-xl font-bold text-slate-700">Cargo Not Found</h3>
        <p className="text-slate-400 text-sm">The cargo ID "{id}" doesn't exist in the system.</p>
        <button onClick={() => navigate('/cargo')} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
          <MdArrowBack /> Back to Cargo List
        </button>
      </div>
    );
  }

  // Calculate dynamic timeline states
  const statuses = ['Received', 'Stored', 'Ready for Dispatch', 'Dispatched', 'Delivered'];
  const currentIdx = statuses.indexOf(cargo.status);
  
  const dynamicTimeline = [
    { 
      status: 'Received', 
      date: cargo.arrivalDate, 
      time: '09:15', 
      desc: 'Cargo received and scanned at warehouse intake', 
      done: currentIdx >= 0 
    },
    { 
      status: 'Stored', 
      date: cargo.arrivalDate, 
      time: '14:30', 
      desc: `Allocated to storage slot ${cargo.storageLocation} (${cargo.warehouseZone})`, 
      done: currentIdx >= 1 
    },
    { 
      status: 'Ready for Dispatch', 
      date: currentIdx >= 2 ? (cargo.dispatchDate || 'Pending scheduling') : null, 
      time: '10:00', 
      desc: 'Packaging verified and ready to be loaded', 
      done: currentIdx >= 2 
    },
    { 
      status: 'Dispatched', 
      date: cargo.dispatchDate, 
      time: '08:00', 
      desc: dispatch ? `Handed over to driver ${dispatch.driverName} on truck ${dispatch.vehicleNumber}` : 'Handed over to carrier dispatch team', 
      done: currentIdx >= 3 
    },
    { 
      status: 'Delivered', 
      date: cargo.deliveryDate, 
      time: '14:45', 
      desc: 'Delivered at final destination airport', 
      done: currentIdx >= 4 
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
            <MdArrowBack className="text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800">{cargo.id}</h2>
              <StatusBadge status={cargo.status} size="md" />
            </div>
            <p className="text-slate-500 text-sm">{cargo.customerName}</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/cargo/${cargo.id}/edit`)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
        >
          <MdEdit /> Edit Cargo
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle Column: Cargo Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-800">Customer Information</h3>
            </div>
            <div className="px-6 py-2">
              <InfoRow icon={MdPerson} label="Customer Name" value={cargo.customerName} />
              <InfoRow icon={MdPhone} label="Phone Number" value={cargo.customerPhone} />
              <InfoRow icon={FaBoxes} label="Cargo Type" value={cargo.cargoType} />
              <InfoRow icon={MdCalendarToday} label="Arrival Date" value={formatDate(cargo.arrivalDate)} />
            </div>
          </div>

          {/* Route Info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-800">Route Information</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between bg-blue-50/50 border border-blue-100/50 rounded-2xl p-5 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-800">{cargo.originAirport}</p>
                  <p className="text-xs text-slate-500 mt-1">Origin</p>
                  <p className="text-sm text-slate-600 font-semibold mt-0.5">{cargo.pickupCity}</p>
                </div>
                <div className="flex-1 flex items-center justify-center px-6">
                  <div className="flex items-center gap-2 w-full">
                    <div className="h-0.5 flex-1 bg-blue-200"></div>
                    <MdFlightLand className="text-blue-600 text-2xl" />
                    <div className="h-0.5 flex-1 bg-blue-200"></div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-800">{cargo.destinationAirport}</p>
                  <p className="text-xs text-slate-500 mt-1">Destination</p>
                </div>
              </div>
            </div>
          </div>

          {/* Package Details */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-800">Package & Weight Details</h3>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Package Count', value: `${cargo.packageCount} pkgs`, icon: FaBoxes, color: 'bg-blue-50 text-blue-600 border border-blue-100' },
                { label: 'Gross Weight', value: formatWeight(cargo.weight), icon: FaWeight, color: 'bg-purple-50 text-purple-600 border border-purple-100' },
                { label: 'Chargeable Wt.', value: formatWeight(cargo.chargeableWeight), icon: FaWeight, color: 'bg-amber-50 text-amber-600 border border-amber-100' },
                { label: 'Length', value: `${cargo.length || 0} cm`, icon: FaRuler, color: 'bg-slate-50 text-slate-600 border border-slate-200' },
                { label: 'Width', value: `${cargo.width || 0} cm`, icon: FaRuler, color: 'bg-slate-50 text-slate-600 border border-slate-200' },
                { label: 'Height', value: `${cargo.height || 0} cm`, icon: FaRuler, color: 'bg-slate-50 text-slate-600 border border-slate-200' },
              ].map((item) => (
                <div key={item.label} className={`rounded-xl p-4 flex flex-col gap-2 ${item.color}`}>
                  <item.icon className="text-xl" />
                  <p className="text-xs text-slate-500 font-medium">{item.label}</p>
                  <p className="text-lg font-bold text-slate-800">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Activity History */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Activity History</h3>
              <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-semibold">{relatedLogs.length} events</span>
            </div>
            {relatedLogs.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">
                No activity history records for this cargo.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">User</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Action</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Status Change</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {relatedLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 text-sm font-medium text-slate-700">{log.user}</td>
                        <td className="px-5 py-3 text-sm text-slate-600">{log.action}</td>
                        <td className="px-5 py-3">
                          {log.statusChange !== 'N/A' ? (
                            <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full border border-blue-100 font-semibold">{log.statusChange}</span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500">{log.date} {log.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Storage, Dispatch & Timeline */}
        <div className="space-y-6">
          {/* Storage Details */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-800">Storage Location</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-center shadow-md">
                <MdWarehouse className="text-4xl text-amber-400 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white font-mono">{cargo.storageLocation || 'N/A'}</p>
                <p className="text-blue-300 text-xs mt-1 uppercase tracking-wider font-semibold">{cargo.warehouseZone || 'No Zone Allocated'}</p>
              </div>
            </div>
          </div>

          {/* Dispatch Information */}
          {dispatch && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <MdLocalShipping className="text-orange-500 text-lg" />
                <h3 className="font-semibold text-slate-800">Dispatch Details</h3>
              </div>
              <div className="p-5 space-y-3">
                <div className="bg-orange-50/50 border border-orange-100/50 rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Dispatch ID</p>
                    <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">{dispatch.id}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Vehicle Number</p>
                      <p className="text-sm font-semibold text-slate-700 mt-0.5">{dispatch.vehicleNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Driver Name</p>
                      <p className="text-sm font-semibold text-slate-700 mt-0.5">{dispatch.driverName}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Est. Delivery Date</p>
                    <p className="text-sm font-semibold text-slate-700 mt-0.5">{formatDate(dispatch.estimatedDelivery)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Last Known Location</p>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5 italic">{dispatch.lastLocation || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status Timeline */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-800">Cargo Status Progression</h3>
            </div>
            <div className="p-6">
              <div className="relative pl-1">
                {dynamicTimeline.map((step, idx) => {
                  const isCurrent = step.status === cargo.status;
                  return (
                    <div key={step.status} className="flex gap-4 pb-6 last:pb-0 relative">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 z-10 border-2 transition-all ${
                          step.done 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}>
                          {step.done ? '✓' : idx + 1}
                        </div>
                        {idx < dynamicTimeline.length - 1 && (
                          <div className={`w-[2px] flex-1 mt-1 ${step.done ? 'bg-blue-500' : 'bg-slate-200'}`}></div>
                        )}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-bold ${step.done ? 'text-slate-800' : 'text-slate-400'}`}>
                            {step.status}
                          </p>
                          {isCurrent && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Current</span>
                          )}
                        </div>
                        <p className={`text-xs mt-1 ${step.done ? 'text-slate-500' : 'text-slate-300'}`}>{step.desc}</p>
                        {step.date && (
                          <p className="text-[10px] text-slate-400 font-medium font-mono mt-1">
                            {formatDate(step.date)} {step.done ? step.time : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
