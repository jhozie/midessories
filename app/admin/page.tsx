'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, getFirestore } from 'firebase/firestore';
import { 
  TrendingUp, 
  Package, 
  ShoppingBag, 
  Users,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight 
} from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: string;
  amount: number;
  status: string;
  createdAt: any; // or proper Timestamp type
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch orders
        const ordersSnapshot = await getDocs(
          query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5))
        );
        
        const orders = ordersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            amount: data.amount || 0,
            status: data.status || 'pending',
            createdAt: data.createdAt
          } as Order;
        });
        
        setRecentOrders(orders);

        // Fetch stats
        const productsCount = (await getDocs(collection(db, 'products'))).size;
        const customersCount = (await getDocs(collection(db, 'users'))).size;
        const allOrders = (await getDocs(collection(db, 'orders'))).docs;
        const revenue = allOrders.reduce((total, order) => total + order.data().amount, 0);

        setStats({
          totalOrders: allOrders.length,
          totalProducts: productsCount,
          totalCustomers: customersCount,
          totalRevenue: revenue,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Total Revenue',
      value: `₦${stats.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      change: '+12.5%',
      trend: 'up',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBag,
      change: '+8.2%',
      trend: 'up',
    },
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      change: '-2.4%',
      trend: 'down',
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      change: '+5.7%',
      trend: 'up',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back to your admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-pink-50 rounded-xl">
                <stat.icon className="w-6 h-6 text-pink-500" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
              }`}>
                {stat.change}
                {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              </div>
            </div>
            <h3 className="text-gray-500 text-sm mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Recent Orders</h2>
            <Link 
              href="/admin/orders"
              className="text-pink-500 hover:text-pink-600 text-sm font-medium flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
            </div>
          ) : (
            <div className="divide-y">
              {recentOrders.map((order: any) => (
                <div key={order.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Order #{order.id}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt?.toDate()).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₦{order.amount.toLocaleString()}</p>
                      <p className={`text-sm ${
                        order.status === 'completed' ? 'text-green-500' : 
                        order.status === 'pending' ? 'text-yellow-500' : 'text-gray-500'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 