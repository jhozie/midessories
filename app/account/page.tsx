'use client';

import { useState, useEffect } from 'react';
import { Package, Heart, MapPin, Settings, LogOut, ChevronRight, ShoppingBag, Star, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { formatNaira } from '@/lib/utils';

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  defaultShipping?: {
    address: string;
    city: string;
    state: string;
  };
  addresses?: {
    id: string;
    type: string;
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    isDefault: boolean;
    createdAt: Date;
  }[];
  wishlist?: {
    productId: string;
    dateAdded: Date;
  }[];
}

interface Order {
  id: string;
  date: string;
  status: string;
  amount: number;
  items: {
    id: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
  }[];
  shipping: {
    method: string;
    cost: number;
    address: {
      firstName: string;
      lastName: string;
      address: string;
      city: string;
      state: string;
    };
  };
  payment: {
    method: string;
    status: string;
  };
}

interface OrderDetails {
  id: string;
  date: string;
  status: string;
  amount: number;
  items: {
    id: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
  }[];
  shipping: {
    method: string;
    cost: number;
    address: {
      firstName: string;
      lastName: string;
      address: string;
      city: string;
      state: string;
    };
  };
  payment: {
    method: string;
    status: string;
  };
}

interface Address {
  id: string;
  type: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  isDefault: boolean;
}

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
  ratings: {
    average: number;
    count: number;
  };
}

