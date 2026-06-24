'use strict';

const { sendWhatsAppMessage } = require('./whatsappService');
const { sendEmailMessage } = require('./emailService');
const { createLog } = require('./messageLogService');

/**
 * Triggered automatically when cargo status becomes "Received" or "Stored".
 */
const handleCargoReceived = async (cargo) => {
  const cargoId = cargo.cargo_id;
  const customerName = cargo.customer_name;
  const phoneNumber = cargo.customer_phone;
  const zoneName = cargo.zone_name || 'Warehouse storage';
  const derivedEmail = `${customerName.toLowerCase().replace(/[^a-z0-9]/g, '')}@cargo-client.com`;

  // WhatsApp Message disabled (Email only)

  // Email Message
  const emailSubject = 'Cargo Received Successfully';
  const emailMsg = `Your cargo has been received and stored in the warehouse.`;
  try {
    const emailRes = await sendEmailMessage(derivedEmail, emailSubject, emailMsg);
    await createLog({
      recipient_name: customerName,
      email: derivedEmail,
      channel: 'email',
      message: `Subject: ${emailSubject}\n\n${emailMsg}`,
      status: emailRes.simulated ? 'Delivered' : 'Sent',
      cargo_id: cargoId
    });
  } catch (err) {
    await createLog({
      recipient_name: customerName,
      email: derivedEmail,
      channel: 'email',
      message: `Subject: ${emailSubject}\n\n${emailMsg}`,
      status: 'Failed',
      cargo_id: cargoId,
      error_message: err.message
    });
  }
};

/**
 * Triggered automatically when a cargo is dispatched (via dispatch record creation).
 */
const handleCargoDispatched = async (dispatchRecord, cargo) => {
  const cargoId = cargo.cargo_id;
  const customerName = cargo.customer_name;
  const phoneNumber = cargo.customer_phone;
  const deliveryDate = dispatchRecord.expected_delivery ? dispatchRecord.expected_delivery.split('T')[0] : 'soon';
  const driverName = dispatchRecord.driver_name;
  const derivedEmail = `${customerName.toLowerCase().replace(/[^a-z0-9]/g, '')}@cargo-client.com`;

  // WhatsApp Message disabled (Email only)

  // Email Message
  const emailSubject = 'Cargo Dispatch Notification';
  const emailMsg = `Your shipment is on its way.`;
  try {
    const emailRes = await sendEmailMessage(derivedEmail, emailSubject, emailMsg);
    await createLog({
      recipient_name: customerName,
      email: derivedEmail,
      channel: 'email',
      message: `Subject: ${emailSubject}\n\n${emailMsg}`,
      status: emailRes.simulated ? 'Delivered' : 'Sent',
      cargo_id: cargoId
    });
  } catch (err) {
    await createLog({
      recipient_name: customerName,
      email: derivedEmail,
      channel: 'email',
      message: `Subject: ${emailSubject}\n\n${emailMsg}`,
      status: 'Failed',
      cargo_id: cargoId,
      error_message: err.message
    });
  }
};

/**
 * Triggered automatically when an invoice is generated.
 */
const handleInvoiceGenerated = async (invoice, cargo) => {
  const cargoId = cargo ? cargo.cargo_id : invoice.cargo_id;
  const customerName = invoice.customer_name;
  const derivedEmail = `${customerName.toLowerCase().replace(/[^a-z0-9]/g, '')}@cargo-client.com`;
  const amount = invoice.total || invoice.amount;
  const dueDate = invoice.due_date ? invoice.due_date.split('T')[0] : 'soon';

  const emailSubject = 'Invoice Generated';
  const emailMsg = `Invoice Number: ${invoice.invoice_number}\nAmount Due: ${amount} AED\nDue Date: ${dueDate}`;

  try {
    const emailRes = await sendEmailMessage(derivedEmail, emailSubject, emailMsg);
    await createLog({
      recipient_name: customerName,
      email: derivedEmail,
      channel: 'email',
      message: `Subject: ${emailSubject}\n\n${emailMsg}`,
      status: emailRes.simulated ? 'Delivered' : 'Sent',
      cargo_id: cargoId
    });
  } catch (err) {
    await createLog({
      recipient_name: customerName,
      email: derivedEmail,
      channel: 'email',
      message: `Subject: ${emailSubject}\n\n${emailMsg}`,
      status: 'Failed',
      cargo_id: cargoId,
      error_message: err.message
    });
  }
};

module.exports = {
  handleCargoReceived,
  handleCargoDispatched,
  handleInvoiceGenerated
};
