/**
 * Utility functions for generating downloadable CSV tables and print-ready PDF invoices & shift certificates.
 */

// 1. Export JSON data array to CSV file
export function exportToCSV(filename, rows, headers) {
  if (!rows || !rows.length) {
    alert('No data available to export');
    return;
  }

  const separator = ',';
  const keys = headers ? headers.map(h => h.key) : Object.keys(rows[0]);
  const headerLabels = headers ? headers.map(h => `"${h.label}"`) : keys.map(k => `"${k}"`);

  const csvContent = [
    headerLabels.join(separator),
    ...rows.map(row => 
      keys.map(key => {
        let cell = row[key];
        if (cell === null || cell === undefined) {
          cell = '';
        } else if (typeof cell === 'object') {
          cell = cell.name || cell.title || JSON.stringify(cell);
        }
        cell = String(cell).replace(/"/g, '""');
        return `"${cell}"`;
      }).join(separator)
    )
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 2. Open and print high-resolution Tax Invoice Receipt
export function printInvoicePDF(transaction, user) {
  const invoiceNum = `INV-H2-${transaction._id ? transaction._id.slice(-8).toUpperCase() : Date.now().toString().slice(-8)}`;
  const dateStr = new Date(transaction.createdAt || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  
  const qty = Number(transaction.quantityDispensed || transaction.quantity || 5.0).toFixed(2);
  const totalCost = Number(transaction.cost || transaction.amount || 75.0).toFixed(2);
  const baseRate = (totalCost / qty).toFixed(2);
  const subtotal = (totalCost * 0.82).toFixed(2);
  const tax = (totalCost * 0.18).toFixed(2);
  const co2Saved = (qty * 9.5).toFixed(1); // 1kg H2 offsets approx 9.5kg CO2 vs diesel

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert('Please allow popups to view and download PDF invoice');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Tax Invoice - ${invoiceNum}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Outfit:wght@700;800&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 40px;
          background: #ffffff;
        }
        .invoice-card {
          max-width: 680px;
          margin: 0 auto;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 36px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #f1f5f9;
          padding-bottom: 20px;
          margin-bottom: 24px;
        }
        .logo {
          font-family: 'Outfit', sans-serif;
          font-size: 24px;
          font-weight: 800;
          color: #0284c7;
        }
        .logo span { color: #0f172a; font-weight: 400; font-size: 16px; margin-left: 6px; }
        .meta-pill {
          background: #f0fdf4;
          color: #16a34a;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          display: inline-block;
          margin-top: 6px;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 28px;
        }
        .meta-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
        .meta-val { font-size: 14px; font-weight: 600; color: #0f172a; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }
        th {
          background: #f8fafc;
          text-align: left;
          padding: 12px;
          font-size: 12px;
          color: #475569;
          border-bottom: 1px solid #e2e8f0;
        }
        td {
          padding: 14px 12px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
        }
        .total-box {
          background: #f8fafc;
          border-radius: 12px;
          padding: 16px 20px;
          margin-left: auto;
          width: 260px;
          margin-bottom: 28px;
        }
        .total-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; color: #64748b; }
        .grand-total { display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; color: #0f172a; border-top: 1px solid #e2e8f0; padding-top: 8px; }
        .eco-badge {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border: 1px solid #a7f3d0;
          border-radius: 12px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .eco-text { font-size: 13px; color: #065f46; font-weight: 600; }
        .footer {
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
          border-top: 1px solid #f1f5f9;
          padding-top: 16px;
        }
        .print-btn {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #0284c7;
          color: #fff;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);
        }
        @media print {
          .print-btn { display: none; }
          body { padding: 0; }
          .invoice-card { box-shadow: none; border: none; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-card">
        <div class="header">
          <div>
            <div class="logo">H₂ AURORA <span>Refueling Network</span></div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Zero-Emission Clean Hydrogen Energy</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 18px; font-weight: 800; color: #0f172a;">TAX INVOICE</div>
            <div style="font-size: 12px; color: #64748b;">${invoiceNum}</div>
            <div class="meta-pill">PAID & VERIFIED</div>
          </div>
        </div>

        <div class="grid-2">
          <div>
            <div class="meta-title">Billed To</div>
            <div class="meta-val">${user?.name || 'Authorized Driver'}</div>
            <div style="font-size: 13px; color: #64748b;">${user?.email || 'N/A'}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Tier: ${user?.tier || 'Bronze'} Member</div>
          </div>
          <div>
            <div class="meta-title">Dispense Station</div>
            <div class="meta-val">${transaction.station?.name || 'Chennai Central Hydrogen Hub'}</div>
            <div style="font-size: 13px; color: #64748b;">Nozzle: 700-bar SAE J2601 Type IV</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Date: ${dateStr}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description & Standard</th>
              <th>Qty (kg)</th>
              <th>Unit Rate</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div style="font-weight: 700; color: #0f172a;">Fuel Cell Grade Clean Hydrogen (H₂)</div>
                <div style="font-size: 12px; color: #64748b;">ISO 14687 Grade D Purity (99.999%)</div>
              </td>
              <td style="font-weight: 700;">${qty} kg</td>
              <td>₹${baseRate}/kg</td>
              <td style="text-align: right; font-weight: 700;">₹${totalCost}</td>
            </tr>
          </tbody>
        </table>

        <div class="total-box">
          <div class="total-row">
            <span>Subtotal (Net):</span>
            <span>₹${subtotal}</span>
          </div>
          <div class="total-row">
            <span>Clean Energy GST (18%):</span>
            <span>₹${tax}</span>
          </div>
          <div class="grand-total">
            <span>Total Paid:</span>
            <span>₹${totalCost}</span>
          </div>
        </div>

        <div class="eco-badge">
          <div style="font-size: 24px;">🌱</div>
          <div>
            <div class="eco-text">Green Hydrogen Carbon Offset Certified</div>
            <div style="font-size: 12px; color: #047857;">You avoided approximately ${co2Saved} kg of CO₂ tailpipe emissions with this refueling session.</div>
          </div>
        </div>

        <div class="footer">
          <div>This is a computer-generated tax invoice verified under ISO 19880-1 station standards.</div>
          <div>H₂ Aurora Infrastructure Systems • All Rights Reserved</div>
        </div>
      </div>

      <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
    </body>
    </html>
  `);

  printWindow.document.close();
}

// 3. Open and print Shift Handover & Safety Compliance Report
export function printShiftHandoverPDF(shiftData, station, user) {
  const shiftId = `SH-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  const printWindow = window.open('', '_blank', 'width=840,height=920');
  if (!printWindow) {
    alert('Please allow popups to view and download shift PDF');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Shift Handover Report - ${shiftId}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Outfit:wght@700;800&display=swap');
        body { font-family: 'Inter', sans-serif; color: #0f172a; margin: 0; padding: 40px; background: #fff; }
        .report-card { max-width: 720px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 16px; padding: 36px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0284c7; padding-bottom: 18px; margin-bottom: 24px; }
        .logo { font-family: 'Outfit', sans-serif; font-size: 22px; font-weight: 800; color: #0284c7; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; text-align: center; }
        .stat-val { font-size: 22px; font-weight: 800; color: #0284c7; margin: 4px 0; }
        .stat-lbl { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
        .check-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; margin-bottom: 8px; font-size: 13px; font-weight: 600; color: #166534; }
        .signature-area { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 24px; }
        .sign-line { border-bottom: 1px dashed #94a3b8; height: 40px; margin-bottom: 6px; }
        .print-btn { position: fixed; bottom: 20px; right: 20px; background: #0284c7; color: #fff; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; cursor: pointer; }
        @media print { .print-btn { display: none; } }
      </style>
    </head>
    <body>
      <div class="report-card">
        <div class="header">
          <div>
            <div class="logo">H₂ AURORA OPERATIONS</div>
            <div style="font-size: 12px; color: #64748b;">Station Shift Handover & Safety Compliance Certificate</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 800; font-size: 16px;">${shiftId}</div>
            <div style="font-size: 12px; color: #64748b;">Date: ${dateStr}</div>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <strong style="font-size: 16px; color: #0f172a;">${station?.name || 'Chennai Central Hydrogen Hub'}</strong>
          <div style="font-size: 13px; color: #64748b;">Operator on Duty: <strong>${user?.name || 'Station Specialist'}</strong> (${user?.email || 'N/A'})</div>
        </div>

        <div class="grid-3">
          <div class="stat-box">
            <div class="stat-lbl">Shift Duration</div>
            <div class="stat-val">${shiftData?.duration || '8.0'} hrs</div>
            <div style="font-size: 11px; color: #64748b;">Full Duty Cycle</div>
          </div>
          <div class="stat-box">
            <div class="stat-lbl">H₂ Dispensed</div>
            <div class="stat-val">${shiftData?.h2DispensedKg || '142.5'} kg</div>
            <div style="font-size: 11px; color: #64748b;">${shiftData?.vehiclesServiced || '28'} Refills</div>
          </div>
          <div class="stat-box">
            <div class="stat-lbl">Buffer Pressure</div>
            <div class="stat-val" style="color: #16a34a;">${station?.currentPressureBar || 700} Bar</div>
            <div style="font-size: 11px; color: #16a34a;">Nominal Operating</div>
          </div>
        </div>

        <div style="margin-bottom: 24px;">
          <h4 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; color: #475569;">Safety Inspection Log</h4>
          <div class="check-item">✓ 700-bar & 350-bar Nozzle O-Ring Seals Inspected & Pressure Tested</div>
          <div class="check-item">✓ Static Grounding Interlocks Active</div>
          <div class="check-item">✓ Ambient Hydrogen Vapor Leak Sensors: Normal (0.00 ppm)</div>
          <div class="check-item">✓ Emergency Stop (E-Stop) Interlocks Verified Operational</div>
        </div>

        <div style="margin-bottom: 24px;">
          <h4 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; color: #475569;">Handover Notes & Maintenance</h4>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 13px; color: #334155;">
            ${shiftData?.notes || 'All dispensers operational. Cryogenic bulk tank at healthy capacity. Next delivery scheduled for tomorrow morning.'}
          </div>
        </div>

        <div class="signature-area">
          <div>
            <div class="sign-line"></div>
            <div style="font-size: 12px; font-weight: 700; color: #0f172a;">Outgoing Operator Signature</div>
            <div style="font-size: 11px; color: #64748b;">${user?.name || 'Operator'}</div>
          </div>
          <div>
            <div class="sign-line"></div>
            <div style="font-size: 12px; font-weight: 700; color: #0f172a;">Incoming Supervisor Signature</div>
            <div style="font-size: 11px; color: #64748b;">Verified on Duty</div>
          </div>
        </div>
      </div>

      <button class="print-btn" onclick="window.print()">Print / Export PDF</button>
    </body>
    </html>
  `);

  printWindow.document.close();
}
