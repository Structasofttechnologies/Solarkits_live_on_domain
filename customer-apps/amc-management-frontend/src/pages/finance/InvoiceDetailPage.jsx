// src/pages/finance/InvoiceDetailPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Send, CheckCircle2, Printer } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { invoices } from '../../mocks/data';
import { formatCurrency } from '../../utils/formatters';
import { toast } from '../../hooks';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const invoice = invoices.find(i => i.id === id) || invoices[0];

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="page-container max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/invoices')} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft size={18} className="text-text-secondary" /></button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-navy">{invoice.invoiceId}</h1>
            <Badge status={invoice.paymentStatus} dot />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Printer size={14} />} onClick={() => toast.info('Opening print...')}>Print</Button>
          <Button variant="outline" size="sm" leftIcon={<Download size={14} />} onClick={() => toast.success('Downloading PDF...')}>PDF</Button>
          {invoice.paymentStatus !== 'paid' && (
            <Button size="sm" leftIcon={<Send size={14} />} onClick={() => toast.success('Payment reminder sent!')}>Send Reminder</Button>
          )}
          {invoice.paymentStatus !== 'paid' && (
            <Button variant="success" size="sm" leftIcon={<CheckCircle2 size={14} />} onClick={() => toast.success('Payment recorded!')}>Record Payment</Button>
          )}
        </div>
      </div>

      {/* Invoice Document */}
      <div className="card p-8 print:shadow-none">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-navy flex items-center justify-center">
                <span className="text-solar font-bold text-sm">E</span>
              </div>
              <div>
                <p className="font-bold text-navy text-lg">Emergesun Energy Pvt. Ltd.</p>
                <p className="text-xs text-text-secondary">Solar AMC Management</p>
              </div>
            </div>
            <p className="text-xs text-text-secondary">GSTIN: 24AABCS1234A1Z5</p>
            <p className="text-xs text-text-secondary">Rajkot, Gujarat — 360001</p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-extrabold text-navy mb-2">TAX INVOICE</h2>
            <p className="text-sm text-text-secondary">Invoice #: <span className="font-mono font-bold text-navy">{invoice.invoiceId}</span></p>
            <p className="text-sm text-text-secondary">Issued: <span className="font-medium text-navy">{formatDate(invoice.issueDate)}</span></p>
            <p className="text-sm text-text-secondary">Due: <span className={`font-medium ${invoice.paymentStatus === 'overdue' ? 'text-danger' : 'text-navy'}`}>{formatDate(invoice.dueDate)}</span></p>
          </div>
        </div>

        {/* Bill To */}
        <div className="grid grid-cols-2 gap-8 mb-8 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Bill To</p>
            <p className="font-bold text-navy">{invoice.customerName}</p>
            <p className="text-sm text-text-secondary">{invoice.contractId} — AMC Contract</p>
            <p className="text-sm text-text-secondary">Period: {invoice.billingPeriod}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Payment Info</p>
            <p className="text-sm text-text-secondary">Bank: HDFC Bank</p>
            <p className="text-sm text-text-secondary">A/C No: XXXX-XXXX-4582</p>
            <p className="text-sm text-text-secondary">IFSC: HDFC0001234</p>
          </div>
        </div>

        {/* Line Items */}
        <table className="w-full mb-6">
          <thead>
            <tr className="bg-navy text-white">
              {['#', 'Service Description', 'Site', 'Qty', 'Rate', 'Amount'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(invoice.lineItems || [{ description: 'Annual AMC Service Charge', site: invoice.contractId, qty: 1, rate: invoice.subtotal, amount: invoice.subtotal }]).map((item, i) => (
              <tr key={i} className="border-b border-border">
                <td className="px-3 py-3 text-xs text-text-muted">{i + 1}</td>
                <td className="px-3 py-3 text-sm font-medium text-navy">{item.description}</td>
                <td className="px-3 py-3 text-xs text-text-secondary">{item.site}</td>
                <td className="px-3 py-3 text-sm text-center">{item.qty}</td>
                <td className="px-3 py-3 text-sm text-right">{formatCurrency(item.rate)}</td>
                <td className="px-3 py-3 text-sm font-semibold text-right">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Subtotal</span>
              <span className="font-medium text-navy">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">CGST (9%)</span>
              <span className="font-medium text-navy">{formatCurrency(invoice.taxAmount / 2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">SGST (9%)</span>
              <span className="font-medium text-navy">{formatCurrency(invoice.taxAmount / 2)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-success">Discount</span>
                <span className="font-medium text-success">- {formatCurrency(invoice.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-2 border-t-2 border-navy">
              <span className="text-navy">Total Amount</span>
              <span className="text-navy">{formatCurrency(invoice.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Status watermark */}
        {invoice.paymentStatus === 'paid' && (
          <div className="mt-6 flex items-center gap-2 text-success">
            <CheckCircle2 size={20} />
            <span className="font-bold text-lg">PAID</span>
          </div>
        )}

        {/* Terms */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs font-semibold text-navy mb-1">Terms & Conditions</p>
          <p className="text-xs text-text-muted">Payment due within 30 days from invoice date. Late payment may incur interest @18% p.a. This is a computer-generated invoice. GST to be paid as per applicable rules.</p>
        </div>
      </div>
    </div>
  );
}
