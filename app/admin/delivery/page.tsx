'use client';

import { useState, useEffect } from 'react';
import { 
  Plus,
  Truck,
  Globe,
  MapPin,
  Clock,
  DollarSign,
  Weight,
  Package,
  MoreVertical,
  X,
  Edit,
  Trash,
  Loader2
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy
} from 'firebase/firestore';
import { DeliveryMethod, DeliveryZone } from '@/types/delivery';
import MethodForm from './components/MethodForm';
import { seedDeliveryData } from './utils/seedMethods';

export default function DeliveryPage() {
  const [methods, setMethods] = useState<DeliveryMethod[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'methods' | 'zones'>('methods');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DeliveryMethod | DeliveryZone | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [methodsSnap, zonesSnap] = await Promise.all([
        getDocs(query(collection(db, 'delivery_methods'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'delivery_zones'), orderBy('name')))
      ]);

      setMethods(methodsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DeliveryMethod[]);

      setZones(zonesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DeliveryZone[]);
    } catch (error) {
      console.error('Error fetching delivery data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Delivery Options</h1>
        <button
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600"
        >
          <Plus className="w-4 h-4" />
          Add {activeTab === 'methods' ? 'Method' : 'Zone'}
        </button>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('methods')}
              className={`py-3 px-1 border-b-2 font-medium ${
                activeTab === 'methods'
                  ? 'border-pink-500 text-pink-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Delivery Methods
            </button>
            <button
              onClick={() => setActiveTab('zones')}
              className={`py-3 px-1 border-b-2 font-medium ${
                activeTab === 'zones'
                  ? 'border-pink-500 text-pink-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Delivery Zones
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      ) : (
        <>
          {activeTab === 'methods' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {methods.map(method => (
                <div 
                  key={method.id}
                  className="bg-white rounded-xl border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-medium">{method.name}</h3>
                      {method.description && (
                        <p className="text-sm text-gray-500 mt-1">{method.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        method.status === 'active'
                          ? 'bg-green-50 text-green-600'
                          : 'bg-red-50 text-red-600'
                      }`}>
                        {method.status}
                      </span>
                      <button
                        onClick={() => {
                          setEditingItem(method);
                          setIsModalOpen(true);
                        }}
                        className="p-1 hover:bg-gray-50 rounded"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span>
                        {method.type === 'free' 
                          ? 'Free Shipping'
                          : `$${method.cost.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        {method.estimatedDays.min}-{method.estimatedDays.max} days
                      </span>
                    </div>
                    {method.freeShippingThreshold && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Package className="w-4 h-4" />
                        <span>
                          Free shipping over ${method.freeShippingThreshold.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {zones.map(zone => (
                <div
                  key={zone.id}
                  className="bg-white rounded-xl border border-gray-200 p-6"
                >
                  {/* Zone card content */}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal for adding/editing methods and zones */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {activeTab === 'methods' ? (
              <MethodForm 
                method={editingItem as DeliveryMethod}
                zones={zones}
                onSubmit={async (data) => {
                  try {
                    if (editingItem) {
                      await updateDoc(doc(db, 'delivery_methods', editingItem.id), data);
                    } else {
                      await addDoc(collection(db, 'delivery_methods'), data);
                    }
                    fetchData();
                    setIsModalOpen(false);
                    setEditingItem(null);
                  } catch (error) {
                    console.error('Error saving delivery method:', error);
                    alert('Error saving delivery method');
                  }
                }}
                onClose={() => {
                  setIsModalOpen(false);
                  setEditingItem(null);
                }}
              />
            ) : (
              // Zone form will go here
              <div>Zone Form</div>
            )}
          </div>
        </div>
      )}

      {(methods.length === 0 || zones.length === 0) && !loading && (
        <button
          onClick={async () => {
            if (confirm('Are you sure you want to add the default delivery data?')) {
              setLoading(true);
              await seedDeliveryData();
              await fetchData();
            }
          }}
          className="ml-4 px-4 py-2 border border-pink-500 text-pink-500 rounded-xl hover:bg-pink-50"
        >
          Add Default Delivery Data
        </button>
      )}
    </div>
  );
} 