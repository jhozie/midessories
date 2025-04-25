'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter,
  MoreVertical,
  User,
  Mail,
  Phone,
  MapPin,
  Tag,
  ShoppingBag,
  Clock,
  X,
  Plus,
  Loader2,
  Edit,
  Save,
  Trash,
  History,
  MessageSquare
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
import { Customer } from '@/types/customer';
import { STATUS_COLORS, STATUS_ICONS } from '@/utils/constants';
import { Order } from '@/types/order';
import React from 'react';
import { triggerWelcomeEmail } from '@/lib/emailTriggers';

type CustomerTab = 'details' | 'orders' | 'addresses' | 'notes';

// Define an interface for the customer data
interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [activeTab, setActiveTab] = useState<CustomerTab>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    tags: [] as string[],
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [newCustomerForm, setNewCustomerForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const customersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          status: data.status || 'active',
          orders: data.orders || [],
          addresses: data.addresses || [],
          tags: data.tags || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          totalSpent: data.totalSpent || 0,
          lastPurchase: data.lastPurchase?.toDate() || null,
          totalOrders: data.totalOrders || 0,
        } as Customer;
      });
      setCustomers(customersData);

      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateCustomerStatus(customerId: string, status: Customer['status']) {
    try {
      await updateDoc(doc(db, 'users', customerId), {
        status,
        updatedAt: new Date()
      });
      fetchCustomers();
    } catch (error) {
      console.error('Error updating customer status:', error);
      alert('Error updating customer status');
    }
  }

  async function updateCustomer(customerId: string, data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    tags: string[];
  }) {
    try {
      await updateDoc(doc(db, 'users', customerId), {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        tags: data.tags,
        updatedAt: new Date()
      });
      
      // Refresh customers list
      fetchCustomers();
      
      // Exit edit mode
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Error updating customer');
    }
  }

  async function createCustomer(customerData: CustomerData) {
    try {
      // Create the customer in the users collection
      const docRef = await addDoc(collection(db, 'users'), {
        ...customerData,
        status: 'active',
        orders: [],
        addresses: [],
        tags: [],
        totalSpent: 0,
        totalOrders: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Send welcome email
      await triggerWelcomeEmail({
        firstName: customerData.firstName,
        email: customerData.email
      });

      // Refresh customers list
      fetchCustomers();
      
      // Close modal and reset form
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Error creating customer');
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  function resetForm() {
    setNewCustomerForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    });
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'blocked')}
            className="px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-4 px-6 font-medium">Customer</th>
                <th className="text-left py-4 px-6 font-medium">Contact</th>
                <th className="text-left py-4 px-6 font-medium">Orders</th>
                <th className="text-left py-4 px-6 font-medium">Total Spent</th>
                <th className="text-left py-4 px-6 font-medium">Status</th>
                <th className="text-left py-4 px-6 font-medium">Joined</th>
                <th className="py-4 px-6"></th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {customer.firstName} {customer.lastName}
                        </div>
                        {customer.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {customer.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-0.5 bg-pink-50 text-pink-500 rounded-full text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-500">{customer.email}</div>
                      {customer.phone && (
                        <div className="text-sm text-gray-500">{customer.phone}</div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 font-medium">
                    {customer.totalOrders}
                  </td>
                  <td className="py-4 px-6 font-medium">
                    ${customer.totalSpent.toFixed(2)}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                      customer.status === 'active' 
                        ? 'bg-green-50 text-green-600'
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-500">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => {
                        setSelectedCustomer(customer);
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

      {/* Customer Details Modal */}
      {isModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </h2>
                <p className="text-sm text-gray-500">
                  Customer since {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    if (isEditing) {
                      // Save changes
                      updateCustomer(selectedCustomer.id, editForm);
                    } else {
                      setEditForm({
                        firstName: selectedCustomer.firstName,
                        lastName: selectedCustomer.lastName,
                        email: selectedCustomer.email,
                        phone: selectedCustomer.phone || '',
                        tags: [...selectedCustomer.tags],
                      });
                    }
                    setIsEditing(!isEditing);
                  }}
                  className="p-2 hover:bg-gray-50 rounded-lg text-gray-600"
                >
                  {isEditing ? <Save className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                </button>
                <select
                  value={selectedCustomer.status}
                  onChange={(e) => updateCustomerStatus(selectedCustomer.id, e.target.value as Customer['status'])}
                  className="px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                >
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                </select>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-50 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="border-b border-gray-100">
              <div className="px-6 flex items-center gap-6">
                {(['details', 'orders', 'addresses', 'notes'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-2 border-b-2 font-medium ${
                      activeTab === tab
                        ? 'border-pink-500 text-pink-500'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {isEditing ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name
                          </label>
                          <input
                            type="text"
                            value={editForm.firstName}
                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name
                          </label>
                          <input
                            type="text"
                            value={editForm.lastName}
                            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tags
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {editForm.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-pink-50 text-pink-500 rounded-full text-sm flex items-center gap-2"
                            >
                              {tag}
                              <button
                                onClick={() => {
                                  const newTags = [...editForm.tags];
                                  newTags.splice(index, 1);
                                  setEditForm({ ...editForm, tags: newTags });
                                }}
                                className="hover:bg-pink-100 rounded-full p-1"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          <input
                            type="text"
                            placeholder="Add tag and press Enter"
                            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const value = e.currentTarget.value.trim();
                                if (value && !editForm.tags.includes(value)) {
                                  setEditForm({
                                    ...editForm,
                                    tags: [...editForm.tags, value]
                                  });
                                  e.currentTarget.value = '';
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Contact Information</h3>
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Mail className="w-4 h-4" />
                                <span>{selectedCustomer.email}</span>
                              </div>
                              {selectedCustomer.phone && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Phone className="w-4 h-4" />
                                  <span>{selectedCustomer.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Tags</h3>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {selectedCustomer.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-pink-50 text-pink-500 rounded-full text-sm"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Order Summary</h3>
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center justify-between text-gray-600">
                                <span>Total Orders</span>
                                <span className="font-medium">{selectedCustomer.totalOrders}</span>
                              </div>
                              <div className="flex items-center justify-between text-gray-600">
                                <span>Total Spent</span>
                                <span className="font-medium">${selectedCustomer.totalSpent.toFixed(2)}</span>
                              </div>
                              {selectedCustomer.lastOrderDate && (
                                <div className="flex items-center justify-between text-gray-600">
                                  <span>Last Order</span>
                                  <span className="font-medium">
                                    {new Date(selectedCustomer.lastOrderDate).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Account Status</h3>
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                                selectedCustomer.status === 'active' 
                                  ? 'bg-green-50 text-green-600'
                                  : 'bg-red-50 text-red-600'
                              }`}>
                                {selectedCustomer.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-4 px-6 font-medium">Order</th>
                        <th className="text-left py-4 px-6 font-medium">Date</th>
                        <th className="text-left py-4 px-6 font-medium">Status</th>
                        <th className="text-left py-4 px-6 font-medium">Total</th>
                        <th className="py-4 px-6"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomer.orders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-500">
                            No orders yet
                          </td>
                        </tr>
                      ) : (
                        selectedCustomer.orders.map((orderId) => {
                          const order = orders.find(o => o.id === orderId);
                          if (!order) return null;

                          return (
                            <tr key={order.id} className="border-b border-gray-100 last:border-0">
                              <td className="py-4 px-6">
                                <div>
                                  <div className="font-medium">{order.id}</div>
                                  <div className="text-sm text-gray-500">{order.items.length} items</div>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-6">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${STATUS_COLORS[order.status]}`}>
                                  {STATUS_ICONS[order.status] && React.createElement(STATUS_ICONS[order.status], { className: "w-4 h-4" })}
                                  <span className="capitalize">{order.status}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 font-medium">
                                ${(order.amount || 0).toFixed(2)}
                              </td>
                              <td className="py-4 px-6">
                                <button
                                  onClick={() => {
                                    // Navigate to order details
                                    window.location.href = `/admin/orders?id=${order.id}`;
                                  }}
                                  className="p-2 hover:bg-gray-50 rounded-lg"
                                >
                                  <MoreVertical className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Saved Addresses</h3>
                  <button
                    onClick={() => {
                      // Add new address logic
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600"
                  >
                    <Plus className="w-4 h-4" />
                    Add Address
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {selectedCustomer.addresses.map((address) => (
                    <div key={address.id} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="capitalize px-2 py-0.5 bg-gray-100 rounded text-sm">
                            {address.type}
                          </span>
                          {address.isDefault && (
                            <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-sm">
                              Default
                            </span>
                          )}
                        </div>
                        <button className="p-1 hover:bg-gray-50 rounded">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-gray-600">
                        {address.street}<br />
                        {address.city}, {address.state}<br />
                        {address.country}, {address.postalCode}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 