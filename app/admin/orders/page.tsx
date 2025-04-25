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
  addDoc,
  getDoc
} from 'firebase/firestore';
import { Order } from '@/types/order';
import React from 'react';
import { STATUS_COLORS, STATUS_ICONS } from '@/utils/constants';
import { 
  triggerShippingConfirmationEmail, 
  triggerOrderDeliveredEmail,
  triggerOrderCanceledEmail,
  triggerRefundEmail,
  triggerOrderConfirmationEmail
} from '@/lib/emailTriggers';

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

interface TrackingInfo {
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: string;
  trackingUrl: string;
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
      console.log('Fetched orders with emails:', ordersData.map(o => o.customerEmail));
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: Order['status']) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      
      // Update the order status in Firestore
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date()
      });

      // If we have a selected order, update it in state
      if (selectedOrder && selectedOrder.id === orderId) {
        const updatedOrder = { ...selectedOrder, status: newStatus };
        setSelectedOrder(updatedOrder);
        
        // Prepare user data for email with fallback
        const userEmail = updatedOrder.customerEmail || 'missing@email.com';
        console.log('Customer email:', userEmail); // Debug log
        
        const user = {
          email: userEmail,
          firstName: updatedOrder.shipping.address.firstName || 'Customer',
          lastName: updatedOrder.shipping.address.lastName || ''
        };

        // Send appropriate email based on new status
        if (newStatus === 'shipped') {
          // Create tracking info
          const trackingNumber = `TRK${Math.floor(Math.random() * 1000000)}`;
          
          // Create tracking info using the pre-defined number
          const trackingInfo: TrackingInfo = {
            trackingNumber,
            carrier: 'Midessories Delivery',
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            trackingUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/track?number=${trackingNumber}`
          };
          
          // Update order with tracking info
          await updateDoc(orderRef, {
            'shipping.tracking': trackingInfo,
            'shipping.status': 'shipped'
          });
          
          // Create email payload
          const emailPayload = {
            to: user.email,
            templateName: 'shippingConfirmation',
            data: {
              orderId: updatedOrder.id,
              customerName: `${user.firstName} ${user.lastName}`,
              trackingNumber: trackingInfo.trackingNumber,
              carrier: trackingInfo.carrier,
              estimatedDelivery: trackingInfo.estimatedDelivery,
              trackingUrl: trackingInfo.trackingUrl,
              items: updatedOrder.items.map((item: any) => ({
                name: item.name || 'Product',
                quantity: item.quantity || 1
              })),
              orderUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/account?tab=orders&order=${updatedOrder.id}`
            }
          };
          
          console.log('Sending email with payload:', JSON.stringify(emailPayload));
          
          // Send shipping confirmation email via API
          try {
            const response = await fetch('/api/email/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(emailPayload),
            });

            const responseText = await response.text();
            console.log('API response text:', responseText);
            
            const responseData = responseText ? JSON.parse(responseText) : {};
            
            if (!response.ok) {
              console.error('Email API error response:', responseData);
              throw new Error(`Email API error: ${JSON.stringify(responseData)}`);
            } else {
              console.log('Email sent successfully:', responseData);
            }
          } catch (emailError) {
            console.error('Error sending shipping confirmation email:', emailError);
          }
        } 
        else if (newStatus === 'delivered') {
          // Send delivery confirmation email via API
          try {
            // Create email payload with explicit email field
            const emailPayload = {
              to: user.email, // Make sure this is set
              templateName: 'orderDelivered',
              data: {
                orderId: updatedOrder.id,
                customerName: `${user.firstName} ${user.lastName}`,
                items: updatedOrder.items.map((item: any) => ({
                  name: item.name || 'Product',
                  quantity: item.quantity || 1
                })),
                orderUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/account?tab=orders&order=${updatedOrder.id}`,
                reviewUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/review?order=${updatedOrder.id}`
              }
            };
            
            console.log('Sending delivery email with payload:', JSON.stringify(emailPayload));
            
            const response = await fetch('/api/email/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(emailPayload),
            });

            const responseText = await response.text();
            console.log('API response text:', responseText);
            
            const responseData = responseText ? JSON.parse(responseText) : {};
            
            if (!response.ok) {
              console.error('Email API error response:', responseData);
              throw new Error(`Email API error: ${JSON.stringify(responseData)}`);
            } else {
              console.log('Email sent successfully:', responseData);
            }
          } catch (emailError) {
            console.error('Error sending delivery confirmation email:', emailError);
          }
        }
        else if (newStatus === 'cancelled') {
          // Send cancellation email via API
          try {
            await fetch('/api/email/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: user.email,
                templateName: 'orderCanceled',
                data: {
                  orderId: updatedOrder.id,
                  customerName: `${user.firstName} ${user.lastName}`,
                  cancellationReason: 'Order cancelled by administrator',
                  items: updatedOrder.items.map((item: any) => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: `₦${(item.price * item.quantity).toLocaleString()}`
                  })),
                  total: `₦${updatedOrder.amount.toLocaleString()}`,
                  refundAmount: updatedOrder.payment.status === 'paid' ? `₦${updatedOrder.amount.toLocaleString()}` : 'N/A',
                  supportEmail: 'support@midessories.com'
                }
              }),
            });
          } catch (emailError) {
            console.error('Error sending cancellation email:', emailError);
          }
        }
        else if (newStatus === 'processing') {
          // Optionally send a processing notification
          try {
            await fetch('/api/email/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: user.email,
                templateName: 'orderProcessing',
                data: {
                  orderId: updatedOrder.id,
                  customerName: `${user.firstName} ${user.lastName}`,
                  estimatedShipping: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                  orderUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/account?tab=orders&order=${updatedOrder.id}`
                }
              }),
            });
          } catch (emailError) {
            console.error('Error sending processing email:', emailError);
          }
        }
      }

      // Refresh orders list
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status');
    }
  }

  async function handleRefund(orderId: string) {
    if (!refundAmount || !refundReason) return;
    
    try {
      const amount = parseFloat(refundAmount);
      const refundData: RefundData = {
        amount,
        reason: refundReason,
        date: new Date()
      };

      const orderRef = doc(db, 'orders', orderId);
      
      // Update the order with refund data
      await updateDoc(orderRef, {
        'payment.status': 'refunded',
        refund: refundData,
        updatedAt: new Date()
      });

      // If we have a selected order, update it in state and send email
      if (selectedOrder && selectedOrder.id === orderId) {
        // Get customer data for email
        const user = {
          email: selectedOrder.customerEmail,
          firstName: selectedOrder.shipping.address.firstName,
          lastName: selectedOrder.shipping.address.lastName
        };

        // Send refund confirmation email via API
        try {
          const response = await fetch('/api/email/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: user.email,
              templateName: 'refundProcessed',
              data: {
                orderId: selectedOrder.id,
                customerName: `${user.firstName} ${user.lastName}`,
                refundAmount: `₦${amount.toLocaleString()}`,
                refundReason: refundReason,
                date: new Date().toLocaleDateString(),
                orderUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/account?tab=orders&order=${selectedOrder.id}`
              }
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Email API error:', errorData);
          }
        } catch (emailError) {
          console.error('Error sending refund email:', emailError);
        }
      }

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

  async function confirmTransferPayment(orderId: string) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      
      // Update the payment status
      await updateDoc(orderRef, {
        'payment.status': 'paid',
        updatedAt: new Date()
      });

      // If we have a selected order, update it in state
      if (selectedOrder && selectedOrder.id === orderId) {
        // Create a properly typed updated order
        const updatedOrder: Order = { 
          ...selectedOrder, 
          payment: { 
            ...selectedOrder.payment, 
            status: 'paid' as 'pending' | 'failed' | 'paid' | 'refunded'
          } 
        };
        
        setSelectedOrder(updatedOrder);
        
        // Prepare user data for email with fallback
        const userEmail = updatedOrder.customerEmail || 'missing@email.com';
        console.log('Customer email for transfer payment confirmation:', userEmail);
        
        const user = {
          email: userEmail,
          firstName: updatedOrder.shipping.address.firstName || 'Customer',
          lastName: updatedOrder.shipping.address.lastName || ''
        };

        // Create email payload
        const emailPayload = {
          to: user.email,
          templateName: 'orderConfirmation',
          data: {
            orderId: updatedOrder.id,
            customerName: `${user.firstName} ${user.lastName}`,
            date: new Date(updatedOrder.createdAt).toLocaleDateString(),
            total: `₦${updatedOrder.amount.toLocaleString()}`,
            items: updatedOrder.items.map((item: any) => ({
              name: item.name || 'Product',
              quantity: item.quantity || 1,
              price: `₦${((item.price || 0) * (item.quantity || 1)).toLocaleString()}`
            })),
            shippingAddress: {
              name: `${updatedOrder.shipping.address.firstName || ''} ${updatedOrder.shipping.address.lastName || ''}`,
              address: updatedOrder.shipping.address.address || '',
              city: updatedOrder.shipping.address.city || '',
              state: updatedOrder.shipping.address.state || ''
            },
            orderUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/account?tab=orders&order=${updatedOrder.id}`
          }
        };

        console.log('Sending confirmation email with payload:', JSON.stringify(emailPayload));

        // Send payment confirmation email via API
        try {
          const response = await fetch('/api/email/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailPayload),
          });

          const responseText = await response.text();
          console.log('API response text:', responseText);
          
          const responseData = responseText ? JSON.parse(responseText) : {};
          
          if (!response.ok) {
            console.error('Email API error response:', responseData);
            throw new Error(`Email API error: ${JSON.stringify(responseData)}`);
          } else {
            console.log('Email sent successfully:', responseData);
          }
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
        }
      }

      // Refresh orders list
      fetchOrders();
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Error confirming payment');
    }
  }

  async function checkAndFixMissingEmails() {
    try {
      const q = query(collection(db, 'orders'));
      const snapshot = await getDocs(q);
      
      let fixedCount = 0;
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        if (!data.customerEmail && data.userId) {
          // Try to get email from user record
          try {
            const userDoc = await getDoc(doc(db, 'users', data.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              if (userData.email) {
                // Update the order with the user's email
                await updateDoc(doc(db, 'orders', docSnap.id), {
                  customerEmail: userData.email
                });
                fixedCount++;
                console.log(`Fixed missing email for order ${docSnap.id}`);
              }
            }
          } catch (userError) {
            console.error(`Error getting user data for order ${docSnap.id}:`, userError);
          }
        }
      }
      
      console.log(`Fixed ${fixedCount} orders with missing emails`);
      
      // Refresh orders list
      fetchOrders();
    } catch (error) {
      console.error('Error checking for missing emails:', error);
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

            {selectedOrder && selectedOrder.payment.method === 'transfer' && 
              selectedOrder.payment.status !== 'paid' && (
                <button
                  onClick={() => confirmTransferPayment(selectedOrder.id)}
                  className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600"
                >
                  Confirm Payment
                </button>
              )}

            {/* I'll continue with the refund modal and messages UI in the next message */}
          </div>
        </div>
      )}

      <button
        onClick={checkAndFixMissingEmails}
        className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
      >
        Fix Missing Emails
      </button>
    </div>
  );
} 