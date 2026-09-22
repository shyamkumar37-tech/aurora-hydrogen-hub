import React, { useRef, useState } from 'react';
import { Printer, Download, X, ShieldCheck, CheckCircle2, FileText, Building, Fuel, Loader2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function InvoiceModal({ isOpen, onClose, data }) {
  const invoiceRef = useRef(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  if (!isOpen || !data) return null;

  const invoiceNumber = data.invoiceNumber || `INV-H2-${Date.now().toString().slice(-6)}`;
  const date = data.date || new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const stationName = data.stationName || data.station?.name || 'Indiranagar 700-Bar Cryogenic Hub';
  const stationGstin = data.stationGstin || '29AABCA1234F1Z8';
  const amount = Number(data.amount) || Number(data.totalPrice) || 3500;
  const quantityKg = Number(data.quantityKg) || Number(data.quantity) || (amount / 700).toFixed(2);
  const ratePerKg = Number(data.ratePerKg) || 700;
  const paymentMethod = data.paymentMethod || data.source || 'Aurora Digital Wallet';
  const transactionId = data.transactionId || data.razorpayPaymentId || data.paymentId || `TXN-H2-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const customerName = data.customerName || data.user?.name || 'Fleet Operator / Driver';
  const vehicleNo = data.vehicleNo || data.vehicleNumber || 'KA-01-H2-2026';
  
  // Tax calculation (5% GST on Green Hydrogen in India / 2.5% CGST + 2.5% SGST)
  const taxableAmount = Math.round((amount / 1.05) * 100) / 100;
  const cgst = Math.round(((amount - taxableAmount) / 2) * 100) / 100;
  const sgst = cgst;

  const handlePrint = () => {
    window.print();
    toast.success('Tax invoice ready for download/printing');
  };

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return;
    try {
      setDownloadingPdf(true);
      toast.loading('Generating high-resolution PDF...', { id: 'pdf-toast' });
      
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Aurora_Invoice_${invoiceNumber}.pdf`);

      toast.success(`Downloaded Aurora_Invoice_${invoiceNumber}.pdf`, { id: 'pdf-toast', icon: '📄' });
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF. You can still use the Print button.', { id: 'pdf-toast' });
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1250, backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.85)' }}>
      <div style={{
        background: '#090d16',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '32px',
        color: '#ffffff',
        boxShadow: '0 25px 60px rgba(0,0,0,0.95)',
        position: 'relative'
      }}>
        {/* Actions Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '8px', borderRadius: '10px' }}>
              <FileText size={20} color="#06b6d4" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Official Tax Invoice</h3>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>GST / VAT Compliant Fueling Receipt</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              id="btn-download-pdf-invoice"
              style={{
                background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '10px',
                padding: '8px 16px',
                cursor: downloadingPdf ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 10px rgba(6, 182, 212, 0.3)'
              }}
            >
              {downloadingPdf ? <Loader2 size={15} className="spin" /> : <Download size={15} />}
              <span>{downloadingPdf ? 'Generating...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={handlePrint}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#ffffff',
                borderRadius: '10px',
                padding: '8px 14px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Printer size={15} />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: '#94a3b8',
                borderRadius: '10px',
                padding: '8px 14px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px'
              }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div 
          ref={invoiceRef}
          id="aurora-printable-invoice"
          style={{
            background: '#ffffff',
            color: '#0f172a',
            borderRadius: '16px',
            padding: '28px',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          {/* Top Invoice Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: '800', color: '#0284c7' }}>
                AURORA HYDROGEN HUB
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#475569' }}>
                {stationName}
              </p>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                GSTIN: <strong style={{ color: '#0f172a' }}>{stationGstin}</strong> | HSN Code: <strong>28041000</strong>
              </p>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                ISO 14687:2019 Grade D Clean Hydrogen (99.999% Purity)
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>INVOICE NO</span>
              <p style={{ margin: '2px 0 4px 0', fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{invoiceNumber}</p>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Date: {date}</span>
            </div>
          </div>

          {/* Customer & Vehicle Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px', fontSize: '12px' }}>
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontWeight: '600', textTransform: 'uppercase', fontSize: '10px' }}>Billed To</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{customerName}</p>
              <p style={{ margin: '2px 0 0 0', color: '#475569' }}>Vehicle VIN / Plate: <strong>{vehicleNo}</strong></p>
              <p style={{ margin: '2px 0 0 0', color: '#475569' }}>Payment Mode: <span style={{ textTransform: 'capitalize' }}>{paymentMethod}</span></p>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontWeight: '600', textTransform: 'uppercase', fontSize: '10px' }}>Dispenser Telemetry</span>
              <p style={{ margin: '4px 0 0 0', color: '#0f172a' }}>Dispenser: <strong>Bay #2 (High Flow)</strong></p>
              <p style={{ margin: '2px 0 0 0', color: '#475569' }}>Pressure Rating: <strong>700 bar (Type IV Tank)</strong></p>
              <p style={{ margin: '2px 0 0 0', color: '#475569' }}>Txn Ref: <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{transactionId}</span></p>
            </div>
          </div>

          {/* Line Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', borderRadius: '6px 0 0 6px' }}>Item Description</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Qty (kg)</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Rate / kg</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', borderRadius: '0 6px 6px 0' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px' }}>
                  <strong>Compressed Green Hydrogen (CGH2)</strong>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Electrolyzed from 100% Solar & Wind power</div>
                </td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>{quantityKg}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>₹{ratePerKg}</td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700' }}>₹{taxableAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {/* Summary Breakdown */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
            {/* QR Code for Tax Verification */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ background: '#ffffff', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                <QRCode value={`https://aurora-h2.network/verify-invoice/${invoiceNumber}`} size={64} />
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', maxWidth: '200px' }}>
                <strong style={{ color: '#0f172a', display: 'block' }}>Scan to Verify</strong>
                Cryptographically signed e-invoice on Aurora H2 Central Ledger.
              </div>
            </div>

            {/* Calculations */}
            <div style={{ width: '220px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#475569' }}>
                <span>Taxable Amount:</span>
                <span>₹{taxableAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#475569' }}>
                <span>CGST (2.5%):</span>
                <span>₹{cgst.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#475569' }}>
                <span>SGST (2.5%):</span>
                <span>₹{sgst.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0f172a', paddingTop: '6px', fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                <span>Total Paid:</span>
                <span style={{ color: '#0284c7' }}>₹{amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer Notes */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} color="#16a34a" />
              <span>Paid & Authorized electronically. No physical signature needed.</span>
            </div>
            <div style={{ fontWeight: '600', color: '#0284c7' }}>
              Zero Emissions Mobility
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
