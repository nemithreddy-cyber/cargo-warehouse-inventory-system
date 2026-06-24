const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// ─── Simulated Messages In-Memory Log ───────────────────────────────────────
const simulatedMessages = [
  {
    id: 1,
    type: 'WhatsApp',
    recipient: '+91-9876543210',
    recipient_name: 'Raj Enterprises',
    message: '✈️ Cargo System Update: Your cargo booking CRG-20260001 has been received and stored in Zone A - General Cargo (Slot A-01, Bin 01). Thank you!',
    status: 'Delivered',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString() // 1 day ago
  },
  {
    id: 2,
    type: 'Email',
    recipient: 'billing@globaltraders.com',
    recipient_name: 'Global Traders',
    message: 'Subject: Invoice INV-20260002 for Cargo CRG-20260002\n\nDear Customer,\nYour invoice INV-20260002 for cargo shipment CRG-20260002 has been generated. Total Amount Due: 67.20 AED. Due Date: 2026-07-15. Please remit payment at your earliest convenience.',
    status: 'Sent',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString() // 12 hours ago
  },
  {
    id: 3,
    type: 'WhatsApp',
    recipient: '+91-9988776655',
    recipient_name: 'Swift Logistics',
    message: '🚚 Dispatch Scheduled: Your cargo CRG-20260003 is scheduled for dispatch. Expected delivery date: 2026-06-13. Driver: Deepak Singh.',
    status: 'Delivered',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
  }
];

const messageLogService = require('../services/messageLogService');
const whatsappService = require('../services/whatsappService');
const emailService = require('../services/emailService');

// Helper to push simulated messages and trigger live sending if configured
const addSimulatedMessage = async (type, recipient, recipient_name, message) => {
  let status = 'Sent';
  let error_message = null;
  let subject = 'ORBEM Solutions Notification';
  let text = message;

  if (type === 'Email') {
    if (message.startsWith('Subject:')) {
      const lines = message.split('\n');
      subject = lines[0].replace('Subject:', '').trim();
      text = lines.slice(1).join('\n').trim();
    }
  }

  try {
    if (type === 'Email') {
      const res = await emailService.sendEmailMessage(recipient, subject, text);
      if (res.simulated) status = 'Delivered';
    } else {
      const res = await whatsappService.sendWhatsAppMessage(recipient, message);
      if (res.simulated) status = 'Delivered';
    }
  } catch (err) {
    status = 'Failed';
    error_message = err.message;
  }

  await messageLogService.createLog({
    recipient_name: recipient_name || 'Customer',
    phone_number: type === 'WhatsApp' ? recipient : null,
    email: type === 'Email' ? recipient : null,
    channel: type.toLowerCase(),
    message: type === 'Email' ? `Subject: ${subject}\n\n${text}` : message,
    status: status,
    error_message: error_message
  });
};

