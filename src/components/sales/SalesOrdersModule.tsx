import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  PlusCircle,
  CheckCircle2,
  Truck,
  Printer,
  DollarSign,
  ArrowRight,
  Receipt,
  AlertCircle,
  Eye,
  Building,
  Sparkles,
  Tag,
  ShieldCheck,
  Search,
  Plus,
  Trash2,
  X,
  Gift,
  Calendar,
  ChevronDown,
  ShoppingBag,
  Check,
  Percent,
  AlertTriangle,
  UserPlus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { SalesOrder, SalesOrderItem, CashBookEntry, getCustomerProductPricing } from '../../types/erp.ts';

interface QuickOrderItem {
  id: string;
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productName: string;
  batchNumber: string;
  pcsPerCtn: number;
  stockCtn: number;
  stockPcs: number;
  unitPrice: number;
  ctnPrice: number;
  qtyCtn: number;
  qtyPcs: number;
  freeQty: number;
}

const INITIAL_QUICK_ITEMS: QuickOrderItem[] = [
  {
    id: 'qi-1',
    warehouseId: 'wh-moulovi',
    warehouseName: 'MouloviBazar',
    productId: 'p-oil-1',
    productName: 'Lucy Olive Oil 150gm tin (80) 515/-',
    batchNumber: 'BT-20260830-001',
    pcsPerCtn: 80,
    stockCtn: 11,
    stockPcs: 880,
    unitPrice: 429.17,
    ctnPrice: 34334,
    qtyCtn: 1,
    qtyPcs: 1,
    freeQty: 0,
  },
  {
    id: 'qi-2',
    warehouseId: 'wh-armanitola',
    warehouseName: 'Armanitola',
    productId: 'p-ayur-1',
    productName: 'Sesa Ayurvedic 100ml 280/-',
    batchNumber: 'BT-20260830-001',
    pcsPerCtn: 96,
    stockCtn: 1511,
    stockPcs: 145056,
    unitPrice: 233.33,
    ctnPrice: 22400,
    qtyCtn: 1,
    qtyPcs: 1,
    freeQty: 0,
  },
  {
    id: 'qi-3',
    warehouseId: 'wh-begumganj',
    warehouseName: 'Begumganj 2',
    productId: 'p-ayur-2',
    productName: 'Sesa Ayurvedic 100ml 265/-',
    batchNumber: 'BT-20260830-001',
    pcsPerCtn: 96,
    stockCtn: 1306,
    stockPcs: 125376,
    unitPrice: 220.83,
    ctnPrice: 21200,
    qtyCtn: 0,
    qtyPcs: 1,
    freeQty: 0,
  },
];

