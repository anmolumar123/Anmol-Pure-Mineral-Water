import React from 'react';
import { useApp } from '../../context/AppContext';
import { Printer, X, Droplets, CheckCircle, FileText, Send } from 'lucide-react';
import { sendAutomaticPaymentWhatsApp } from '../../utils/whatsappHelper';
import { Sale, Payment } from '../../types';

interface InvoiceModalProps {
  sale?: Sale;
  payment?: Payment;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ sale, payment, onClose }) => {
  const { settings, formatCurrency, formatDate } = useApp();

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    if (payment) {
      sendAutomaticPaymentWhatsApp({
        customer: { id: payment.customerId, name: payment.customerName },
        payment,
        settings,
      });
    } else if (sale) {
      const text = `*${settings.businessName} - Delivery Invoice*\n` +
        `Invoice #${sale.invoiceNumber}\n` +
        `Customer: ${sale.customerName}\n` +
        `Filled Bottles Delivered: ${sale.quantity}\n` +
        `Empty Returned: ${sale.emptyBottlesReceived}\n` +
        `Total: Rs. ${sale.total.toLocaleString()}\n` +
        `Paid: Rs. ${sale.paidAmount.toLocaleString()}\n` +
        `Balance: Rs. ${sale.remainingBalance.toLocaleString()}\n` +
        `Status: ${(sale.paymentStatus || 'unpaid').toUpperCase()}\n` +
        `Thank you for choosing ${settings.businessName}!`;
      const cleanPhone = (sale.customerPhone || '').replace(/[^0-9]/g, '');
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden print:shadow-none print:border-none print:w-full print:max-w-none">
        {/* Top Action Bar (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-sm tracking-wide">
              {sale ? `Sales Invoice: ${sale.invoiceNumber}` : `Payment Receipt: ${payment?.receiptNumber}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 sm:p-10 space-y-6 print:p-6" id="printable-invoice">
          {/* Company Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                  <Droplets className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-black tracking-tight text-slate-900">
                  {settings.businessName}
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-medium">{settings.tagline}</p>
              <p className="text-xs text-slate-600">{settings.address}</p>
              <p className="text-xs text-slate-600">
                Phone: {settings.phone} | City: {settings.city}
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200">
                {sale ? 'DELIVERY INVOICE' : 'PAYMENT RECEIPT'}
              </span>
              <p className="text-sm font-bold text-slate-800">
                #{sale?.invoiceNumber || payment?.receiptNumber}
              </p>
              <p className="text-xs text-slate-500">Date: {formatDate(sale?.date || payment?.date || '')}</p>
              {sale && (
                <div className="pt-1">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      sale.paymentStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : sale.paymentStatus === 'partial'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    STATUS: {(sale.paymentStatus || 'unpaid').toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                Billed To
              </p>
              <p className="font-bold text-sm text-slate-800">
                {sale?.customerName || payment?.customerName}
              </p>
              <p className="text-slate-600">{sale?.customerAddress || 'Karachi'}</p>
              <p className="text-slate-600">{sale?.customerPhone || 'Contact verified'}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                Account Status
              </p>
              <p className="text-slate-700">
                Payment Method: <strong className="text-slate-900">{sale?.paymentMethod || payment?.paymentMethod || 'Cash'}</strong>
              </p>
              {sale && (
                <p className="text-slate-700">
                  Remaining Due: <strong className="text-slate-900">{formatCurrency(sale.remainingBalance)}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Sale Line Items */}
          {sale && (
            <div className="space-y-3">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-lg">Description</th>
                    <th className="py-2.5 px-3 text-center">Delivered Qty</th>
                    <th className="py-2.5 px-3 text-center">Empty Returned</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {sale.items && sale.items.length > 0 ? (
                    sale.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-3">{it.itemName}</td>
                        <td className="py-3 px-3 text-center">{it.quantity}</td>
                        <td className="py-3 px-3 text-center">-</td>
                        <td className="py-3 px-3 text-right">Rs. {it.rate.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          Rs. {it.total.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-3 px-3">19L Pure Mineral Water Bottle</td>
                      <td className="py-3 px-3 text-center">{sale.quantity}</td>
                      <td className="py-3 px-3 text-center">{sale.emptyBottlesReceived}</td>
                      <td className="py-3 px-3 text-right">Rs. {sale.rate}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        Rs. {sale.total.toLocaleString()}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Totals Summary */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>Rs. {sale.subtotal.toLocaleString()}</span>
                  </div>
                  {sale.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Discount:</span>
                      <span>- Rs. {sale.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Bill:</span>
                    <span>Rs. {sale.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Paid Amount:</span>
                    <span>Rs. {sale.paidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-rose-700 font-bold border-t border-slate-100 pt-1">
                    <span>Invoice Balance:</span>
                    <span>Rs. {sale.remainingBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Receipt Body */}
          {payment && (
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center space-y-2">
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                  Payment Received
                </p>
                <p className="text-3xl font-black text-emerald-950">
                  Rs. {payment.amount.toLocaleString()}
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-emerald-700 font-medium">
                  <CheckCircle className="w-4 h-4" />
                  <span>Mode: {payment.paymentMethod.toUpperCase()}</span>
                  {payment.referenceNumber && <span>| Ref: {payment.referenceNumber}</span>}
                </div>
              </div>

              {payment.notes && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                  <strong>Notes:</strong> {payment.notes}
                </div>
              )}
            </div>
          )}

          {/* Terms and Signature */}
          <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
            <div className="space-y-1">
              <p className="font-semibold text-slate-700">Terms & Conditions:</p>
              <p>1. 19L Empty bottles remain company property unless deposit paid.</p>
              <p>2. Keep this receipt for any account reconciliation inquiries.</p>
            </div>
            <div className="text-center">
              <div className="w-36 border-b border-slate-400 mb-1"></div>
              <p className="text-[11px] text-slate-400">Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
