import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { 
  History, 
  ArrowLeft, 
  Download, 
  Printer, 
  Fuel, 
  CheckCircle2, 
  Calendar, 
  CreditCard,
  Leaf,
  FileSpreadsheet
} from 'lucide-react';
import { printInvoicePDF, exportToCSV } from '../utils/reportExportUtils';
import InvoiceModal from '../components/InvoiceModal';
import toast from 'react-hot-toast';

export default function CustomerTransactions() {
  const { user } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTxnInvoice, setSelectedTxnInvoice] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data } = await api.get('/transactions/my');
        setTransactions(data || []);
      } catch (error) {
        console.error('Failed to fetch transactions', error);
        toast.error('Failed to load transaction history');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const handleExportCSV = () => {
    const headers = [
      { key: '_id', label: 'Transaction ID' },
      { key: 'stationName', label: 'Station' },
      { key: 'quantityDispensed', label: 'Quantity (kg)' },
      { key: 'cost', label: 'Total Cost ($/₹)' },
      { key: 'paymentStatus', label: 'Payment Status' },
      { key: 'createdAt', label: 'Date' }
    ];

    const rows = transactions.map(t => ({
      _id: t._id,
      stationName: t.station?.name || 'Hydrogen Hub',
      quantityDispensed: t.quantityDispensed,
      cost: t.cost,
      paymentStatus: t.paymentStatus,
      createdAt: new Date(t.createdAt).toLocaleString()
    }));

    exportToCSV('Customer_Refueling_Transactions', rows, headers);
    toast.success('Transaction history exported to CSV!');
  };

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto', color: '#f8fafc' }}>
      
      <Link 
        to="/customer-dashboard" 
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px', 
          color: '#94a3b8', 
          textDecoration: 'none', 
          marginBottom: '1rem',
          fontSize: '0.875rem'
        }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <PageHeader 
          title="Refueling History & Invoices" 
          description="View past hydrogen dispensations, download ISO-certified tax invoices, and export statements."
        />

        {transactions.length > 0 && (
          <Button onClick={handleExportCSV} variant="outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={16} color="#34d399" />
            <span>Export CSV Statement</span>
          </Button>
        )}
      </div>

      <div className="glass-panel" style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '18px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
            Loading transaction history...
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#64748b' }}>
            <History size={40} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
            <h3 style={{ color: '#f8fafc', margin: '0 0 6px 0' }}>No Transactions Recorded</h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Book a station slot to begin your clean hydrogen journey.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.02)', color: '#94a3b8' }}>
                  <th style={{ padding: '14px 18px' }}>Date & Time</th>
                  <th style={{ padding: '14px 18px' }}>Hydrogen Station</th>
                  <th style={{ padding: '14px 18px' }}>Quantity (kg)</th>
                  <th style={{ padding: '14px 18px' }}>Amount Paid</th>
                  <th style={{ padding: '14px 18px' }}>Status</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Tax Invoice</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>
                      {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: '700', color: '#f8fafc' }}>{t.station?.name || 'Downtown Hydrogen Hub'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>700-bar H70 Dispenser</div>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: '800', color: '#34d399' }}>
                      {t.quantityDispensed || 5.0} kg
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: '700', color: '#f8fafc' }}>
                      ₹{t.cost || 75.00}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#34d399',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}>
                        {t.paymentStatus || 'Paid'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setSelectedTxnInvoice({
                            invoiceNumber: `INV-${t._id?.slice(-6)?.toUpperCase() || 'H2-TXN'}`,
                            date: new Date(t.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                            stationName: t.station?.name || 'Downtown Hydrogen Hub',
                            amount: t.cost || 750,
                            quantityKg: t.quantityDispensed || 1.0,
                            ratePerKg: (t.cost && t.quantityDispensed) ? Math.round(t.cost / t.quantityDispensed) : 750,
                            paymentMethod: t.paymentMethod || 'Aurora Digital Wallet',
                            transactionId: t._id,
                            customerName: user?.name || 'Valued Customer',
                            vehicleNo: t.vehicleNumber || 'KA-01-H2-2026'
                          })}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: 'rgba(56, 189, 248, 0.12)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            color: '#38bdf8',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                          title="View & Print Official Tax Invoice"
                        >
                          <Printer size={13} />
                          <span>View Invoice</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InvoiceModal
        isOpen={!!selectedTxnInvoice}
        onClose={() => setSelectedTxnInvoice(null)}
        data={selectedTxnInvoice}
      />

    </div>
  );
}