// ─── Quotations ──────────────────────────────────────────────────────────────
router.get('/quotations', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM quotations ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.post('/quotations', async (req, res, next) => {
  try {
    const { customer_name, weight, cargo_type, origin, destination, rate_per_kg, extra_charges } = req.body;
    const total_charge = (parseFloat(weight) * parseFloat(rate_per_kg)) + parseFloat(extra_charges || 0);
    const quote_id = `QT-${Date.now().toString().slice(-8)}`;

    await db.query(
      `INSERT INTO quotations (quote_id, customer_name, weight, cargo_type, origin, destination, rate_per_kg, extra_charges, total_charge, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [quote_id, customer_name, weight, cargo_type, origin, destination, rate_per_kg, extra_charges || 0, total_charge]
    );

    // Trigger Email/WhatsApp simulation
    addSimulatedMessage(
      'Email',
      `${customer_name.toLowerCase().replace(/\s+/g, '')}@cargo-client.com`,
      customer_name,
      `Subject: Air Cargo Quotation ${quote_id} generated\n\nDear Customer,\nWe have generated quotation ${quote_id} for your request (${weight}kg, ${cargo_type} from ${origin} to ${destination}). Total estimated cost: ${total_charge.toFixed(2)} AED.`
    );

    res.json({ success: true, message: 'Quotation generated successfully', data: { quote_id, total_charge } });
  } catch (err) {
    next(err);
  }
});

router.post('/quotations/approve/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE quotations SET status = "Approved" WHERE id = ?', [id]);
    res.json({ success: true, message: 'Quotation approved' });
  } catch (err) {
    next(err);
  }
});

// ─── Airway Bills ────────────────────────────────────────────────────────────
router.get('/airway-bills', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM airway_bills ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.post('/airway-bills', async (req, res, next) => {
  try {
    const { cargo_id, customer_name, origin, destination, weight } = req.body;
    const awb_number = `AWB-${Math.floor(10000000 + Math.random() * 90000000)}`;

    await db.query(
      `INSERT INTO airway_bills (awb_number, cargo_id, customer_name, origin, destination, weight, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Generated')`,
      [awb_number, cargo_id, customer_name, origin, destination, weight]
    );

    addSimulatedMessage(
      'WhatsApp',
      '+971-55-AWB-LOG',
      customer_name,
      `✈️ Airway Bill Generated: AWB ${awb_number} has been created for your cargo shipment from ${origin} to ${destination} (${weight}kg).`
    );

    res.json({ success: true, message: 'Airway Bill generated successfully', data: { awb_number } });
  } catch (err) {
    next(err);
  }
});

// ─── Invoices ────────────────────────────────────────────────────────────────
router.get('/invoices', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM invoices ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.post('/invoices', async (req, res, next) => {
  try {
    const { cargo_id, customer_name, amount, due_date } = req.body;
    const invoice_number = `INV-${Date.now().toString().slice(-8)}`;
    const tax = parseFloat(amount) * 0.05; // 5% VAT
    const total = parseFloat(amount) + tax;

    await db.query(
      `INSERT INTO invoices (invoice_number, cargo_id, customer_name, amount, tax, total, status, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Unpaid', ?)`,
      [invoice_number, cargo_id, customer_name, amount, tax, total, due_date]
    );

    addSimulatedMessage(
      'Email',
      `${customer_name.toLowerCase().replace(/\s+/g, '')}@cargo-billing.com`,
      customer_name,
      `Subject: Invoice ${invoice_number} generated\n\nDear Customer,\nYour invoice ${invoice_number} is ready. Total due: ${total.toFixed(2)} AED. Please pay by ${due_date}.`
    );

    res.json({ success: true, message: 'Invoice created successfully', data: { invoice_number, total } });
  } catch (err) {
    next(err);
  }
});

// ─── Payments ────────────────────────────────────────────────────────────────
router.get('/payments', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT p.*, i.invoice_number FROM payments p JOIN invoices i ON i.id = p.invoice_id ORDER BY p.id DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.post('/payments', async (req, res, next) => {
  try {
    const { invoice_id, amount, payment_method } = req.body;
    const transaction_id = `TXN-${Math.floor(1000000 + Math.random() * 9000000)}`;

    await db.query(
      `INSERT INTO payments (transaction_id, invoice_id, amount, payment_method, status)
       VALUES (?, ?, ?, ?, 'Success')`,
      [transaction_id, invoice_id, amount, payment_method]
    );

    // Update invoice status
    await db.query('UPDATE invoices SET status = "Paid" WHERE id = ?', [invoice_id]);

    const [[invoice]] = await db.query('SELECT customer_name, invoice_number FROM invoices WHERE id = ?', [invoice_id]);
    if (invoice) {
      addSimulatedMessage(
        'WhatsApp',
        '+971-55-PAY-RCV',
        invoice.customer_name,
        `💳 Payment Confirmed! We received ${amount} AED via ${payment_method} for Invoice ${invoice.invoice_number}. Transaction ID: ${transaction_id}.`
      );
    }

    res.json({ success: true, message: 'Payment processed successfully', data: { transaction_id } });
  } catch (err) {
    next(err);
  }
});

// ─── Complaints ──────────────────────────────────────────────────────────────
router.get('/complaints', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM complaints ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.post('/complaints', async (req, res, next) => {
  try {
    const { customer_name, subject, description } = req.body;
    const complaint_id = `COMP-${Date.now().toString().slice(-6)}`;

    await db.query(
      `INSERT INTO complaints (complaint_id, customer_name, subject, description, status)
       VALUES (?, ?, ?, ?, 'Open')`,
      [complaint_id, customer_name, subject, description]
    );

    addSimulatedMessage(
      'Email',
      'support@cargowarehouse.com',
      'Support Team Escalation',
      `Subject: Escalation — New Complaint ${complaint_id}\n\nCustomer ${customer_name} filed a complaint: ${subject}\nDescription: ${description}`
    );

    res.json({ success: true, message: 'Complaint registered successfully', data: { complaint_id } });
  } catch (err) {
    next(err);
  }
});

router.post('/complaints/resolve/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE complaints SET status = "Resolved" WHERE id = ?', [id]);
    res.json({ success: true, message: 'Complaint marked as resolved' });
  } catch (err) {
    next(err);
  }
});

// ─── Claims ──────────────────────────────────────────────────────────────────
router.get('/claims', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT cl.*, c.cargo_id AS cargo_ref FROM claims cl JOIN cargo c ON c.id = cl.cargo_id ORDER BY cl.id DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.post('/claims', async (req, res, next) => {
  try {
    const { cargo_id, amount, description, document_url } = req.body;
    const claim_id = `CLM-${Date.now().toString().slice(-6)}`;

    await db.query(
      `INSERT INTO claims (claim_id, cargo_id, amount, description, status, document_url)
       VALUES (?, ?, ?, ?, 'Submitted', ?)`,
      [claim_id, cargo_id, amount, description, document_url || null]
    );

    const [[cargoObj]] = await db.query('SELECT customer_name, cargo_id FROM cargo WHERE id = ?', [cargo_id]);
    if (cargoObj) {
      addSimulatedMessage(
        'Email',
        'claims@cargoinsurance.com',
        'Insurance Claim Agent',
        `Subject: Insurance Claim Submission ${claim_id}\n\nClaim submitted for cargo ${cargoObj.cargo_id} of ${cargoObj.customer_name}.\nAmount: ${amount} AED\nDetails: ${description}`
      );
    }

    res.json({ success: true, message: 'Claim submitted successfully', data: { claim_id } });
  } catch (err) {
    next(err);
  }
});

router.post('/claims/approve/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE claims SET status = "Approved" WHERE id = ?', [id]);
    res.json({ success: true, message: 'Claim approved' });
  } catch (err) {
    next(err);
  }
});

