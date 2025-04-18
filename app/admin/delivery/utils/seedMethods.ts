import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { DeliveryMethod, DeliveryZone } from '@/types/delivery';

const DELIVERY_ZONES = [
  {
    name: 'Lagos Mainland',
    regions: ['Ago Palace'],
    status: 'active'
  },
  {
    name: 'Lagos General',
    regions: ['Lagos Mainland', 'Lagos Island'],
    status: 'active'
  },
  {
    name: 'Lagos Extended',
    regions: ['Ikorodu', 'Berger', 'Ibeju Lekki', 'Epe', 'Badagry'],
    status: 'active'
  },
  {
    name: 'South East',
    regions: ['Enugu', 'Imo', 'Anambra', 'Ebonyi'],
    status: 'active'
  },
  {
    name: 'South West',
    regions: ['Oyo', 'Osun', 'Ondo', 'Ekiti', 'Ogun'],
    status: 'active'
  },
  {
    name: 'South South',
    regions: ['Delta', 'Edo', 'Rivers', 'Bayelsa'],
    status: 'active'
  },
  {
    name: 'North',
    regions: ['Kaduna', 'Kano', 'Plateau', 'Sokoto'],
    status: 'active'
  },
  {
    name: 'Abuja & Ilorin',
    regions: ['FCT', 'Ilorin'],
    status: 'active'
  }
];

const DELIVERY_METHODS = [
  {
    name: 'Customer Pick-up',
    description: 'Pickup days: Tuesdays, Wednesdays, and Fridays. Based on appointments',
    type: 'free' as const,
    cost: 0,
    estimatedDays: { min: 0, max: 1 },
    status: 'active' as const,
    zones: ['Lagos General']
  },
  {
    name: 'Lagos Mainland 3',
    description: 'Ago palace only!!!!!',
    type: 'flat_rate' as const,
    cost: 2000,
    estimatedDays: { min: 1, max: 3 },
    status: 'active' as const,
    zones: ['Lagos Mainland']
  },
  {
    name: 'Lagos FLAT RATE',
    type: 'flat_rate' as const,
    cost: 3100,
    estimatedDays: { min: 1, max: 3 },
    status: 'active' as const,
    zones: ['Lagos General']
  },
  {
    name: 'Lagos Flat Rate For Extreme Locations',
    description: 'For extreme locations: ikorodu, berger, ibeju lekki, epe, Badagry',
    type: 'flat_rate' as const,
    cost: 3300,
    estimatedDays: { min: 1, max: 3 },
    status: 'active' as const,
    zones: ['Lagos Extended']
  },
  {
    name: 'South East (Park) Excluding Abakaliki',
    type: 'flat_rate' as const,
    cost: 4000,
    estimatedDays: { min: 3, max: 6 },
    status: 'active' as const,
    zones: ['South East']
  },
  {
    name: 'South West (Park)',
    type: 'flat_rate' as const,
    cost: 4000,
    estimatedDays: { min: 3, max: 6 },
    status: 'active' as const,
    zones: ['South West']
  },
  {
    name: 'South South (Park)',
    type: 'flat_rate' as const,
    cost: 4000,
    estimatedDays: { min: 3, max: 6 },
    status: 'active' as const,
    zones: ['South South']
  },
  {
    name: 'Abuja, Ilorin (Park)',
    type: 'flat_rate' as const,
    cost: 4000,
    estimatedDays: { min: 3, max: 6 },
    status: 'active' as const,
    zones: ['Abuja & Ilorin']
  },
  {
    name: 'Southwest Doorstep Delivery',
    type: 'flat_rate' as const,
    cost: 4650,
    estimatedDays: { min: 3, max: 6 },
    status: 'active' as const,
    zones: ['South West']
  },
  {
    name: 'South East Doorstep Delivery',
    type: 'flat_rate' as const,
    cost: 5650,
    estimatedDays: { min: 3, max: 6 },
    status: 'active' as const,
    zones: ['South East']
  },
  {
    name: 'South South Doorstep Delivery',
    type: 'flat_rate' as const,
    cost: 5650,
    estimatedDays: { min: 3, max: 6 },
    status: 'active' as const,
    zones: ['South South']
  },
  {
    name: 'Abuja Doorstep Delivery',
    type: 'flat_rate' as const,
    cost: 6200,
    estimatedDays: { min: 3, max: 6 },
    status: 'active' as const,
    zones: ['Abuja & Ilorin']
  },
  {
    name: 'North Doorstep Delivery',
    type: 'flat_rate' as const,
    cost: 6450,
    estimatedDays: { min: 3, max: 6 },
    status: 'active' as const,
    zones: ['North']
  }
];

export async function seedDeliveryData() {
  try {
    // First create zones and store their IDs
    const zoneIds: { [key: string]: string } = {};
    
    for (const zone of DELIVERY_ZONES) {
      const docRef = await addDoc(collection(db, 'delivery_zones'), {
        ...zone,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      zoneIds[zone.name] = docRef.id;
    }

    // Then create methods with zone references
    for (const method of DELIVERY_METHODS) {
      const { zones, ...methodData } = method;
      await addDoc(collection(db, 'delivery_methods'), {
        ...methodData,
        zoneIds: zones.map(zoneName => zoneIds[zoneName]),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log('Delivery data seeded successfully');
    return true;
  } catch (error) {
    console.error('Error seeding delivery data:', error);
    return false;
  }
} 