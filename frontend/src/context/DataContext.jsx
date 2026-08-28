import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../config';

// --- Helper: read current authenticated user from localStorage ---
const getAuthUser = () => {
  try {
    const raw = localStorage.getItem('erp_user') || localStorage.getItem('user');
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
};

// --- Helper: resolve tenantId from auth user, fallback to 1 ---
const getAuthTenantId = () => {
  const u = getAuthUser();
  return (u?.tenantId || u?.tenant?.id || 1);
};

// --- Helper: resolve userId from auth user, fallback to 1 ---
const getAuthUserId = () => {
  const u = getAuthUser();
  return (u?.id || 1);
};

// --- Helper: build request headers with JWT Authorization ---
const getAuthHeaders = () => {
  const user = getAuthUser();
  const token = user?.token || localStorage.getItem('erp_token') || localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token && token !== 'undefined' && token !== 'null') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// --- Payment method normalizer ---
const mapPaymentMethod = (method) => {
  if (!method) return 'CASH';
  const m = String(method).toUpperCase();
  if (['CASH', 'UPI', 'CARD', 'NET_BANKING', 'CREDIT', 'ONLINE', 'ACCOUNT_TRANSFER'].includes(m)) return m;
  if (m.includes('UPI') || m.includes('ONLINE')) return 'UPI';
  if (m.includes('CARD')) return 'CARD';
  if (m.includes('BANK') || m.includes('TRANSFER')) return 'NET_BANKING';
  return 'CASH';
};

const DataContext = createContext();

export const INITIAL_COMPANY_DETAILS = {
  name: 'Yashas Ev Service',
  tagline: 'Electric Two-Wheeler Sales, Battery & Multi-Brand Service Station',
  phone: '767642061',
  altPhone: '6364687779',
  email: 'yrtmotos@gmail.com',
  gstin: '29EVHUB1234F1Z5',
  address: 'No. 42, EV Hub Road, Near Bus Terminal, Bengaluru, Karnataka - 560001',
  upiId: '8105979580-of5a-2@ybl',
  bankName: 'HDFC Bank',
  accountNo: '50200088991122',
  ifscCode: 'HDFC0001234',
  termsAndConditions: 'Warranty applies as per manufacturer terms. Thank you for choosing GreenDrive EV!'
};

const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: 'EV Lithium-Ion Battery 60V 30Ah',
    barcode: '890123456701',
    hsnCode: '85076000',
    category: 'Batteries',
    brand: 'EV Cell Tech',
    purchasePrice: 22000,
    sellingPrice: 28500,
    taxRate: 18,
    stockQuantity: 10,
    minStockThreshold: 3,
    unit: 'Nos'
  },
  {
    id: 2,
    name: 'EV Motor Controller 60V/72V 1000W',
    barcode: '890123456702',
    hsnCode: '85044090',
    category: 'Electronics',
    brand: 'BLDC Power',
    purchasePrice: 2800,
    sellingPrice: 4200,
    taxRate: 18,
    stockQuantity: 15,
    minStockThreshold: 4,
    unit: 'Nos'
  },
  {
    id: 3,
    name: 'EV Tubeless Tyre 90/90-12',
    barcode: '890123456703',
    hsnCode: '40111010',
    category: 'Tyres',
    brand: 'MRF / CEAT',
    purchasePrice: 1200,
    sellingPrice: 1750,
    taxRate: 18,
    stockQuantity: 30,
    minStockThreshold: 6,
    unit: 'Nos'
  },
  {
    id: 4,
    name: 'EV Disc Brake Pad (Front/Rear)',
    barcode: '890123456704',
    hsnCode: '87149420',
    category: 'Brake System',
    brand: 'E-Brake',
    purchasePrice: 180,
    sellingPrice: 350,
    taxRate: 18,
    stockQuantity: 40,
    minStockThreshold: 10,
    unit: 'Nos'
  },
  {
    id: 5,
    name: 'EV Throttle Assembly with 3-Speed Switch',
    barcode: '890123456705',
    hsnCode: '87149990',
    category: 'Controls',
    brand: 'SpeedGrip',
    purchasePrice: 350,
    sellingPrice: 650,
    taxRate: 18,
    stockQuantity: 20,
    minStockThreshold: 5,
    unit: 'Nos'
  },
  {
    id: 6,
    name: 'EV Full General Service & Battery Diagnostics',
    barcode: '890123456706',
    hsnCode: '998729',
    category: 'Services',
    brand: 'In-House EV Lab',
    purchasePrice: 0,
    sellingPrice: 850,
    taxRate: 18,
    stockQuantity: 999,
    minStockThreshold: 1,
    unit: 'Nos'
  }
];

