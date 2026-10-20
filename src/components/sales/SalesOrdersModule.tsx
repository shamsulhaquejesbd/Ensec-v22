import React, { useState } from 'react';
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
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { SalesOrder, CashBookEntry, getCustomerProductPricing } from '../../types/erp.ts';

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
  } = useERP();

  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<SalesOrder | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<SalesOrder | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);

  // Payment collection form
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payAccount, setPayAccount] = useState<CashBookEntry['accountType']>('City Bank PLC');
  const [payRef, setPayRef] = useState('');

  // New Sales Order Form
  const [newCustId, setNewCustId] = useState(customers[0]?.id || '');
  const [newWhId, setNewWhId] = useState(warehouses[1]?.id || warehouses[0]?.id || '');
  const [newProdId, setNewProdId] = useState(products[0]?.id || '');
  const [newQty, setNewQty] = useState(10);
  const [newPaymentMethod, setNewPaymentMethod] = useState<SalesOrder['paymentMethod']>('Credit');

  const handleOpenPayment = (order: SalesOrder) => {
    setShowPaymentModal(order);
    setPayAmount(order.dueAmountBDT);
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

    // Resolve exact price based on customer's channel & special agreement overrides
    const pricing = getCustomerProductPricing(cust, prod);
    const unitPrice = pricing.unitPrice;
    const subTotal = unitPrice * newQty;
    const taxVat = Math.round(subTotal * 0.05);
    const netAmount = subTotal + taxVat;

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
          lineTotalBDT: subTotal,
        },
      ],
      offerSavingsBDT: 0,
      subTotalBDT: subTotal,
      taxVatBDT: taxVat,
      netAmountBDT: netAmount,
      paidAmountBDT: 0,
      dueAmountBDT: netAmount,
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

      {/* Orders Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900 dark:text-white">Sales Orders Master Registry</h2>
          <span className="text-xs text-slate-500">{salesOrders.length} Orders in Record</span>
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
              {salesOrders.map((so) => (
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
                        className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        title="View Official Tax Invoice"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {so.status === 'Submitted' && (
                        <button
                          onClick={() => approveSalesOrder(so.id)}
                          className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[10px]"
                        >
                          Approve
                        </button>
                      )}

                      {(so.status === 'Approved' || so.status === 'Dispatched') && (
                        <button
                          onClick={() => dispatchAndInvoiceSalesOrder(so.id)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px]"
                          title="Dispatch & Post Invoice: Atomically deducts warehouse inventory and updates customer receivable ledger"
                        >
                          Dispatch & Invoice
                        </button>
                      )}

                      {so.dueAmountBDT > 0 && so.status === 'Invoiced' && (
                        <button
                          onClick={() => handleOpenPayment(so)}
                          className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[10px]"
                        >
                          Record Payment
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  );
};
