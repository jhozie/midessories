'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter,
  MoreVertical,
  Truck,
  Package,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  X,
  RefreshCcw,
  MessageSquare,
  Send
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  updateDoc,
  doc,
  query,
  orderBy,
  where,
  addDoc
} from 'firebase/firestore';
import { Order } from '@/types/order';
import React from 'react';
import { STATUS_COLORS, STATUS_ICONS } from '@/utils/constants';

interface RefundData {
  amount: number;
  reason: string;
  date: Date;
}

interface Message {
  id: string;
  text: string;
  sender: 'admin' | 'customer';
  createdAt: Date;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [showMessages, setShowMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          amount: data.amount || 0,
          customerEmail: data.customerEmail || '',
          customerPhone: data.customerPhone || '',
          items: data.items || [],
          payment: {
            method: data.payment?.method || '',
            status: data.payment?.status || 'pending',
            reference: data.payment?.reference || ''
          },
          shipping: {
            address: {
              address: data.shipping?.address?.address || '',
              city: data.shipping?.address?.city || '',
              firstName: data.shipping?.address?.firstName || '',
              lastName: data.shipping?.address?.lastName || '',
              state: data.shipping?.address?.state || ''
            },
            cost: data.shipping?.cost || 0,
            location: data.shipping?.location || '',
            method: data.shipping?.method || '',
            status: data.shipping?.status || 'pending'
          },
          status: data.status || 'pending',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          userId: data.userId || ''
        } as Order;
      });
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefund(orderId: string) {
    if (!refundAmount || !refundReason) return;
    
    try {
      const refundData: RefundData = {
        amount: parseFloat(refundAmount),
        reason: refundReason,
        date: new Date()
      };

      await updateDoc(doc(db, 'orders', orderId), {
        'payment.status': 'refunded',
        refund: refundData,
        updatedAt: new Date()
      });

      setIsRefunding(false);
      setRefundAmount('');
      setRefundReason('');
      fetchOrders();
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Error processing refund');
    }
  }

  async function handleSendMessage(orderId: string) {
    if (!newMessage.trim()) return;

    try {
      const messageData: Omit<Message, 'id'> = {
        text: newMessage,
        sender: 'admin',
        createdAt: new Date()
      };

      const messagesRef = collection(db, 'orders', orderId, 'messages');
      await addDoc(messagesRef, messageData);
      
      setNewMessage('');
      const snapshot = await getDocs(query(messagesRef, orderBy('createdAt', 'desc')));
      setMessages(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[]);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    }
  }

  useEffect(() => {
    if (selectedOrder && showMessages) {
      const fetchMessages = async () => {
        const snapshot = await getDocs(
          query(collection(db, 'orders', selectedOrder.id, 'messages'), 
          orderBy('createdAt', 'desc'))
        );
        setMessages(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Message[]);
      };
      fetchMessages();
    }
  }, [selectedOrder, showMessages]);

  async function updateOrderStatus(orderId: string, status: Order['status']) {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status,
        updatedAt: new Date()
      });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status');
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || (
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${order.shipping.address.firstName} ${order.shipping.address.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      {/* Header with search and filters */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Order['status'] | 'all')}
            className="px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-4 px-6 font-medium">Order</th>
                <th className="text-left py-4 px-6 font-medium">Customer</th>
                <th className="text-left py-4 px-6 font-medium">Status</th>
                <th className="text-left py-4 px-6 font-medium">Total</th>
                <th className="text-left py-4 px-6 font-medium">Date</th>
                <th className="py-4 px-6"></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium">{order.id}</div>
                      <div className="text-sm text-gray-500">{order.items?.length || 0} items</div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium">
                        {order.shipping.address.firstName} {order.shipping.address.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{order.customerEmail}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${STATUS_COLORS[order.status]}`}>
                      {STATUS_ICONS[order.status] && React.createElement(STATUS_ICONS[order.status], { className: "w-4 h-4" })}
                      <span className="capitalize">{order.status}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-medium">
                    ₦{(order.amount || 0).toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-gray-500">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsModalOpen(true);
                      }}
                      className="p-2 hover:bg-gray-50 rounded-lg"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Order #{selectedOrder.id}</h2>
                <p className="text-sm text-gray-500">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowMessages(prev => !prev)}
                  className="p-2 hover:bg-gray-50 rounded-lg text-gray-600"
                  title="Messages"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsRefunding(true)}
                  className="p-2 hover:bg-gray-50 rounded-lg text-gray-600"
                  title="Refund"
                  disabled={selectedOrder.payment.status === 'refunded'}
                >
                  <RefreshCcw className="w-5 h-5" />
                </button>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value as Order['status'])}
                  className="px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-50 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* I'll continue with the refund modal and messages UI in the next message */}
          </div>
        </div>
      )}
    </div>
  );
} 