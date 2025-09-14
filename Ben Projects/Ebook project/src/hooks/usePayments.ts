import { useState, useCallback } from 'react';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  date: string;
  downloadUrl?: string;
}

interface UsePaymentsReturn {
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
  isLoading: boolean;
  addPaymentMethod: (token?: string) => Promise<PaymentMethod>;
  removePaymentMethod: (id: string) => Promise<void>;
  setDefaultPaymentMethod: (id: string) => Promise<void>;
  downloadInvoice: (id: string) => Promise<void>;
  retryPayment: (invoiceId: string) => Promise<void>;
}

// Mock data
const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'pm_1',
    type: 'card',
    last4: '4242',
    brand: 'visa',
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true,
  },
  {
    id: 'pm_2',
    type: 'card',
    last4: '0005',
    brand: 'mastercard',
    expiryMonth: 8,
    expiryYear: 2024,
    isDefault: false,
  },
];

const mockInvoices: Invoice[] = [
  {
    id: 'inv_1',
    amount: 2900,
    currency: 'usd',
    status: 'paid',
    date: '2024-01-15',
    downloadUrl: '/invoices/inv_1.pdf',
  },
  {
    id: 'inv_2',
    amount: 2900,
    currency: 'usd',
    status: 'paid',
    date: '2023-12-15',
    downloadUrl: '/invoices/inv_2.pdf',
  },
  {
    id: 'inv_3',
    amount: 2900,
    currency: 'usd',
    status: 'failed',
    date: '2023-11-15',
  },
];

export const usePayments = (): UsePaymentsReturn => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [isLoading, setIsLoading] = useState(false);

  const addPaymentMethod = useCallback(async (token?: string): Promise<PaymentMethod> => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newPaymentMethod: PaymentMethod = {
        id: `pm_${Date.now()}`,
        type: 'card',
        last4: '1234',
        brand: 'visa',
        expiryMonth: 12,
        expiryYear: 2026,
        isDefault: paymentMethods.length === 0,
      };
      
      setPaymentMethods(prev => [...prev, newPaymentMethod]);
      return newPaymentMethod;
    } finally {
      setIsLoading(false);
    }
  }, [paymentMethods.length]);

  const removePaymentMethod = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setDefaultPaymentMethod = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPaymentMethods(prev => 
        prev.map(pm => ({ ...pm, isDefault: pm.id === id }))
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const downloadInvoice = useCallback(async (id: string): Promise<void> => {
    const invoice = invoices.find(inv => inv.id === id);
    if (invoice?.downloadUrl) {
      // Simulate download
      window.open(invoice.downloadUrl, '_blank');
    }
  }, [invoices]);

  const retryPayment = useCallback(async (invoiceId: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setInvoices(prev => 
        prev.map(invoice => 
          invoice.id === invoiceId 
            ? { ...invoice, status: 'paid' as const }
            : invoice
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    paymentMethods,
    invoices,
    isLoading,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    downloadInvoice,
    retryPayment,
  };
};