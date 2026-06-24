/**
 * Export Helpers
 * Utility functions for generating real CSV and PDF downloads from live data.
 */

// ─── CSV Helpers ─────────────────────────────────────────────────────────────

/**
 * Convert an array of objects to a CSV string.
 * Handles nested values gracefully.
 */
const objectsToCSV = (data, columns) => {
  if (!data || data.length === 0) return '';

  const headers = columns ? columns.map((c) => c.label) : Object.keys(data[0]);
  const keys    = columns ? columns.map((c) => c.key)   : Object.keys(data[0]);

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = data.map((row) =>
    keys.map((k) => escapeCell(row[k])).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
};

/**
 * Trigger a browser file download for a given CSV string.
 */
export const downloadCSV = (data, filename, columns) => {
  const csv = objectsToCSV(data, columns);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ─── Column definitions for each report type ──────────────────────────────────

export const CARGO_COLUMNS = [
  { key: 'cargo_id',             label: 'Cargo ID' },
  { key: 'customer_name',        label: 'Customer Name' },
  { key: 'customer_phone',       label: 'Phone' },
  { key: 'cargo_type',           label: 'Cargo Type' },
  { key: 'origin_airport',       label: 'Origin' },
  { key: 'destination_airport',  label: 'Destination' },
  { key: 'pickup_city',          label: 'Pickup City' },
  { key: 'package_count',        label: 'Packages' },
  { key: 'weight',               label: 'Weight (kg)' },
  { key: 'chargeable_weight',    label: 'Chargeable Weight (kg)' },
  { key: 'zone_name',            label: 'Zone' },
  { key: 'location_code',        label: 'Location' },
  { key: 'arrival_date',         label: 'Arrival Date' },
  { key: 'status',               label: 'Status' },
];

export const DISPATCH_COLUMNS = [
  { key: 'dispatch_id',     label: 'Dispatch ID' },
  { key: 'cargo_ref',       label: 'Cargo ID' },
  { key: 'customer_name',   label: 'Customer' },
  { key: 'destination_airport', label: 'Destination' },
  { key: 'driver_name',     label: 'Driver' },
  { key: 'vehicle_number',  label: 'Vehicle' },
  { key: 'dispatch_date',   label: 'Dispatch Date' },
  { key: 'expected_delivery', label: 'Est. Delivery' },
  { key: 'status',          label: 'Status' },
];

export const WAREHOUSE_COLUMNS = [
  { key: 'zone_name',   label: 'Zone' },
  { key: 'capacity',    label: 'Total Capacity' },
  { key: 'occupied',    label: 'Occupied' },
  { key: 'available',   label: 'Available' },
  { key: 'occupancy_pct', label: 'Occupancy %' },
];

// ─── PDF (Print) Helpers ─────────────────────────────────────────────────────

/**
 * Open a print-optimized window with a formatted report table.
 * Uses the browser's native print dialog — zero dependencies.
 */
export const printReport = (title, columns, data, extraInfo = '') => {
  const now = new Date().toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const theadHTML = columns.map((c) => `<th>${c.label}</th>`).join('');
  const tbodyHTML = data.map((row) =>
    `<tr>${columns.map((c) => {
      const val = row[c.key];
      return `<td>${val !== null && val !== undefined ? val : '—'}</td>`;
    }).join('')}</tr>`
  ).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title} — ORBEM Solutions Private Limited Company</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1e293b; padding: 24px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #f59e0b; padding-bottom: 12px; }
        .header h1 { font-size: 18px; font-weight: 700; color: #1e293b; }
        .header .sub { font-size: 11px; color: #64748b; margin-top: 3px; }
        .badge { background: #f59e0b; color: white; font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 20px; display: inline-block; margin-top: 4px; }
        .extra-info { margin-bottom: 14px; font-size: 11px; color: #475569; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1e293b; color: white; text-align: left; padding: 8px 10px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) td { background: #f8fafc; }
        .footer { margin-top: 16px; font-size: 10px; color: #94a3b8; text-align: center; }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>✈ ORBEM Solutions Private Limited Company</h1>
          <div class="sub">${title}</div>
          <div class="badge">ORBEM Solutions — Internship Project</div>
        </div>
        <div style="text-align:right; font-size:11px; color:#64748b;">
          <div>Generated: ${now}</div>
          <div>Total Records: ${data.length}</div>
        </div>
      </div>
      ${extraInfo ? `<div class="extra-info">${extraInfo}</div>` : ''}
      <table>
        <thead><tr>${theadHTML}</tr></thead>
        <tbody>${tbodyHTML}</tbody>
      </table>
      <div class="footer">ORBEM Solutions Private Limited Company — Confidential Report — Page 1</div>
    </body>
    </html>
  `;

  const win = window.open('', '_blank', 'width=1100,height=800');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
};

// ─── Warehouse report helper (adds computed columns) ─────────────────────────
export const prepareWarehouseReportData = (zones) =>
  zones.map((z) => ({
    zone_name:     z.zone_name,
    capacity:      z.capacity,
    occupied:      z.occupied,
    available:     z.capacity - z.occupied,
    occupancy_pct: z.capacity ? `${Math.round((z.occupied / z.capacity) * 100)}%` : '0%',
  }));
