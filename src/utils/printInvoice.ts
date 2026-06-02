export interface InvoiceData {
  billId: string;
  createdAt: string;
  patient: { name: string; patientId: string };
  items: { name: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  amountPaid: number;
  paymentMode: string;
  paymentStatus: string;
}

export function printInvoice(inv: InvoiceData) {
  const balance = Math.max(0, inv.totalAmount - inv.amountPaid);
  const rows = inv.items.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${item.name}</td>
      <td class="center">${item.quantity}</td>
      <td class="right">Rs. ${item.unitPrice.toFixed(2)}</td>
      <td class="right">Rs. ${item.total.toFixed(2)}</td>
    </tr>`).join('');

  const statusColor: Record<string, string> = {
    paid: '#059669', pending: '#d97706', partial: '#ea580c', refunded: '#dc2626',
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Invoice ${inv.billId}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; font-size: 13px; }
  .page { max-width: 720px; margin: 0 auto; padding: 32px; }

  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #3b82f6, #6366f1); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
  .brand-icon svg { width: 24px; height: 24px; }
  .brand-name { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
  .brand-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }
  .invoice-label { text-align: right; }
  .invoice-label h2 { font-size: 28px; font-weight: 800; color: #3b82f6; letter-spacing: 2px; }
  .invoice-label p { font-size: 12px; color: #64748b; margin-top: 4px; }

  /* Meta */
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; }
  .meta-box .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 6px; }
  .meta-box .value { font-size: 14px; font-weight: 600; color: #0f172a; }
  .meta-box .sub { font-size: 11px; color: #64748b; margin-top: 2px; }
  .status-badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; background: ${statusColor[inv.paymentStatus] ?? '#64748b'}20; color: ${statusColor[inv.paymentStatus] ?? '#64748b'}; border: 1px solid ${statusColor[inv.paymentStatus] ?? '#64748b'}40; text-transform: uppercase; letter-spacing: 0.05em; }

  /* Table */
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border-radius: 10px; overflow: hidden; }
  .items-table thead tr { background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; }
  .items-table thead th { padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
  .items-table thead th.center { text-align: center; }
  .items-table thead th.right { text-align: right; }
  .items-table tbody tr { border-bottom: 1px solid #f1f5f9; }
  .items-table tbody tr:last-child { border-bottom: none; }
  .items-table tbody tr:nth-child(even) { background: #f8fafc; }
  .items-table tbody td { padding: 10px 14px; color: #334155; }
  .items-table tbody td.center { text-align: center; }
  .items-table tbody td.right { text-align: right; font-variant-numeric: tabular-nums; }

  /* Totals */
  .totals { display: flex; justify-content: flex-end; margin-bottom: 24px; }
  .totals-box { width: 260px; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
  .totals-row { display: flex; justify-content: space-between; padding: 9px 14px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
  .totals-row:last-child { border-bottom: none; }
  .totals-row.discount { color: #dc2626; }
  .totals-row.grand { background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; font-size: 15px; font-weight: 800; }
  .totals-row.paid { color: #059669; font-weight: 600; }
  .totals-row.balance { color: ${balance > 0 ? '#dc2626' : '#059669'}; font-weight: 600; }

  /* Footer */
  .footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 20px; border-top: 1px solid #e2e8f0; margin-top: 8px; }
  .payment-info .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 4px; }
  .payment-info .value { font-size: 13px; font-weight: 600; color: #334155; text-transform: capitalize; }
  .thank-you { text-align: right; }
  .thank-you p { font-size: 15px; font-weight: 700; color: #3b82f6; }
  .thank-you span { font-size: 11px; color: #94a3b8; }
  .watermark { font-size: 10px; color: #cbd5e1; text-align: center; margin-top: 28px; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 16px; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="brand">
      <div class="brand-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
      <div>
        <div class="brand-name">HMS Hospital</div>
        <div class="brand-sub">Hospital Management System</div>
      </div>
    </div>
    <div class="invoice-label">
      <h2>INVOICE</h2>
      <p>${inv.billId}</p>
    </div>
  </div>

  <!-- Meta -->
  <div class="meta">
    <div class="meta-box">
      <div class="label">Bill To</div>
      <div class="value">${inv.patient.name}</div>
      <div class="sub">Patient ID: ${inv.patient.patientId}</div>
    </div>
    <div class="meta-box">
      <div class="label">Invoice Details</div>
      <div class="value">${new Date(inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
      <div class="sub" style="margin-top:6px"><span class="status-badge">${inv.paymentStatus}</span></div>
    </div>
  </div>

  <!-- Items -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:36px">#</th>
        <th>Description</th>
        <th class="center" style="width:60px">Qty</th>
        <th class="right" style="width:110px">Unit Price</th>
        <th class="right" style="width:110px">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span>Subtotal</span><span>Rs. ${inv.subtotal.toFixed(2)}</span></div>
      ${inv.discount > 0 ? `<div class="totals-row discount"><span>Discount</span><span>- Rs. ${inv.discount.toFixed(2)}</span></div>` : ''}
      ${inv.tax > 0 ? `<div class="totals-row"><span>Tax</span><span>+ Rs. ${inv.tax.toFixed(2)}</span></div>` : ''}
      <div class="totals-row grand"><span>Total</span><span>Rs. ${inv.totalAmount.toFixed(2)}</span></div>
      <div class="totals-row paid"><span>Amount Paid</span><span>Rs. ${inv.amountPaid.toFixed(2)}</span></div>
      <div class="totals-row balance"><span>Balance Due</span><span>Rs. ${balance.toFixed(2)}</span></div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="payment-info">
      <div class="label">Payment Mode</div>
      <div class="value">${inv.paymentMode}</div>
    </div>
    <div class="thank-you">
      <p>Thank you!</p>
      <span>We appreciate your trust in HMS Hospital</span>
    </div>
  </div>

  <div class="watermark">Generated by HMS Portal &bull; ${new Date().toLocaleString('en-IN')}</div>
</div>

<script>
  window.onload = function() { window.print(); };
<\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=800,height=700,scrollbars=yes');
  if (!win) { alert('Please allow popups to download the invoice.'); return; }
  win.document.write(html);
  win.document.close();
}