// ─── Partner Agents & Airline Rates ──────────────────────────────────────────
router.get('/partner-agents', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM partner_agents ORDER BY id ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.get('/airline-rates', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM airline_rates ORDER BY rate_per_kg ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// ─── Customs Checklists ──────────────────────────────────────────────────────
router.get('/customs-checklist/:cargoId', async (req, res, next) => {
  try {
    const { cargoId } = req.params;
    let [rows] = await db.query('SELECT * FROM customs_checklists WHERE cargo_id = ?', [cargoId]);

    // If empty checklist, pre-populate default checklist docs depending on cargo type
    if (rows.length === 0) {
      const [[cargo]] = await db.query('SELECT cargo_type, customer_name FROM cargo WHERE id = ?', [cargoId]);
      if (cargo) {
        const defaultDocs = ['Commercial Invoice', 'Packing List'];
        if (cargo.cargo_type === 'Chemicals') {
          defaultDocs.push('Material Safety Data Sheet (MSDS)');
          defaultDocs.push('Hazardous Goods Declaration');
        } else if (cargo.cargo_type === 'Pharmaceuticals') {
          defaultDocs.push('Phytosanitary Certificate');
          defaultDocs.push('Temperature Log Logsheet');
        } else {
          defaultDocs.push('Certificate of Origin');
        }

        for (const doc of defaultDocs) {
          await db.query(
            'INSERT INTO customs_checklists (cargo_id, document_type, status, verified_by) VALUES (?, ?, "Pending", NULL)',
            [cargoId, doc]
          );
        }
        [rows] = await db.query('SELECT * FROM customs_checklists WHERE cargo_id = ?', [cargoId]);
      }
    }
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.post('/customs-checklist/verify', async (req, res, next) => {
  try {
    const { id, verified_by } = req.body;
    await db.query(
      'UPDATE customs_checklists SET status = "Verified", verified_by = ? WHERE id = ?',
      [verified_by || 'Inspector', id]
    );
    res.json({ success: true, message: 'Document verified' });
  } catch (err) {
    next(err);
  }
});

// ─── Route Options ────────────────────────────────────────────────────────────
router.get('/route-options/:cargoId', async (req, res, next) => {
  try {
    const { cargoId } = req.params;
    let [rows] = await db.query('SELECT * FROM route_options WHERE cargo_id = ?', [cargoId]);

    if (rows.length === 0) {
      const [[cargo]] = await db.query('SELECT origin_airport, destination_airport FROM cargo WHERE id = ?', [cargoId]);
      if (cargo) {
        const routes = [
          `Direct Flight (${cargo.origin_airport} -> ${cargo.destination_airport}) — Eco Option`,
          `Express Route (${cargo.origin_airport} -> DXB Hub -> ${cargo.destination_airport}) — Fastest Option`
        ];
        const json = JSON.stringify(routes);
        await db.query(
          'INSERT INTO route_options (cargo_id, routes_json, selected_route) VALUES (?, ?, ?)',
          [cargoId, json, routes[0]]
        );
        [rows] = await db.query('SELECT * FROM route_options WHERE cargo_id = ?', [cargoId]);
      }
    }
    res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    next(err);
  }
});

router.post('/route-options/select', async (req, res, next) => {
  try {
    const { cargo_id, selected_route } = req.body;
    await db.query('UPDATE route_options SET selected_route = ? WHERE cargo_id = ?', [selected_route, cargo_id]);
    res.json({ success: true, message: 'Route option selected successfully' });
  } catch (err) {
    next(err);
  }
});

// ─── AI Description Cleaner ──────────────────────────────────────────────────
router.post('/clean-description', (req, res) => {
  const { description } = req.body;
  if (!description) {
    return res.status(400).json({ success: false, message: 'Description is required' });
  }

  // Standardize the text (AI Cleaning simulation)
  let clean = description.trim();
  // Remove multiple spaces/newlines
  clean = clean.replace(/\s+/g, ' ');
  // Title-case or standardize common words
  clean = clean.replace(/fragile/gi, 'FRAGILE');
  clean = clean.replace(/urgent/gi, 'URGENT');
  clean = clean.replace(/temp control/gi, 'TEMPERATURE-CONTROLLED');
  // Add a standard header
  clean = `[STANDARD MANIFEST LOG] - ${clean.toUpperCase()}`;

  res.json({ success: true, data: clean });
});

// ─── AI Shipment Insights ────────────────────────────────────────────────────
router.get('/insights', async (req, res, next) => {
  try {
    const [[cargoStats]] = await db.query('SELECT COUNT(*) AS total, SUM(weight) as total_weight FROM cargo');
    const [statusBreakdown] = await db.query('SELECT status, COUNT(*) AS cnt FROM cargo GROUP BY status');

    const totalWeightStr = cargoStats ? `${(parseFloat(cargoStats.total_weight || 0) / 1000).toFixed(1)} tons` : '0 tons';

    const insights = [
      `Overall volume: ${cargoStats?.total || 0} registered shipments managing ${totalWeightStr} in total weight.`,
      `Storage occupancy is within nominal ranges. Recommendation: Zone D - Hazmat has the highest remaining availability if hazmat placements arise.`
    ];

    res.json({
      success: true,
      data: {
        total_shipments: cargoStats?.total || 0,
        total_weight: cargoStats?.total_weight || 0,
        status_breakdown: statusBreakdown,
        insights
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─── Messaging Center Log ────────────────────────────────────────────────────
router.get('/messages-log', async (req, res, next) => {
  try {
    const logs = await messageLogService.getLogs({});
    const mapped = logs.map(log => ({
      id: log.id,
      type: log.channel === 'whatsapp' ? 'WhatsApp' : 'Email',
      recipient: log.channel === 'whatsapp' ? log.phone_number : log.email,
      recipient_name: log.recipient_name,
      message: log.message,
      status: log.status,
      timestamp: log.sent_at,
      error: log.error_message,
      cargo_id: log.cargo_id
    }));
    res.json({ success: true, data: mapped });
  } catch (err) {
    next(err);
  }
});

router.post('/send-message', async (req, res, next) => {
  try {
    const { type, recipient, recipient_name, message } = req.body;
    if (!type || !recipient || !message) {
      return res.status(400).json({ success: false, message: 'Type, recipient, and message are required' });
    }
    await addSimulatedMessage(type, recipient, recipient_name || 'Customer', message);
    res.json({ success: true, message: 'Alert processed and logged successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
