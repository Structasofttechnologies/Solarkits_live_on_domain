import { useState, useEffect } from 'react';
import axiosInstance from '@/utils/axiosInstance';
import { FiCheckCircle, FiUploadCloud, FiClock, FiXCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function EpcPoAllocations() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/india/v1/shop/po-allocations');
      if (res.data?.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load PO allocations');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (poId) => {
    if (!receiptFile) {
      toast.error('Please select a receipt file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('files', receiptFile);

    setUploading(true);
    try {
      const res = await axiosInstance.post(`/india/v1/shop/po-allocations/${poId}/upload-receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        toast.success('Receipt uploaded successfully');
        setReceiptFile(null);
        setSelectedOrder(null);
        fetchAllocations();
      } else {
        toast.error(res.data?.message || 'Failed to upload receipt');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload receipt');
    } finally {
      setUploading(false);
    }
  };

  const StatusBadge = ({ status }) => {
    const map = {
      PENDING: { color: 'bg-amber-100 text-amber-700', icon: <FiClock className="mr-1 inline" /> },
      RECEIPT_SUBMITTED: { color: 'bg-blue-100 text-blue-700', icon: <FiUploadCloud className="mr-1 inline" /> },
      VERIFIED: { color: 'bg-green-100 text-green-700', icon: <FiCheckCircle className="mr-1 inline" /> },
    };
    const { color, icon } = map[status] || { color: 'bg-gray-100 text-gray-700', icon: <FiClock className="mr-1 inline" /> };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {icon}
        {status?.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900">Purchase Orders (Franchise Allocated)</h2>
        <p className="text-sm text-slate-500 mt-1">
          Pay for the inventory allocated to you by your franchise partner.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <FiCheckCircle className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-2 text-sm font-semibold text-slate-900">No Allocations</h3>
          <p className="mt-1 text-sm text-slate-500">You don't have any pending PO allocations from your franchisee.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => {
            // Find allocation for this EPC (assuming backend filters it, but just to be safe and extract properties)
            let epcAlloc = null;
            let allocatedItem = null;
            order.items?.forEach(item => {
              item.epc_allocations?.forEach(alloc => {
                // Simplified matching, assuming backend only returned orders with allocations for the current user
                epcAlloc = alloc;
                allocatedItem = item;
              });
            });

            if (!epcAlloc) return null;

            const amountToPay = (allocatedItem.unit_price_paise * epcAlloc.allocated_quantity) / 100;
            const taxToPay = (allocatedItem.tax_paise * epcAlloc.allocated_quantity) / 100;
            const totalToPay = amountToPay + taxToPay;

            return (
              <div key={order._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-200 p-4 bg-slate-50 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">PO Number</p>
                    <p className="text-sm font-bold text-slate-900">{order.po_number}</p>
                  </div>
                  <div>
                    <StatusBadge status={epcAlloc.payment_status} />
                  </div>
                </div>
                
                <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Item Details</h4>
                    <p className="text-sm text-slate-700">{allocatedItem.item_name}</p>
                    <p className="text-sm text-slate-500 mt-1">Quantity Allocated: <span className="font-medium text-slate-900">{epcAlloc.allocated_quantity}</span></p>
                    
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                      <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">Franchisee Info</h4>
                      <p className="text-sm font-medium">{order.franchisee_id?.business_name}</p>
                      <p className="text-xs text-slate-500">{order.franchisee_id?.mobile} | {order.franchisee_id?.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Base Amount</span>
                      <span className="font-medium">₹{amountToPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-slate-600">Tax</span>
                      <span className="font-medium">₹{taxToPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-indigo-200 mb-4">
                      <span className="font-semibold text-slate-900">Total Payable</span>
                      <span className="text-xl font-bold text-indigo-700">₹{totalToPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>

                    {epcAlloc.payment_status === 'PENDING' && (
                      <div className="mt-auto">
                        {selectedOrder === order._id ? (
                          <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-200">
                            <label className="block text-xs font-medium text-slate-700">Upload Bank Transfer Receipt</label>
                            <input 
                              type="file" 
                              accept="image/*,.pdf"
                              onChange={(e) => setReceiptFile(e.target.files[0])}
                              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpload(order._id)}
                                disabled={uploading}
                                className="flex-1 bg-indigo-600 text-white py-1.5 px-3 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                              >
                                {uploading ? 'Uploading...' : 'Submit Receipt'}
                              </button>
                              <button
                                onClick={() => { setSelectedOrder(null); setReceiptFile(null); }}
                                className="px-3 py-1.5 rounded-md text-slate-600 border border-slate-300 text-sm font-medium hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setSelectedOrder(order._id)}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                          >
                            <FiUploadCloud />
                            Upload Payment Receipt
                          </button>
                        )}
                      </div>
                    )}
                    
                    {epcAlloc.payment_notes && epcAlloc.payment_status === 'PENDING' && (
                      <div className="mt-3 p-2 bg-red-50 text-red-700 text-xs rounded-md border border-red-100 flex items-start gap-1">
                        <FiXCircle className="mt-0.5 shrink-0" />
                        <span>Rejection Note: {epcAlloc.payment_notes}</span>
                      </div>
                    )}
                    
                    {epcAlloc.payment_receipt_url && epcAlloc.payment_status !== 'PENDING' && (
                      <div className="mt-4 text-center">
                        <a 
                          href={process.env.REACT_APP_API_BASE_URL + epcAlloc.payment_receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 underline"
                        >
                          View Submitted Receipt
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