export default function AccountPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('orders');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          // If there's defaultShipping but no addresses, create an address from defaultShipping
          if (data.defaultShipping && (!data.addresses || data.addresses.length === 0)) {
            data.addresses = [{
              id: 'addr_' + Date.now(),
              type: 'Home',
              name: `${data.firstName} ${data.lastName}`,
              phone: data.phone,
              address: data.defaultShipping.address,
              city: data.defaultShipping.city,
              state: data.defaultShipping.state,
              isDefault: true,
              createdAt: new Date()
            }];
            // Update the user document with the new address
            await updateDoc(doc(db, 'users', user.uid), {
              addresses: data.addresses
            });
          }
          setUserData(data as UserData);
          
          // Fetch wishlist items if they exist
          if (data.wishlist?.length) {
            const items = await fetchWishlistItems(
              data.wishlist.map((item: { productId: string }) => item.productId)
            );
            setWishlistItems(items);
          }
        }

        // Get user orders
        const ordersQuery = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid)
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(ordersData as Order[]);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleUpdateProfile = async (updatedData: Partial<UserData>) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await updateDoc(doc(db, 'users', user.uid), updatedData);
      setUserData(prev => prev ? { ...prev, ...updatedData } : null);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleAddressSubmit = async (addressData: Omit<Address, 'id'>) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      if (editingAddress) {
        // Update existing address
        const updatedAddresses = userData?.addresses?.map(addr => 
          addr.id === editingAddress.id ? { ...addressData, id: addr.id } : addr
        ) || [];
        
        await updateDoc(doc(db, 'users', user.uid), {
          addresses: updatedAddresses
        });
        
        setUserData(prev => prev ? { ...prev, addresses: updatedAddresses } : null);
      } else {
        // Add new address
        const newAddress = {
          ...addressData,
          id: 'addr_' + Date.now(),
          isDefault: !userData?.addresses?.length
        };
        
        const updatedAddresses = [...(userData?.addresses || []), newAddress];
        
        await updateDoc(doc(db, 'users', user.uid), {
          addresses: updatedAddresses
        });
        
        setUserData(prev => prev ? { ...prev, addresses: updatedAddresses } : null);
      }
      
      setIsAddressModalOpen(false);
      setEditingAddress(null);
    } catch (error) {
      console.error('Error updating address:', error);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const updatedAddresses = userData?.addresses?.filter(addr => addr.id !== addressId) || [];
      
      await updateDoc(doc(db, 'users', user.uid), {
        addresses: updatedAddresses
      });
      
      setUserData(prev => prev ? { ...prev, addresses: updatedAddresses } : null);
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  const fetchWishlistItems = async (wishlistIds: string[]): Promise<WishlistItem[]> => {
    try {
      const items = await Promise.all(
        wishlistIds.map(async (id) => {
          const productDoc = await getDoc(doc(db, 'products', id));
          if (productDoc.exists()) {
            const data = productDoc.data();
            return {
              id: productDoc.id,
              name: data.name,
              price: data.price,
              image: data.images[0],
              ratings: {
                average: data.ratings?.average || 0,
                count: data.ratings?.count || 0
              }
            } as WishlistItem;
          }
          return null;
        })
      );
      return items.filter((item): item is WishlistItem => item !== null);
    } catch (error) {
      console.error('Error fetching wishlist items:', error);
      return [];
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const updatedWishlist = userData?.wishlist?.filter(
        item => item.productId !== productId
      ) || [];

      await updateDoc(doc(db, 'users', user.uid), {
        wishlist: updatedWishlist
      });

      setUserData(prev => prev ? { 
        ...prev, 
        wishlist: updatedWishlist 
      } : null);
      
      setWishlistItems(prev => prev.filter(item => item.id !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'orders':
        return (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Order Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Order #{order.id}</p>
                      <p className="text-sm text-gray-500">{order.date}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm font-medium">
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Total: {formatNaira(order.amount)}</p>
                    <Link 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedOrder(order as OrderDetails);
                        setIsDetailsModalOpen(true);
                      }}
                      className="text-sm text-pink-500 hover:text-pink-600 font-medium flex items-center gap-1"
                    >
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
                {/* Order Items */}
                <div className="p-6 bg-gray-50">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity} × ${item.price}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'addresses':
        return (
          <div className="space-y-6">
            {userData?.addresses?.map((address) => (
              <div key={address.id} className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                      {address.type}
                    </span>
                    {address.isDefault && (
                      <span className="px-2 py-1 bg-pink-50 text-pink-500 rounded text-sm">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setEditingAddress(address);
                        setIsAddressModalOpen(true);
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteAddress(address.id)}
                      className="text-sm text-red-500 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">{address.name}</p>
                  <p className="text-gray-600">{address.address}</p>
                  <p className="text-gray-600">{address.city}, {address.state}</p>
                  <p className="text-gray-600">{address.phone}</p>
                </div>
              </div>
            ))}
            <button 
              onClick={() => {
                setEditingAddress(null);
                setIsAddressModalOpen(true);
              }}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 hover:border-pink-500 hover:text-pink-500 transition-colors"
            >
              + Add New Address
            </button>
          </div>
        );

      case 'wishlist':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-4 group">
                <div className="relative aspect-square rounded-xl overflow-hidden mb-4">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <button 
                    onClick={() => removeFromWishlist(item.id)}
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-pink-50 transition-colors"
                  >
                    <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                  </button>
                </div>
                <div>
                  <Link href={`/product/${item.id}`}>
                    <h3 className="font-medium mb-2 hover:text-pink-500 transition-colors">
                      {item.name}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{formatNaira(item.price)}</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-pink-500 fill-pink-500" />
                      <span className="text-sm text-gray-600">{item.ratings.average.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {wishlistItems.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Your wishlist is empty</h3>
                <p className="text-gray-500 mb-6">
                  Start adding items you love to your wishlist
                </p>
                <Link 
                  href="/shop"
                  className="inline-flex items-center justify-center px-6 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors"
                >
                  Browse Products
                </Link>
              </div>
            )}
          </div>
        );

      case 'settings':
        return (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="max-w-xl space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                  defaultValue={userData?.firstName}
                  onChange={(e) => handleUpdateProfile({ firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                  defaultValue={userData?.email}
                  onChange={(e) => handleUpdateProfile({ email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                  defaultValue={userData?.phone}
                  onChange={(e) => handleUpdateProfile({ phone: e.target.value })}
                />
              </div>
              <button className="w-full bg-pink-500 text-white py-3 rounded-xl hover:bg-pink-600 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  function OrderDetailsModal({ order, onClose }: { order: OrderDetails; onClose: () => void }) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b sticky top-0 bg-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Order Details</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Order Info */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Order #{order.id}</p>
                <p className="text-sm text-gray-500">{order.date}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium
                ${order.status === 'delivered' ? 'bg-green-50 text-green-600' : 
                  order.status === 'processing' ? 'bg-blue-50 text-blue-600' : 
                  'bg-gray-50 text-gray-600'}`}>
                {order.status}
              </span>
            </div>

            {/* Items */}
            <div className="space-y-4">
              <h3 className="font-medium">Items</h3>
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity} × {formatNaira(item.price)}
                    </p>
                  </div>
                  <p className="font-medium">{formatNaira(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            {/* Shipping */}
            <div>
              <h3 className="font-medium mb-2">Shipping Details</h3>
              <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                <p>{order.shipping.address.firstName} {order.shipping.address.lastName}</p>
                <p className="text-gray-600">{order.shipping.address.address}</p>
                <p className="text-gray-600">
                  {order.shipping.address.city}, {order.shipping.address.state}
                </p>
                <div className="pt-2 mt-2 border-t">
                  <p className="text-sm text-gray-500">Method: {order.shipping.method}</p>
                  <p className="text-sm text-gray-500">Cost: {formatNaira(order.shipping.cost)}</p>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div>
              <h3 className="font-medium mb-2">Payment Summary</h3>
              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatNaira(order.amount - order.shipping.cost)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{formatNaira(order.shipping.cost)}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Total</span>
                  <span>{formatNaira(order.amount)}</span>
                </div>
                <p className="text-sm text-gray-500 pt-2">
                  Payment Method: {order.payment.method}
                  <span className="ml-2 px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs">
                    {order.payment.status}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function AddressModal({ 
    address, 
    onSubmit, 
    onClose 
  }: { 
    address?: Address | null;
    onSubmit: (data: Omit<Address, 'id'>) => void;
    onClose: () => void;
  }) {
    const [formData, setFormData] = useState({
      type: address?.type || 'Home',
      name: address?.name || '',
      phone: address?.phone || '',
      address: address?.address || '',
      city: address?.city || '',
      state: address?.state || '',
      isDefault: address?.isDefault || false
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-lg">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{address ? 'Edit' : 'Add New'} Address</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-xl"
                >
                  <option value="Home">Home</option>
                  <option value="Office">Office</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-xl"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-2 border rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-4 py-2 border rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                className="rounded text-pink-500 focus:ring-pink-500"
              />
              <label className="text-sm">Set as default address</label>
            </div>

            <button
              type="submit"
              className="w-full bg-pink-500 text-white py-3 rounded-xl hover:bg-pink-600 transition-colors"
            >
              {address ? 'Update' : 'Add'} Address
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 w-48 rounded mb-8" />
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-32">
              <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {userData?.firstName?.[0] || 'U'}
                </div>
                <div>
                  <h2 className="font-bold">{userData?.firstName} {userData?.lastName}</h2>
                  <p className="text-sm text-gray-500">{userData?.email}</p>
                </div>
              </div>
              <nav className="mt-6 space-y-2">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-left ${
                    activeTab === 'orders' ? 'bg-pink-50 text-pink-500' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Package className="w-5 h-5" />
                  Orders
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-left ${
                    activeTab === 'addresses' ? 'bg-pink-50 text-pink-500' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                  Addresses
                </button>
                <button
                  onClick={() => setActiveTab('wishlist')}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-left ${
                    activeTab === 'wishlist' ? 'bg-pink-50 text-pink-500' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Heart className="w-5 h-5" />
                  Wishlist
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-left ${
                    activeTab === 'settings' ? 'bg-pink-50 text-pink-500' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-left text-gray-600 hover:bg-gray-50"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h1>
              <p className="text-gray-600">
                {activeTab === 'orders' && 'View and track your orders'}
                {activeTab === 'addresses' && 'Manage your delivery addresses'}
                {activeTab === 'wishlist' && 'Your saved items'}
                {activeTab === 'settings' && 'Update your account settings'}
              </p>
            </div>
            {renderContent()}
          </div>
        </div>
      </div>
      {isDetailsModalOpen && selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedOrder(null);
          }} 
        />
      )}
      {isAddressModalOpen && (
        <AddressModal 
          address={editingAddress}
          onSubmit={handleAddressSubmit} 
          onClose={() => {
            setIsAddressModalOpen(false);
            setEditingAddress(null);
          }} 
        />
      )}
    </main>
  );
} 