const INITIAL_CUSTOMERS = [
  {
    id: 1,
    name: 'Rahul Sharma',
    phone: '9876543210',
    email: 'rahul.s@gmail.com',
    gstin: '',
    address: 'Indiranagar, Bengaluru',
    shippingAddress: 'Indiranagar, Bengaluru',
    regNo: 'KA 05 EV 1234',
    creditLimit: 15000,
    pendingBalance: 0
  },
  {
    id: 2,
    name: 'Suresh Kumar',
    phone: '9123456789',
    email: 'suresh.k@gmail.com',
    gstin: '',
    address: 'Koramangala, Bengaluru',
    shippingAddress: 'Koramangala, Bengaluru',
    regNo: 'KA 01 EV 5678',
    creditLimit: 10000,
    pendingBalance: 0
  }
];

const DATA_VERSION = 'v3';

export const DataProvider = ({ children }) => {
  if (localStorage.getItem('erp_data_version') !== DATA_VERSION) {
    ['erp_invoices', 'erp_expenses', 'erp_audit_logs'].forEach(k => localStorage.removeItem(k));
    localStorage.setItem('erp_data_version', DATA_VERSION);
  }

  const [shopDetails, setShopDetails] = useState(() => {
    const saved = localStorage.getItem('erp_shop_details');
    return saved ? JSON.parse(saved) : INITIAL_COMPANY_DETAILS;
  });

  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('erp_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('erp_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  // FIX 1: invoices NEVER initialized from localStorage.
  // The database is the single source of truth.
  // Invoices start empty and are populated exclusively from the backend.
  const [invoices, setInvoices] = useState([]);

  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem('erp_audit_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('erp_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  // FIX 2: Only non-invoice shared data is persisted to localStorage.
  // Invoices are NOT saved to localStorage — they come exclusively from the backend.
  useEffect(() => { localStorage.setItem('erp_shop_details', JSON.stringify(shopDetails)); }, [shopDetails]);
  useEffect(() => { localStorage.setItem('erp_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('erp_customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('erp_audit_logs', JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem('erp_expenses', JSON.stringify(expenses)); }, [expenses]);

  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [wsConnected, setWsConnected] = useState(true);

  // FIX 6: Concurrent fetch guard — prevents overlapping polling requests from racing
  const isFetchingRef = useRef(false);

  // FIX 3: fetchFromBackend ALWAYS replaces invoice state with authoritative DB state.
  // It NEVER merges local-only invoices. Database wins unconditionally.
  const fetchFromBackend = useCallback(async () => {
    if (isFetchingRef.current) return; // skip if fetch already in flight
    isFetchingRef.current = true;
    try {
      // FIX 8: use tenantId from authenticated user — never hardcode 1
      const tenantId = getAuthTenantId();
      const headers = getAuthHeaders();
      const [prodRes, invRes, custRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/products?tenantId=${tenantId}`, { headers }),
        fetch(`${API_BASE_URL}/api/invoices?tenantId=${tenantId}`, { headers }),
        fetch(`${API_BASE_URL}/api/customers?tenantId=${tenantId}`, { headers })
      ]);

      const isConnected = [prodRes, invRes, custRes].some(r => r.status === 'fulfilled' && r.value.ok);
      setIsOnline(isConnected);
      setWsConnected(isConnected);

      if (prodRes.status === 'fulfilled' && prodRes.value.ok) {
        const prodData = await prodRes.value.json();
        if (Array.isArray(prodData) && prodData.length > 0) {
          const mapped = prodData.map(p => ({
            id: p.id,
            name: p.name,
            barcode: p.barcode || '',
            hsnCode: p.hsnCode || '',
            category: typeof p.category === 'object' ? p.category?.name : (p.category || 'General'),
            brand: typeof p.brand === 'object' ? p.brand?.name : (p.brand || ''),
            purchasePrice: p.purchasePrice || 0,
            sellingPrice: p.sellingPrice || 0,
            taxRate: p.taxRate || 18,
            stockQuantity: p.stockQuantity ?? 0,
            minStockThreshold: p.minStockThreshold ?? 5,
            unit: p.unit || 'Pcs'
          }));
          setProducts(mapped);
        }
      }

      if (invRes.status === 'fulfilled' && invRes.value.ok) {
        const invData = await invRes.value.json();
        if (Array.isArray(invData)) {
          const mapped = invData.map(inv => {
            const customerObj = typeof inv.customer === 'object' ? inv.customer : null;
            const createdByObj = typeof inv.createdBy === 'object' ? inv.createdBy : null;

            const customerName = inv.customerName || customerObj?.name || 'Walk-in Customer';
            const customerPhone = inv.customerPhone || customerObj?.phone || '';
            const billingAddress = inv.billingAddress || customerObj?.address || '';
            const shippingAddress = inv.shippingAddress || customerObj?.shippingAddress || customerObj?.address || '';
            const regNo = inv.regNo || customerObj?.regNo || '';
            const createdByName = inv.createdByName || createdByObj?.fullName || createdByObj?.username || (typeof inv.createdBy === 'string' ? inv.createdBy : 'Staff');
            const date = inv.date || (inv.createdAt ? inv.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]);

            const mappedItems = Array.isArray(inv.items) ? inv.items.map((item, idx) => {
              const prodObj = typeof item.product === 'object' ? item.product : null;
              return {
                id: item.id || idx + 1,
                name: item.productName || item.name || prodObj?.name || 'Item',
                productName: item.productName || item.name || prodObj?.name || 'Item',
                batchNo: item.batchNo || '',
                modelNo: item.modelNo || '',
                quantity: Number(item.quantity || 1),
                unit: item.unit || prodObj?.unit || 'Nos',
                pricePerUnit: Number(item.unitPrice || item.pricePerUnit || prodObj?.sellingPrice || 0),
                unitPrice: Number(item.unitPrice || item.pricePerUnit || prodObj?.sellingPrice || 0),
                discountType: item.discountType || 'NONE',
                discountVal: Number(item.discountVal || 0),
                taxType: item.taxType || 'NONE',
                amount: Number(item.totalPrice || item.amount || 0),
                totalPrice: Number(item.totalPrice || item.amount || 0)
              };
            }) : [];

            return {
              ...inv,
              customerName,
              customerPhone,
              billingAddress,
              shippingAddress,
              regNo,
              createdByName,
              date,
              items: mappedItems,
              grandTotal: Number(inv.grandTotal || inv.subtotal || 0),
              subtotal: Number(inv.subtotal || inv.grandTotal || 0),
              paidAmount: Number(inv.paidAmount || 0),
              balanceAmount: Number(inv.balanceAmount || 0),
              paymentStatus: inv.paymentStatus || 'PAID',
              paymentMethod: inv.paymentMethod || 'CASH',
              type: inv.type || 'TAX_INVOICE'
            };
          });
          // FIX 3: Unconditionally replace state with DB state. Never merge stale local invoices.
          setInvoices(mapped);
        }
      }

      if (custRes.status === 'fulfilled' && custRes.value.ok) {
        const custData = await custRes.value.json();
        if (Array.isArray(custData)) {
          setCustomers(custData);
        }
      }
    } catch (e) {
      // FIX 9: Log actual errors — never silently swallow
      console.error('Backend sync failed:', e.message);
      setIsOnline(false);
      setWsConnected(false);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Monitor online/offline network status
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); fetchFromBackend(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchFromBackend]);

  // Poll backend every 3 seconds — all devices get authoritative DB state within 3s
  useEffect(() => {
    fetchFromBackend();
    const interval = setInterval(fetchFromBackend, 3000);
    const handleFocus = () => fetchFromBackend();
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchFromBackend]);

  const updateShopDetails = (newDetails) => {
    setShopDetails(prev => ({ ...prev, ...newDetails }));
  };

  const createNewCompany = (companyData) => {
    const created = {
      ...INITIAL_COMPANY_DETAILS,
      ...companyData
    };
    setShopDetails(created);
    return created;
  };

  const addAuditLog = (action, username, role, details) => {
    const newLog = {
      id: Date.now(),
      action,
      username: username || 'system',
      role: role || 'USER',
      details,
      timestamp: new Date().toLocaleString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const addProduct = async (product, user = {}) => {
    const newProd = { id: Date.now(), ...product };
    setProducts(prev => [...prev, newProd]);
    addAuditLog('PRODUCT_CREATED', user?.username, user?.role, `Added EV part ${newProd.name}`);

    try {
      const tenantId = getAuthTenantId();
      await fetch(`${API_BASE_URL}/api/products?tenantId=${tenantId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(product)
      });
      fetchFromBackend();
    } catch (e) {
      console.error('Product save failed:', e.message);
    }

    return newProd;
  };

  const deleteProduct = async (productId, user = {}) => {
    const target = products.find(p => p.id === productId);
    setProducts(prev => prev.filter(p => p.id !== productId));
    addAuditLog('PRODUCT_DELETED', user?.username || 'owner', user?.role || 'OWNER', `Deleted inventory item ${target?.name || productId}`);

    try {
      await fetch(`${API_BASE_URL}/api/products/${productId}`, { method: 'DELETE', headers: getAuthHeaders() });
      fetchFromBackend();
    } catch (e) {
      console.error('Product delete failed:', e.message);
    }
  };

  const adjustStock = async (productId, delta, mode, user = {}) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const newQty = mode === 'IN' ? p.stockQuantity + delta : Math.max(0, p.stockQuantity - delta);
        return { ...p, stockQuantity: newQty };
      }
      return p;
    }));
    addAuditLog('STOCK_ADJUSTED', user?.username, user?.role, `Stock ${mode} by ${delta} for part #${productId}`);

    try {
      await fetch(`${API_BASE_URL}/api/products/${productId}/stock?quantity=${delta}&mode=${mode}`, { method: 'PUT', headers: getAuthHeaders() });
      fetchFromBackend();
    } catch (e) {
      console.error('Stock adjustment failed:', e.message);
    }
  };

  const mapPaymentMethod = (method) => {
    if (!method) return 'CASH';
    const m = String(method).toUpperCase();
    if (['CASH', 'UPI', 'CARD', 'NET_BANKING', 'CREDIT', 'ONLINE', 'ACCOUNT_TRANSFER'].includes(m)) {
      return m;
    }
    if (m.includes('UPI') || m.includes('ONLINE')) return 'UPI';
    if (m.includes('CARD')) return 'CARD';
    if (m.includes('BANK') || m.includes('TRANSFER')) return 'NET_BANKING';
    return 'CASH';
  };

  // FIX 4, 5, 9: addInvoice — DATABASE FIRST
  // 1. Build payload (no client-side id)
  // 2. POST to backend
  // 3. Await confirmed HTTP 200 with real DB id
  // 4. Only then refresh state from DB via fetchFromBackend
  // 5. On failure — throw so the UI shows a clear error to the user
  const addInvoice = async (invoice, user = {}) => {
    // FIX 8: use tenantId/userId from authenticated user
    const tenantId = getAuthTenantId();
    const uId = user?.id || getAuthUserId();

    const backendPayload = {
      // Do NOT send a client-generated ID — let the database generate it
      invoiceNumber: invoice.invoiceNumber || null,
      type: invoice.type || 'TAX_INVOICE',
      subtotal: Number(invoice.subtotal || invoice.grandTotal || 0),
      cgstAmount: Number(invoice.cgstAmount || 0),
      sgstAmount: Number(invoice.sgstAmount || 0),
      igstAmount: Number(invoice.igstAmount || 0),
      discountAmount: Number(invoice.discountAmount || 0),
      grandTotal: Number(invoice.grandTotal || 0),
      paidAmount: Number(invoice.paidAmount || 0),
      balanceAmount: Number(invoice.balanceAmount || 0),
      paymentStatus: invoice.paymentStatus || 'PAID',
      paymentMethod: mapPaymentMethod(invoice.paymentMethod || invoice.paymentType),
      notes: invoice.notes || '',
      customer: {
        name: invoice.customerName || invoice.customer?.name || 'Walk-in Customer',
        phone: invoice.customerPhone || invoice.customer?.phone || '',
        address: invoice.billingAddress || invoice.customer?.address || ''
      },
      items: (invoice.items || []).map(item => ({
        productName: item.productName || item.name || 'Item',
        hsnCode: item.hsnCode || '',
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unitPrice || item.pricePerUnit || 0),
        taxRate: Number(item.taxRate || 18),
        taxAmount: Number(item.taxAmount || 0),
        totalPrice: Number(item.totalPrice || item.amount || 0)
      }))
    };

    // POST to backend first — do NOT optimistically add to state before confirmation
    const res = await fetch(`${API_BASE_URL}/api/invoices?tenantId=${tenantId}&userId=${uId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(backendPayload)
    });

    // FIX 9: surface server errors — never silently swallow
    if (!res.ok) {
      let errMsg = `Server error ${res.status}`;
      try { errMsg = `Invoice could not be saved to the server (${res.status}). Please try again.`; } catch (_) {}
      throw new Error(errMsg);
    }

    // FIX 5: use the real database-generated ID from the backend response
    const savedFromBackend = await res.json();

    addAuditLog(
      'INVOICE_CREATED',
      user?.username || 'owner',
      user?.role || 'OWNER',
      `Created EV Invoice #${savedFromBackend.invoiceNumber} for ₹${Number(savedFromBackend.grandTotal || 0).toLocaleString()}`
    );

    // Refresh invoice list from DB — all devices get authoritative state
    await fetchFromBackend();
    return savedFromBackend;
  };

  const updateInvoice = (updatedInvoice, user = {}) => {
    setInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? { ...inv, ...updatedInvoice } : inv));
    addAuditLog('INVOICE_UPDATED', user?.username || 'owner', user?.role || 'OWNER', `Updated Invoice #${updatedInvoice.invoiceNumber}`);
    return updatedInvoice;
  };

  // FIX 7: deleteInvoice — backend FIRST, then refresh from DB
  const deleteInvoice = async (invoiceId, user = {}) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) {
        throw new Error(`Delete failed: server returned ${res.status}`);
      }
      addAuditLog('INVOICE_DELETED', user?.username || 'owner', user?.role || 'OWNER', `Deleted Invoice #${invoiceId}`);
      // Refresh from DB after confirmed delete
      await fetchFromBackend();
    } catch (e) {
      console.error('Invoice delete failed:', e.message);
      throw e;
    }
  };

  const addCustomer = async (customer) => {
    const newCust = { id: Date.now(), pendingBalance: 0, ...customer };
    setCustomers(prev => [...prev, newCust]);
    try {
      const tenantId = getAuthTenantId();
      await fetch(`${API_BASE_URL}/api/customers?tenantId=${tenantId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newCust)
      });
      fetchFromBackend();
    } catch (e) {
      console.error('Customer save failed:', e.message);
    }
  };

  const deleteCustomer = async (customerId, user = {}) => {
    const target = customers.find(c => c.id === customerId);
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    addAuditLog('CUSTOMER_DELETED', user?.username || 'owner', user?.role || 'OWNER', `Deleted customer profile ${target?.name || customerId}`);
    try {
      await fetch(`${API_BASE_URL}/api/customers/${customerId}`, { method: 'DELETE', headers: getAuthHeaders() });
      fetchFromBackend();
    } catch (e) {
      console.error('Customer delete failed:', e.message);
    }
  };

  const recordCustomerPayment = (customerId, amount) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        return { ...c, pendingBalance: Math.max(0, (c.pendingBalance || 0) - amount) };
      }
      return c;
    }));
  };

  const addExpense = (expense, user = {}) => {
    const newExp = { id: Date.now(), date: new Date().toISOString().split('T')[0], ...expense };
    setExpenses(prev => [...prev, newExp]);
    addAuditLog('EXPENSE_RECORDED', user?.username, user?.role, `Recorded expense ₹${expense.amount} under ${expense.category}`);
  };

  return (
    <DataContext.Provider value={{
      shopDetails,
      updateShopDetails,
      createNewCompany,
      products,
      customers,
      invoices,
      auditLogs,
      expenses,
      addProduct,
      deleteProduct,
      adjustStock,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      addCustomer,
      deleteCustomer,
      recordCustomerPayment,
      addExpense,
      addAuditLog,
      isOnline,
      wsConnected,
      refreshData: fetchFromBackend
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
