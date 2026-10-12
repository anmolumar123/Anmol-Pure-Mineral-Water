import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer } from '../../types';
import { MessageSquare, Send, Copy, Check, X, Phone } from 'lucide-react';
import { generateWhatsAppUrl } from '../../utils/whatsappHelper';

interface MessageModalProps {
  customer: Customer;
  onClose: () => void;
}

export const MessageModal: React.FC<MessageModalProps> = ({ customer, onClose }) => {
  const { settings, addToast } = useApp();
  const [copied, setCopied] = useState(false);

  const defaultMsg =
    `Salam ${customer.name},\n\n` +
    `This is a gentle update from ${settings.businessName}.\n` +
    `Your current holding 19L bottles: ${customer.bottlesWithCustomer || 0} bottles.\n` +
    `Your outstanding ledger balance: Rs. ${Number(customer.currentBalance || 0).toLocaleString()}.\n\n` +
    `Need a refill delivery or have any queries? Reply to this message or call ${settings.phone}.\n\n` +
    `Thank you!`;

  const [messageText, setMessageText] = useState(defaultMsg);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    addToast('success', 'Message Copied', 'Template copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const mobile = customer.whatsapp || customer.mobile || '';
    if (!mobile) {
      addToast('error', 'No Phone Number', 'This customer does not have a valid mobile or WhatsApp number.');
      return;
    }
    const url = generateWhatsAppUrl(mobile, messageText);
    window.open(url, '_blank');
    addToast('success', 'WhatsApp Opened', 'Redirecting to WhatsApp chat.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">Send WhatsApp / SMS</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-slate-800">{customer.name}</p>
              <p className="text-slate-500">{customer.area || 'Karachi'}</p>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 font-mono font-medium">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{customer.whatsapp || customer.mobile || 'No Phone'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Message Content
            </label>
            <textarea
              rows={6}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={handleCopy}
              type="button"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
            <button
              onClick={handleSendWhatsApp}
              type="button"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>Open in WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
