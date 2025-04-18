'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash } from 'lucide-react';
import { DeliveryMethod, DeliveryZone } from '@/types/delivery';

interface MethodFormProps {
  method?: DeliveryMethod;
  zones: DeliveryZone[];
  onSubmit: (data: Partial<DeliveryMethod>) => void;
  onClose: () => void;
}

export default function MethodForm({ method, zones, onSubmit, onClose }: MethodFormProps) {
  const [form, setForm] = useState({
    name: method?.name || '',
    description: method?.description || '',
    type: method?.type || 'flat_rate',
    cost: method?.cost || 0,
    freeShippingThreshold: method?.freeShippingThreshold || 0,
    estimatedDays: method?.estimatedDays || { min: 1, max: 3 },
    zoneIds: method?.zoneIds || [],
    status: method?.status || 'active',
    weightRules: method?.weightRules || [],
    priceRules: method?.priceRules || []
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      ...form,
      updatedAt: new Date(),
      createdAt: method?.createdAt || new Date()
    });
  }

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">
          {method ? 'Edit' : 'Add'} Delivery Method
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-gray-50 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Method Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type
          </label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as DeliveryMethod['type'] })}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
          >
            <option value="flat_rate">Flat Rate</option>
            <option value="free">Free Shipping</option>
            <option value="weight_based">Weight Based</option>
            <option value="price_based">Price Based</option>
          </select>
        </div>

        {form.type === 'flat_rate' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost
            </label>
            <input
              type="number"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
              min="0"
              step="0.01"
              required
            />
          </div>
        )}

        {(form.type === 'weight_based' || form.type === 'price_based') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {form.type === 'weight_based' ? 'Weight Rules' : 'Price Rules'}
            </label>
            {/* Rules UI */}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Days (Min)
            </label>
            <input
              type="number"
              value={form.estimatedDays.min}
              onChange={(e) => setForm({
                ...form,
                estimatedDays: {
                  ...form.estimatedDays,
                  min: parseInt(e.target.value)
                }
              })}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
              min="0"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Days (Max)
            </label>
            <input
              type="number"
              value={form.estimatedDays.max}
              onChange={(e) => setForm({
                ...form,
                estimatedDays: {
                  ...form.estimatedDays,
                  max: parseInt(e.target.value)
                }
              })}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
              min="0"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Zones
          </label>
          <div className="space-y-2">
            {zones.map(zone => (
              <label key={zone.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.zoneIds.includes(zone.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setForm({ ...form, zoneIds: [...form.zoneIds, zone.id] });
                    } else {
                      setForm({
                        ...form,
                        zoneIds: form.zoneIds.filter(id => id !== zone.id)
                      });
                    }
                  }}
                  className="rounded text-pink-500 focus:ring-pink-500"
                />
                <span>{zone.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600"
        >
          {method ? 'Update' : 'Create'} Method
        </button>
      </div>
    </form>
  );
} 