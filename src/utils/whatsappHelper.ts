import { api } from '../services/api';
import { Customer, Payment, BusinessSettings } from '../types';

export interface WhatsAppPaymentReceiptOptions {
  customer: Customer | { id: string; name: string; mobile?: string; whatsapp?: string; currentBalance?: number; bottlesWithCustomer?: number };
  payment: Payment | { receiptNumber: string; amount: number; paymentMethod: string; referenceNumber?: string; date?: string; notes?: string };
  settings: BusinessSettings;
  newBalance?: number;
  openDirectly?: boolean;
}

export function cleanPhoneNumber(phone?: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('03') && cleaned.length === 11) {
    cleaned = '92' + cleaned.substring(1);
  }
  return cleaned;
}

export function formatPaymentReceiptWhatsAppMessage(
  customer: { name: string; id?: string },
  payment: { receiptNumber: string; amount: number; paymentMethod: string; referenceNumber?: string; date?: string },
  settings: BusinessSettings,
  remainingBalance?: number
): string {
  const businessName = settings.businessName || 'Anmol Pure Mineral Water';
  const currency = settings.currency || 'Rs.';
  const phone = settings.phone || settings.whatsapp || '';
  const dateStr = payment.date || new Date().toISOString().split('T')[0];
  const bal = remainingBalance !== undefined ? remainingBalance : 0;

  let msg = `*══════════════════════════*\n`;
  msg += `*💧 PAYMENT RECEIVED RECEIPT*\n`;
  msg += `*${businessName}*\n`;
  msg += `*══════════════════════════*\n\n`;
  msg += `Dear *${customer.name}*,\n\n`;
  msg += `We gratefully acknowledge receipt of your water bill payment:\n\n`;
  msg += `  *Receipt No:* ${payment.receiptNumber}\n`;
  msg += `  *Date:* ${dateStr}\n`;
  msg += `  *Amount Received:* *${currency} ${payment.amount.toLocaleString()}*\n`;
  msg += `  *Payment Mode:* ${payment.paymentMethod}${payment.referenceNumber ? ` (${payment.referenceNumber})` : ''}\n`;
  msg += `  *Remaining Balance:* *${currency} ${bal.toLocaleString()}*\n\n`;
  msg += `Thank you for choosing *${businessName}* for your pure mineral drinking water!\n\n`;
  if (phone) {
    msg += `📞 *Customer Care / Refills:* ${phone}\n`;
  }
  msg += `*══════════════════════════*`;
  return msg;
}

export function generateWhatsAppUrl(phone: string, text: string): string {
  const cleaned = cleanPhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleaned}?text=${encodedText}`;
}

export async function sendAutomaticPaymentWhatsApp({
  customer,
  payment,
  settings,
  newBalance,
  openDirectly = true,
}: WhatsAppPaymentReceiptOptions): Promise<{ success: boolean; url: string; cleanPhone: string; message: string }> {
  const phone = customer.whatsapp || customer.mobile || '';
  const cleanedPhone = cleanPhoneNumber(phone);
  const messageText = formatPaymentReceiptWhatsAppMessage(
    customer,
    payment,
    settings,
    newBalance !== undefined ? newBalance : customer.currentBalance
  );
  const url = generateWhatsAppUrl(cleanedPhone, messageText);

  if (customer.id) {
    try {
      await api.sendMessage({
        customerId: customer.id,
        templateCode: 'payment_received',
        customText: messageText,
        channel: 'whatsapp',
      });
    } catch (e) {
      console.warn('Could not log automated WhatsApp message to history:', e);
    }
  }

  if (openDirectly && cleanedPhone && typeof window !== 'undefined') {
    window.open(url, '_blank');
  }

  return {
    success: !!cleanedPhone,
    url,
    cleanPhone: cleanedPhone,
    message: messageText,
  };
}