export const SalesOrdersModule: React.FC = () => {
  const {
    salesOrders,
    approveSalesOrder,
    dispatchAndInvoiceSalesOrder,
    recordOrderPayment,
    customers,
    distributors,
    products,
    warehouses,
    createSalesOrder,
    addCustomer,
  } = useERP();

  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<SalesOrder | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<SalesOrder | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);

  // Payment collection form
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payAccount, setPayAccount] = useState<CashBookEntry['accountType']>('City Bank PLC');
  const [payRef, setPayRef] = useState('');

  // New Sales Order Form (Modal)
  const [newCustId, setNewCustId] = useState(customers[0]?.id || '');
  const [newWhId, setNewWhId] = useState(warehouses[1]?.id || warehouses[0]?.id || '');
  const [newProdId, setNewProdId] = useState(products[0]?.id || '');
  const [newQty, setNewQty] = useState(10);
  const [newPaymentMethod, setNewPaymentMethod] = useState<SalesOrder['paymentMethod']>('Credit');

  // Sales Orders Master Registry Pagination (15 rows at a time)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
  const totalPages = Math.ceil(salesOrders.length / pageSize) || 1;
  const paginatedSalesOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return salesOrders.slice(start, start + pageSize);
  }, [salesOrders, currentPage, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Direct In-page Quick Order Capture State
  const [orderMemoNo, setOrderMemoNo] = useState('3245');
  const [orderDate, setOrderDate] = useState('2026-10-19');
  const [selectedBuyerId, setSelectedBuyerId] = useState('cust-nasim');
  const [productSearchInput, setProductSearchInput] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [discountValue, setDiscountValue] = useState<number | string>(100);
  const [discountType, setDiscountType] = useState<'BDT' | '%'>('BDT');
  const [paymentMode, setPaymentMode] = useState<string>('Credit (Due)');
  const [orderNote, setOrderNote] = useState('');
  const [quickItems, setQuickItems] = useState<QuickOrderItem[]>(INITIAL_QUICK_ITEMS);
  const [showQuickAddCustModal, setShowQuickAddCustModal] = useState(false);
  const [showConfirmSaleModal, setShowConfirmSaleModal] = useState(false);
  const [saleSuccessBanner, setSaleSuccessBanner] = useState<string | null>(null);

  // Quick Customer Add Modal State
  const [quickCustName, setQuickCustName] = useState('');
  const [quickCustPhone, setQuickCustPhone] = useState('');
  const [quickCustChannel, setQuickCustChannel] = useState('Retail Store');
  const [quickCustCreditLimit, setQuickCustCreditLimit] = useState(50000);

  // All available customers/distributors
  const allAvailableBuyers = useMemo(() => {
    const list = [
      {
        id: 'cust-nasim',
        name: 'Nasim Store-MEL',
        channel: 'Retail Store',
        creditLimitBDT: 50000,
        outstandingBalanceBDT: 0,
        phone: '+880 1711-223344',
      },
      ...customers.map((c) => ({
        id: c.id,
        name: c.name,
        channel: c.channel || 'Retail Customer',
        creditLimitBDT: c.creditLimitBDT || 50000,
        outstandingBalanceBDT: c.currentBalanceBDT || c.outstandingBalanceBDT || 0,
        phone: c.phone || '',
      })),
      ...distributors.map((d) => ({
        id: d.id,
        name: d.name,
        channel: 'Distributor',
        creditLimitBDT: d.creditLimitBDT || 1000000,
        outstandingBalanceBDT: d.currentOutstandingBDT || 0,
        phone: d.phone || '',
      })),
    ];
    const seen = new Set();
    return list.filter((b) => {
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    });
  }, [customers, distributors]);

  // All available warehouses for selection
  const allAvailableWarehouses = useMemo(() => {
    const defaultHubs = [
      { id: 'wh-moulovi', name: 'MouloviBazar' },
      { id: 'wh-armanitola', name: 'Armanitola' },
      { id: 'wh-begumganj', name: 'Begumganj 2' },
    ];
    const fromState = warehouses.map((w) => ({ id: w.id, name: w.name }));
    const combined = [...defaultHubs, ...fromState];
    const seen = new Set();
    return combined.filter((w) => {
      if (seen.has(w.name)) return false;
      seen.add(w.name);
      return true;
    });
  }, [warehouses]);

  // Selected buyer object
  const selectedBuyer = useMemo(() => {
    return allAvailableBuyers.find((b) => b.id === selectedBuyerId) || allAvailableBuyers[0];
  }, [allAvailableBuyers, selectedBuyerId]);

  // Filtered product suggestions
  const filteredProducts = useMemo(() => {
    if (!productSearchInput.trim()) return [];
    const query = productSearchInput.toLowerCase();
    return products
      .filter((p) => p.name.toLowerCase().includes(query) || (p.code && p.code.toLowerCase().includes(query)))
      .slice(0, 6);
  }, [products, productSearchInput]);

  // Subtotal & Net calculation
  const subTotal = useMemo(() => {
    return quickItems.reduce((acc, it) => {
      const totalPcs = it.qtyCtn * it.pcsPerCtn + it.qtyPcs;
      return acc + Math.round(totalPcs * it.unitPrice);
    }, 0);
  }, [quickItems]);

  const discountAmount = useMemo(() => {
    const val = Number(discountValue) || 0;
    if (discountType === '%') {
      return Math.round((subTotal * val) / 100);
    }
    return val;
  }, [discountValue, discountType, subTotal]);

  const netTotal = useMemo(() => {
    return Math.max(0, subTotal - discountAmount);
  }, [subTotal, discountAmount]);

  // Credit limit calculation
  const creditLimit = selectedBuyer?.creditLimitBDT || 50000;
  const currentOutstanding = selectedBuyer?.outstandingBalanceBDT || 0;
  const projectedDue = currentOutstanding + netTotal;
  const isExceedingCredit = paymentMode === 'Credit (Due)' && projectedDue > creditLimit;
  const overByAmount = Math.max(0, projectedDue - creditLimit);

  // Quick item quantity updates
  const updateItemQty = (id: string, field: 'ctn' | 'pcs' | 'free', val: number) => {
    setQuickItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (field === 'ctn') return { ...item, qtyCtn: Math.max(0, val) };
        if (field === 'pcs') return { ...item, qtyPcs: Math.max(0, val) };
        if (field === 'free') return { ...item, freeQty: Math.max(0, val) };
        return item;
      })
    );
  };

  const updateItemWarehouse = (id: string, whName: string) => {
    const foundWh = allAvailableWarehouses.find((w) => w.name === whName);
    setQuickItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, warehouseName: whName, warehouseId: foundWh?.id || item.warehouseId }
          : item
      )
    );
  };

  const removeItem = (id: string) => {
    setQuickItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSelectProduct = (prod: any) => {
    const pcsPerCtn = 20;
    const unitPrice = prod.distributorPriceBDT || prod.retailPriceBDT || 1500;
    const ctnPrice = unitPrice * pcsPerCtn;

    const newItem: QuickOrderItem = {
      id: `qi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      warehouseId: allAvailableWarehouses[0]?.id || 'wh-1',
      warehouseName: allAvailableWarehouses[0]?.name || 'Dhaka Central Warehouse',
      productId: prod.id,
      productName: prod.name,
      batchNumber: prod.code ? `BT-${prod.code}` : 'BT-202610-001',
      pcsPerCtn,
      stockCtn: Math.max(1, Math.floor((prod.stockQuantity || 200) / pcsPerCtn)),
      stockPcs: prod.stockQuantity || 200,
      unitPrice,
      ctnPrice,
      qtyCtn: 1,
      qtyPcs: 0,
      freeQty: 0,
    };

    setQuickItems((prev) => [...prev, newItem]);
    setProductSearchInput('');
    setShowProductDropdown(false);
  };

  // Step 1: Trigger confirmation modal before saving sales order
  const handleInitiateSale = () => {
    if (!quickItems.length || netTotal <= 0) return;
    setShowConfirmSaleModal(true);
  };

  // Step 2: Confirmed by user -> persist to registry & clean all order input sections
  const handleConfirmAndSaveSale = () => {
    if (!quickItems.length || netTotal <= 0) return;

    const orderItems: SalesOrderItem[] = quickItems.map((it) => {
      const totalUnits = it.qtyCtn * it.pcsPerCtn + it.qtyPcs + it.freeQty;
      const billedUnits = it.qtyCtn * it.pcsPerCtn + it.qtyPcs;
      return {
        productId: it.productId,
        productName: it.productName,
        batchNumber: it.batchNumber,
        quantity: totalUnits,
        unitPriceBDT: it.unitPrice,
        discountBDT: it.freeQty * it.unitPrice,
        lineTotalBDT: Math.round(billedUnits * it.unitPrice),
      };
    });

    const primaryWh = warehouses.find((w) => w.id === quickItems[0]?.warehouseId) || warehouses[0] || {
      id: 'wh-dhaka-1',
      name: quickItems[0]?.warehouseName || 'Central Warehouse',
    };

    const newOrderPayload: Omit<SalesOrder, 'id' | 'orderNumber' | 'status'> = {
      date: orderDate,
      channel: selectedBuyer?.channel || 'Retail Store',
      distributorId: undefined,
      distributorName: undefined,
      customerId: selectedBuyer?.id || 'cust-nasim',
      customerName: selectedBuyer?.name || 'Nasim Store-MEL',
      salespersonId: 'u-1',
      salespersonName: 'Direct POS Invoicing',
      warehouseId: primaryWh.id,
      warehouseName: primaryWh.name,
      items: orderItems,
      subTotalBDT: subTotal,
      discountBDT: discountAmount,
      taxVatBDT: 0,
      netAmountBDT: netTotal,
      paidAmountBDT: paymentMode === 'Credit (Due)' ? 0 : netTotal,
      dueAmountBDT: paymentMode === 'Credit (Due)' ? netTotal : 0,
      paymentMethod: paymentMode,
      paymentStatus: paymentMode === 'Credit (Due)' ? 'Unpaid' : 'Paid',
      notes: orderNote || `Memo #${orderMemoNo} | Payment: ${paymentMode}`,
    };

    createSalesOrder(newOrderPayload);

    // Show success notification
    setSaleSuccessBanner(
      `✔ Sale completed! Order #${orderMemoNo} (BDT ${netTotal.toLocaleString()}) saved into Sales Orders Master Registry.`
    );
    setTimeout(() => {
      setSaleSuccessBanner(null);
    }, 6000);

    // Increment memo number for next order
    const numPart = parseInt(orderMemoNo, 10);
    if (!isNaN(numPart)) {
      setOrderMemoNo(String(numPart + 1));
    } else {
      setOrderMemoNo(`SO-${Date.now().toString().slice(-4)}`);
    }

    // CLEAN ALL INPUT SECTIONS FOR NEXT ORDER
    setQuickItems([]);
    setProductSearchInput('');
    setShowProductDropdown(false);
    setDiscountValue(0);
    setDiscountType('BDT');
    setOrderNote('');
    setPaymentMode('Credit (Due)');
    setCurrentPage(1);

    // Close confirmation modal
    setShowConfirmSaleModal(false);
  };

  // Helper to manually reset/clean all order input fields
  const handleResetOrderInputs = () => {
    setQuickItems([]);
    setProductSearchInput('');
    setShowProductDropdown(false);
    setDiscountValue(0);
    setDiscountType('BDT');
    setOrderNote('');
    setPaymentMode('Credit (Due)');
  };

  // Quick Customer Add submit
  const handleSaveQuickCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustName.trim()) return;

    const newId = `cust-quick-${Date.now().toString().slice(-4)}`;
    if (typeof addCustomer === 'function') {
      addCustomer({
        name: quickCustName.trim(),
        code: `CUST-${Math.floor(100 + Math.random() * 900)}`,
        channel: quickCustChannel as any,
        phone: quickCustPhone.trim() || '+880 1700-000000',
        creditLimitBDT: Number(quickCustCreditLimit) || 50000,
        currentBalanceBDT: 0,
        address: 'Dhaka, Bangladesh',
        division: 'Dhaka Division',
        region: 'Dhaka Region',
        area: 'Dhaka Central',
        territory: 'Dhaka Territory',
        assignedDistributorId: 'dis-1',
        assignedDistributorName: 'Central Distribution',
        category: 'A',
      });
    }

    setSelectedBuyerId(newId);
    setShowQuickAddCustModal(false);
    setQuickCustName('');
    setQuickCustPhone('');
  };

  const handleOpenPayment = (order: SalesOrder) => {
    setShowPaymentModal(order);
    setPayAmount(order.dueAmountBDT || 0);
    setPayRef(`RCT-${Date.now().toString().slice(-4)}`);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaymentModal) return;
    recordOrderPayment(showPaymentModal.id, Number(payAmount), payAccount, payRef);
    setShowPaymentModal(null);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === newCustId);
    const prod = products.find((p) => p.id === newProdId);
    const wh = warehouses.find((w) => w.id === newWhId);
    if (!cust || !prod || !wh) return;

    const pricing = getCustomerProductPricing(cust, prod);
    const unitPrice = pricing.unitPrice;
    const subTotalVal = unitPrice * newQty;
    const taxVat = Math.round(subTotalVal * 0.05);
    const netAmountVal = subTotalVal + taxVat;

    createSalesOrder({
      date: new Date().toISOString().substring(0, 10),
      channel: cust.channel,
      distributorId: cust.assignedDistributorId,
      distributorName: cust.assignedDistributorName,
      customerId: cust.id,
      customerName: cust.name,
      salespersonId: 'u-2',
      salespersonName: 'Tanvir Hossain',
      warehouseId: wh.id,
      warehouseName: wh.name,
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          batchNumber: 'KUS-B2609-001',
          quantity: Number(newQty),
          unitPriceBDT: unitPrice,
          discountBDT: pricing.savingsBDT,
          lineTotalBDT: subTotalVal,
        },
      ],
      offerSavingsBDT: 0,
      subTotalBDT: subTotalVal,
      taxVatBDT: taxVat,
      netAmountBDT: netAmountVal,
      paidAmountBDT: 0,
      dueAmountBDT: netAmountVal,
      paymentMethod: newPaymentMethod,
      notes: `Pricing Tier: ${pricing.tierName}${pricing.isSpecialNegotiated ? ' (Custom Agreement Override)' : ''}`,
    });

    setShowNewOrderModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Sales Orders, Dispatch & Official Invoicing
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              National Distribution Flow
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Order placement ➔ Management Approval ➔ Warehouse Dispatch & Stock Deduction ➔ Invoice Posting & Receivables Ledger.
          </p>
        </div>

        <button
          onClick={() => setShowNewOrderModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Sales Order</span>
        </button>
      </div>

      {/* Sale Success Notification */}
      {saleSuccessBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{saleSuccessBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaleSuccessBanner(null)}
            className="text-emerald-600 hover:text-emerald-800 text-xs font-bold p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIRECT ORDER CAPTURE SECTION (EMBEDDED ON TOP OF MASTER REGISTRY)        */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Top inputs, Item table, and Note input */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-4">
            {/* Top Bar Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
              {/* Memo/Order No */}
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={orderMemoNo}
                  onChange={(e) => setOrderMemoNo(e.target.value)}
                  placeholder="3245"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                  title="Order / Memo No"
                />
              </div>

              {/* Date Input */}
              <div className="sm:col-span-3">
                <div className="relative">
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Customer Selector & Quick Add Button */}
              <div className="sm:col-span-4 flex items-center gap-1.5">
                <select
                  value={selectedBuyerId}
                  onChange={(e) => setSelectedBuyerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-blue-500 truncate"
                  title="Select Customer or Distributor"
                >
                  {allAvailableBuyers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowQuickAddCustModal(true)}
                  className="w-9 h-9 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center shadow-xs transition-colors"
                  title="Quick Add Customer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Product Search & Quick Add Input */}
              <div className="sm:col-span-3 relative">
                <div className="relative">
                  <input
                    type="text"
                    value={productSearchInput}
                    onChange={(e) => {
                      setProductSearchInput(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    placeholder="Type Product Name or Scan..."
                    className="w-full pl-3 pr-8 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
                  />
                  <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* Autocomplete Dropdown */}
                {showProductDropdown && filteredProducts.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-30 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700 max-h-60 overflow-y-auto">
                    {filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        className="p-2.5 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer text-xs flex items-center justify-between transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{p.name}</div>
                          <div className="text-[10px] text-slate-400">{p.code} • Stock: {p.stockQuantity || 200} units</div>
                        </div>
                        <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                          ৳{(p.distributorPriceBDT || p.retailPriceBDT || 1500).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Item & Warehouse Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 font-bold text-[11px] tracking-wide uppercase border-b border-sky-100 dark:border-sky-900/60">
                    <tr>
                      <th className="p-3">ITEM & WAREHOUSE</th>
                      <th className="p-3 text-center">STK</th>
                      <th className="p-3 text-right">PRICE</th>
                      <th className="p-3 text-center">QTY</th>
                      <th className="p-3 text-center">🎁 FREE</th>
                      <th className="p-3 text-right">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                    {quickItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500">
                          No items added. Type a product name or scan above to add to this order.
                        </td>
                      </tr>
                    ) : (
                      quickItems.map((item) => {
                        const totalPcs = item.qtyCtn * item.pcsPerCtn + item.qtyPcs;
                        const lineTotal = Math.round(totalPcs * item.unitPrice);
                        const deductsText =
                          item.qtyCtn > 0 && item.qtyPcs > 0
                            ? `Deducts: ${item.qtyCtn} CTN + ${item.qtyPcs} pcs (${totalPcs})`
                            : item.qtyCtn > 0
                            ? `Deducts: ${item.qtyCtn} CTN (${totalPcs} pcs)`
                            : `Deducts: ${item.qtyPcs} pcs`;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                            {/* Item & Warehouse column */}
                            <td className="p-3">
                              <div className="flex items-start gap-2.5">
                                {/* Warehouse selector pill */}
                                <div className="relative shrink-0 mt-0.5">
                                  <select
                                    value={item.warehouseName}
                                    onChange={(e) => updateItemWarehouse(item.id, e.target.value)}
                                    className="appearance-none bg-blue-100/80 hover:bg-blue-200/80 dark:bg-blue-950 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold rounded-lg pl-2 pr-5 py-1 cursor-pointer focus:outline-hidden transition-colors"
                                  >
                                    {allAvailableWarehouses.map((w) => (
                                      <option key={w.id} value={w.name}>
                                        {w.name}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown className="w-3 h-3 text-blue-600 dark:text-blue-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>

                                {/* Product details */}
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white leading-snug">
                                    {item.productName}
                                  </div>
                                  <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                                    {item.batchNumber} (1 CTN = {item.pcsPerCtn} pcs)
                                  </div>
                                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                    {deductsText}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Stock Column */}
                            <td className="p-3 text-center whitespace-nowrap text-slate-700 dark:text-slate-300 font-semibold">
                              {item.stockCtn} CTN ({item.stockPcs} pcs)
                            </td>

                            {/* Price Column */}
                            <td className="p-3 text-right whitespace-nowrap">
                              <div className="font-bold text-slate-900 dark:text-white font-mono">
                                ৳{item.unitPrice.toFixed(2)}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                (৳{item.ctnPrice}/CTN)
                              </div>
                            </td>

                            {/* QTY Column (CTN & PCS steppers with NO native browser up/down arrows) */}
                            <td className="p-3 whitespace-nowrap">
                              <div className="flex items-center gap-2 justify-center">
                                {/* CTN Stepper */}
                                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                                  <button
                                    type="button"
                                    onClick={() => updateItemQty(item.id, 'ctn', item.qtyCtn - 1)}
                                    className="w-5 h-6 flex items-center justify-center text-rose-600 font-bold hover:bg-rose-50 dark:hover:bg-rose-950 text-xs transition-colors"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={item.qtyCtn}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/\D/g, '');
                                      updateItemQty(item.id, 'ctn', val === '' ? 0 : parseInt(val, 10));
                                    }}
                                    className="w-7 h-6 text-center text-xs font-bold text-slate-800 dark:text-slate-100 border-x border-slate-200 dark:border-slate-700 bg-transparent focus:outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateItemQty(item.id, 'ctn', item.qtyCtn + 1)}
                                    className="w-5 h-6 flex items-center justify-center text-emerald-600 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950 text-xs transition-colors"
                                  >
                                    +
                                  </button>
                                </div>

                                {/* Middle CTN badge */}
                                <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-md font-mono font-bold border border-blue-100 dark:border-blue-900/60">
                                  CTN = {totalPcs} pcs
                                </span>

                                {/* PCS Stepper */}
                                <div className="flex items-center gap-1">
                                  <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                                    <button
                                      type="button"
                                      onClick={() => updateItemQty(item.id, 'pcs', item.qtyPcs - 1)}
                                      className="w-5 h-6 flex items-center justify-center text-rose-600 font-bold hover:bg-rose-50 dark:hover:bg-rose-950 text-xs transition-colors"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      value={item.qtyPcs}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        updateItemQty(item.id, 'pcs', val === '' ? 0 : parseInt(val, 10));
                                      }}
                                      className="w-7 h-6 text-center text-xs font-bold text-slate-800 dark:text-slate-100 border-x border-slate-200 dark:border-slate-700 bg-transparent focus:outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => updateItemQty(item.id, 'pcs', item.qtyPcs + 1)}
                                      className="w-5 h-6 flex items-center justify-center text-emerald-600 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950 text-xs transition-colors"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <span className="text-[10px] text-slate-500 font-medium">PCS</span>
                                </div>
                              </div>
                            </td>

                            {/* Free Items Column */}
                            <td className="p-3 text-center whitespace-nowrap">
                              <div className="inline-flex items-center border border-dashed border-emerald-400 dark:border-emerald-600 rounded-lg overflow-hidden bg-emerald-50/50 dark:bg-emerald-950/30">
                                <button
                                  type="button"
                                  onClick={() => updateItemQty(item.id, 'free', item.freeQty - 1)}
                                  className="w-4 h-6 flex items-center justify-center text-rose-600 font-bold hover:bg-rose-100/50 text-xs transition-colors"
                                >
                                  -
                                </button>
                                <span className="w-5 h-6 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                  {item.freeQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateItemQty(item.id, 'free', item.freeQty + 1)}
                                  className="w-4 h-6 flex items-center justify-center text-emerald-600 font-bold hover:bg-emerald-100/50 text-xs transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            {/* Line Total & Remove */}
                            <td className="p-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <span className="font-extrabold text-xs text-slate-900 dark:text-white font-mono">
                                  ৳{lineTotal.toLocaleString()}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 p-1 rounded transition-colors"
                                  title="Remove Line"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Note Input */}
            <div>
              <input
                type="text"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Add a note or remark for this sale (Optional)..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          {/* Right Column: Checkout Panel */}
          <div className="lg:col-span-4 xl:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Checkout</h2>

            {/* Subtotal */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Subtotal</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                ৳ {subTotal.toLocaleString()}
              </span>
            </div>

            {/* Discount */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Discount</span>
              <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
                <input
                  type="number"
                  min={0}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-16 px-2 py-1 text-right text-xs font-bold text-slate-800 dark:text-slate-100 bg-transparent focus:outline-hidden"
                />
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as 'BDT' | '%')}
                  className="bg-slate-100 dark:bg-slate-700 border-l border-slate-300 dark:border-slate-700 px-1.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                >
                  <option value="BDT">৳</option>
                  <option value="%">%</option>
                </select>
              </div>
            </div>

            {/* Big Net Payable Total Box */}
            <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 rounded-2xl py-6 px-4 text-center">
              <div className="text-4xl font-extrabold text-blue-700 dark:text-blue-300 font-mono tracking-tight">
                {netTotal.toLocaleString()}
              </div>
            </div>

            {/* Payment Mode Selector */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Payment Mode
              </label>
              <div className="relative">
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-blue-500 cursor-pointer"
                >
                  <option value="Credit (Due)">Credit (Due)</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer / MFS">Bank Transfer / MFS</option>
                  <option value="Partial Advance">Partial Advance</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Credit Limit Alert Box */}
            {isExceedingCredit && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl p-3 text-xs animate-in fade-in">
                <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  <span>SALE EXCEEDS CREDIT LIMIT!</span>
                </div>
                <p className="text-[11px] text-rose-600 dark:text-rose-300 mt-1 leading-relaxed">
                  Limit: ৳{creditLimit.toLocaleString()} | Projected Due: ৳{projectedDue.toLocaleString()}{' '}
                  <span className="font-semibold text-rose-700 dark:text-rose-200">
                    (Over by ৳{overByAmount.toLocaleString()})
                  </span>
                </p>
              </div>
            )}

            {!isExceedingCredit && paymentMode === 'Credit (Due)' && creditLimit > 0 && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl p-2.5 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                <span>Credit Limit: ৳{creditLimit.toLocaleString()}</span>
                <span className="font-semibold">Available: ৳{Math.max(0, creditLimit - projectedDue).toLocaleString()}</span>
              </div>
            )}

            {/* Complete Sale Button */}
            <div className="flex items-center gap-2">
              {quickItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetOrderInputs}
                  className="px-3.5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-xs font-semibold cursor-pointer shrink-0"
                  title="Clear all inputs for this order"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={handleInitiateSale}
                disabled={quickItems.length === 0 || netTotal <= 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Sale</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">Sales Orders Master Registry</h2>
            <span className="text-[11px] bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-semibold px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/60">
              15 Rows / Page
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Page {currentPage} of {totalPages} • {salesOrders.length} Orders in Record
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Order No & Date</th>
                <th className="p-3">Customer / Distributor</th>
                <th className="p-3">Warehouse Hub</th>
                <th className="p-3">Ordered Batteries</th>
                <th className="p-3 text-right">Net Amount BDT</th>
                <th className="p-3 text-right">Due Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {paginatedSalesOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    No sales orders recorded yet.
                  </td>
                </tr>
              ) : (
                paginatedSalesOrders.map((so) => (
                  <tr key={so.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3">
                      <div className="font-mono font-bold text-blue-600 dark:text-blue-400">{so.orderNumber}</div>
                      <div className="text-[10px] text-slate-400">{so.date}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{so.customerName}</div>
                      <div className="text-[10px] text-slate-400">{so.channel}</div>
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{so.warehouseName}</td>
                    <td className="p-3">
                      {so.items.map((i, idx) => (
                        <div key={idx} className="truncate max-w-xs">
                          {i.quantity}x {i.productName}
                        </div>
                      ))}
                    </td>
                    <td className="p-3 font-mono text-right font-black text-slate-900 dark:text-white">
                      ৳ {so.netAmountBDT.toLocaleString()}
                    </td>
                    <td className="p-3 font-mono text-right font-bold text-amber-600 dark:text-amber-400">
                      ৳ {so.dueAmountBDT.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          so.status === 'Invoiced'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : so.status === 'Approved' || so.status === 'Dispatched'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {so.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrderForInvoice(so)}
                          className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                          title="View Official Tax Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {so.status === 'Submitted' && (
                          <button
                            onClick={() => approveSalesOrder(so.id)}
                            className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[10px] cursor-pointer"
                          >
                            Approve
                          </button>
                        )}

                        {(so.status === 'Approved' || so.status === 'Dispatched') && (
                          <button
                            onClick={() => dispatchAndInvoiceSalesOrder(so.id)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] cursor-pointer"
                            title="Dispatch & Post Invoice: Atomically deducts warehouse inventory and updates customer receivable ledger"
                          >
                            Dispatch & Invoice
                          </button>
                        )}

                        {so.dueAmountBDT > 0 && so.status === 'Invoiced' && (
                          <button
                            onClick={() => handleOpenPayment(so)}
                            className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[10px] cursor-pointer"
                          >
                            Record Payment
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {salesOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {Math.min(currentPage * pageSize, salesOrders.length)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {salesOrders.length}
            </span>{' '}
            orders
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition-colors font-medium cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              if (
                totalPages > 7 &&
                pageNum !== 1 &&
                pageNum !== totalPages &&
                Math.abs(pageNum - currentPage) > 2
              ) {
                if (pageNum === 2 || pageNum === totalPages - 1) {
                  return (
                    <span key={pageNum} className="px-1 text-slate-400">
                      ...
                    </span>
                  );
                }
                return null;
              }

              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-colors cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition-colors font-medium cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Official Tax Invoice Presentation */}
      {selectedOrderForInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5 text-xs text-slate-800 dark:text-slate-100">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                  ENSEC BANGLADESH LIMITED
                </div>
                <p className="text-[11px] text-slate-500">
                  National Distributor of Lithium Batteries • Bangladesh
                </p>
                <p className="text-[10px] text-slate-400">
                  Plot 128 Tejgaon Industrial Area, Dhaka-1208 • Phone: +880 2 9887766
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  COMMERCIAL TAX INVOICE
                </span>
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                  {selectedOrderForInvoice.orderNumber}
                </span>
                <div className="text-[10px] text-slate-500">Date: {selectedOrderForInvoice.date}</div>
              </div>
            </div>

            {/* Bill To & Dispatch info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Billed To / Customer:
                </span>
                <div className="font-bold text-slate-900 dark:text-white">
                  {selectedOrderForInvoice.customerName}
                </div>
                <div className="text-slate-500">{selectedOrderForInvoice.channel}</div>
                {selectedOrderForInvoice.distributorName && (
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">
                    Via DB: {selectedOrderForInvoice.distributorName}
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Dispatch Warehouse & Logistics:
                </span>
                <div className="font-bold text-slate-900 dark:text-white">
                  {selectedOrderForInvoice.warehouseName}
                </div>
                <div className="text-slate-500">Salesperson: {selectedOrderForInvoice.salespersonName}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  Payment Terms: {selectedOrderForInvoice.paymentMethod}
                </div>
              </div>
            </div>

            {/* Invoice Line Items */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold border-b border-slate-200 dark:border-slate-800 text-left">
                  <tr>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5">Batch</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Unit Rate (BDT)</th>
                    <th className="p-2.5 text-right">Total (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {selectedOrderForInvoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5">{item.productName}</td>
                      <td className="p-2.5 font-mono text-[10px] text-purple-600">
                        {item.batchNumber || 'KUS-B2609-001'}
                      </td>
                      <td className="p-2.5 text-center font-bold font-mono">{item.quantity}</td>
                      <td className="p-2.5 font-mono text-right">৳ {item.unitPriceBDT.toLocaleString()}</td>
                      <td className="p-2.5 font-mono text-right font-bold">
                        ৳ {item.lineTotalBDT.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>৳ {selectedOrderForInvoice.subTotalBDT.toLocaleString()}</span>
                </div>
                {selectedOrderForInvoice.offerSavingsBDT > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount / Promo:</span>
                    <span>-৳ {selectedOrderForInvoice.offerSavingsBDT.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>VAT / Tax (5%):</span>
                  <span>৳ {selectedOrderForInvoice.taxVatBDT.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-black text-sm text-slate-900 dark:text-white">
                  <span>Net Payable:</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    ৳ {selectedOrderForInvoice.netAmountBDT.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Amount Paid:</span>
                  <span>৳ {selectedOrderForInvoice.paidAmountBDT.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-amber-600">
                  <span>Due Balance:</span>
                  <span>৳ {selectedOrderForInvoice.dueAmountBDT.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Footer & Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
              <span>Authorized Signature: Engr. Sohidul Islam (CTO)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedOrderForInvoice(null)}
                  className="px-4 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Record Payment against Order */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Record Payment Collection
              </h3>
              <button onClick={() => setShowPaymentModal(null)} className="font-bold text-slate-400">✕</button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div>
                <span className="text-slate-500 block">Customer:</span>
                <span className="font-bold text-slate-900 dark:text-white">{showPaymentModal.customerName}</span>
                <div className="text-[11px] text-amber-600 font-mono mt-0.5">
                  Invoice Due: ৳ {showPaymentModal.dueAmountBDT.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Collection Amount (BDT)
                </label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-base"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Deposit Into Cash / Bank Account
                </label>
                <select
                  value={payAccount}
                  onChange={(e) => setPayAccount(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="Head Office Cash">Head Office Cash</option>
                  <option value="Warehouse Cash">Warehouse Cash (Tejgaon)</option>
                  <option value="City Bank PLC">City Bank PLC (Corporate A/C)</option>
                  <option value="Eastern Bank PLC">Eastern Bank PLC</option>
                  <option value="Islami Bank Bangladesh">Islami Bank Bangladesh</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Receipt / Bank Reference No
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(null)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                >
                  Post Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Sales Order Desk */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Create Sales Order</h3>
              <button onClick={() => setShowNewOrderModal(false)} className="font-bold text-slate-400">✕</button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Select Customer
                </label>
                <select
                  value={newCustId}
                  onChange={(e) => setNewCustId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.channel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Dispatch Warehouse Hub
                </label>
                <select
                  value={newWhId}
                  onChange={(e) => setNewWhId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (Stock: {w.currentStockUnits} units)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Battery Model
                  </label>
                  <select
                    value={newProdId}
                    onChange={(e) => setNewProdId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Order Quantity
                  </label>
                  <input
                    type="number"
                    value={newQty}
                    onChange={(e) => setNewQty(Math.max(1, Number(e.target.value)))}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Live Customer Channel Price Resolution Card */}
              {(() => {
                const modalCust = customers.find((c) => c.id === newCustId) || customers[0];
                const modalProd = products.find((p) => p.id === newProdId) || products[0];
                const modalPricing = getCustomerProductPricing(modalCust, modalProd);
                const modalSubtotal = modalPricing.unitPrice * newQty;
                const modalVat = Math.round(modalSubtotal * 0.05);
                const modalTotal = modalSubtotal + modalVat;

                return (
                  <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="font-bold text-xs text-purple-950 dark:text-purple-200">
                          Channel Pricing Applied
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-200">
                        {modalPricing.tierName}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-purple-200/60 dark:border-purple-800/60">
                      <div>
                        <span className="text-slate-500 block">Customer Channel:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {modalCust?.channel} ({modalCust?.customerType})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Unit Price:</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ৳ {modalPricing.unitPrice.toLocaleString()} / unit
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">MRP Baseline:</span>
                        <span className="font-mono text-slate-500 line-through">
                          ৳ {modalPricing.baseRetailPrice.toLocaleString()}
                        </span>{' '}
                        <span className="text-[10px] text-emerald-600 font-semibold">
                          (Save ৳ {modalPricing.savingsBDT.toLocaleString()})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Order Total (+5% VAT):</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          ৳ {modalTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {modalPricing.isSpecialNegotiated && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Special client contract override applied over standard channel tier.</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Book Sales Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Customer Modal */}
      {showQuickAddCustModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Quick Add Customer / Retailer
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAddCustModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuickCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Customer / Retailer Name *
                </label>
                <input
                  type="text"
                  required
                  value={quickCustName}
                  onChange={(e) => setQuickCustName(e.target.value)}
                  placeholder="e.g. Nasim Store-MEL or M/S Rahim Traders"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Channel / Category
                  </label>
                  <select
                    value={quickCustChannel}
                    onChange={(e) => setQuickCustChannel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    <option value="Retail Store">Retail Store</option>
                    <option value="Dealership">Dealership</option>
                    <option value="Direct Fleet / Corporate">Corporate</option>
                    <option value="End Customer">End Customer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={quickCustPhone}
                    onChange={(e) => setQuickCustPhone(e.target.value)}
                    placeholder="+880 1711-..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Credit Limit (BDT)
                </label>
                <input
                  type="number"
                  min={0}
                  value={quickCustCreditLimit}
                  onChange={(e) => setQuickCustCreditLimit(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuickAddCustModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMATION BEFORE SAVING ORDER TO SALES ORDERS MASTER REGISTRY   */}
      {/* ========================================================================= */}
      {showConfirmSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-850 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Confirm Sales Order Before Saving
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Review order details and items before committing to the registry
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmSaleModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Order Key Information Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Memo / Order No</span>
                  <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">#{orderMemoNo}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Date</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{orderDate}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Customer</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block" title={selectedBuyer?.name}>
                    {selectedBuyer?.name}
                  </span>
                  <span className="text-[10px] text-slate-400">({selectedBuyer?.channel})</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Payment Terms</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{paymentMode}</span>
                </div>
              </div>

              {/* Items Summary Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="bg-slate-100/70 dark:bg-slate-800 px-4 py-2 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span>Order Items ({quickItems.length} Products)</span>
                  <span className="text-[11px] text-slate-500 font-normal">Hub: {quickItems[0]?.warehouseName}</span>
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5">Product</th>
                      <th className="p-2.5 text-center">CTN</th>
                      <th className="p-2.5 text-center">PCS</th>
                      <th className="p-2.5 text-center">Total Pcs</th>
                      <th className="p-2.5 text-center">🎁 Free</th>
                      <th className="p-2.5 text-right">Amount (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {quickItems.map((it) => {
                      const totalPcs = it.qtyCtn * it.pcsPerCtn + it.qtyPcs;
                      const lineTotal = Math.round(totalPcs * it.unitPrice);
                      return (
                        <tr key={it.id}>
                          <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                            {it.productName}
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-700 dark:text-slate-300">{it.qtyCtn}</td>
                          <td className="p-2.5 text-center font-bold text-slate-700 dark:text-slate-300">{it.qtyPcs}</td>
                          <td className="p-2.5 text-center font-mono font-bold text-blue-600 dark:text-blue-400">{totalPcs} pcs</td>
                          <td className="p-2.5 text-center text-emerald-600 font-bold">{it.freeQty > 0 ? `+${it.freeQty}` : '-'}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                            ৳{lineTotal.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Gross Subtotal</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">৳{subTotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount ({discountType === '%' ? `${discountValue}%` : `BDT ${discountValue}`})</span>
                    <span className="font-mono font-bold">- ৳{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex items-center justify-between text-sm">
                  <span className="font-extrabold text-slate-900 dark:text-white">Net Payable Amount</span>
                  <span className="font-mono font-black text-base text-emerald-600 dark:text-emerald-400">
                    ৳{netTotal.toLocaleString()}
                  </span>
                </div>
                {orderNote && (
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Note:</span> {orderNote}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmSaleModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Back / Edit Order
              </button>
              <button
                type="button"
                onClick={handleConfirmAndSaveSale}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Yes, Confirm & Save Order</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
