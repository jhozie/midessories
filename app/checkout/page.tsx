'use client';

import { useState } from 'react';
import { CartItem, useCart } from '@/contexts/CartContext';
import { ChevronLeft, CreditCard, Truck, Radio, X, AlertCircle, MapPin, Clock, Building2, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import PromoCode from '@/components/PromoCode';
import PaystackPayment from '@/components/PaystackPayment';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { triggerOrderConfirmationEmail } from '@/lib/emailTriggers';

type ShippingMethod = 'standard' | 'express';
type PaymentMethod = 'paystack' | 'transfer';

type CheckoutForm = {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  additionalInfo?: string;
  createAccount: boolean;
  password: string;
  confirmPassword: string;
  newsletter: boolean;
};

// Add type for shipping locations
type ShippingLocation = {
  name: string;
  deliveryTime: string;
  price: number;
  details?: string;
};

// Update the shipping locations data
const shippingLocations: Record<string, ShippingLocation> = {
  'pickup': {
    name: 'Customer Pick-up',
    deliveryTime: 'Pickup days: Tuesdays, Wednesdays, and Fridays',
    price: 0,
    details: 'No walk-in store\nLocation: Ago palace\nTime: Based on appointments'
  },
  'south-east': {
    name: 'South East (Park) Excluding Abakaliki',
    deliveryTime: '3-6 working days',
    price: 4000
  },
  'south-west-park': {
    name: 'South west (Park)',
    deliveryTime: '3-6 working days',
    price: 4000
  },
  'south-south-park': {
    name: 'South South (Park)',
    deliveryTime: '3-6 working days',
    price: 4000
  },
  'north-doorstep': {
    name: 'North Doorstep Delivery',
    deliveryTime: '3-6 working days',
    price: 6450
  },
  'lagos-mainland': {
    name: 'Lagos Mainland 3',
    deliveryTime: '1-3 working days',
    price: 2000,
    details: 'Ago palace only!!!!!'
  },
  'lagos-flat': {
    name: 'Lagos FLAT RATE',
    deliveryTime: '1-3 working days',
    price: 3100
  },
  'abuja-ilorin': {
    name: 'Abuja, Ilorin (Park)',
    deliveryTime: '3-6 working days',
    price: 4000
  },
  'southwest-doorstep': {
    name: 'Southwest Doorstep Delivery',
    deliveryTime: '3-6 working days',
    price: 4650
  },
  'nsukka-special': {
    name: 'Nsukka, Abakiliki, Sapele (Park)',
    deliveryTime: '3-6 working days',
    price: 4500
  },
  'abuja-doorstep': {
    name: 'Abuja Doorstep Delivery',
    deliveryTime: '3-6 working days',
    price: 6200
  },
  'southeast-doorstep': {
    name: 'South East Doorstep Delivery',
    deliveryTime: '3-6 working days',
    price: 5650
  },
  'southsouth-doorstep': {
    name: 'South South Doorstep Delivery',
    deliveryTime: '3-6 working days',
    price: 5650
  },
  'lagos-extreme': {
    name: 'Lagos Flat Rate For Extreme Locations',
    deliveryTime: '1-3 working days',
    price: 3300,
    details: 'For extreme locations: ikorodu, berger, ibeju lekki, epe, Badagry'
  },
  'cross-rivers-akwa': {
    name: 'Cross Rivers And Akwa Ibom Doorstep Delivery',
    deliveryTime: '3-6 working days',
    price: 6750
  }
};

// Add this helper function at the top of the file
const formatPhoneNumber = (value: string) => {
  // Remove all non-digits
  const number = value.replace(/\D/g, '');
  
  // Format as Nigerian number
  if (number.length <= 4) return number;
  if (number.length <= 7) return `${number.slice(0, 4)} ${number.slice(4)}`;
  return `${number.slice(0, 4)} ${number.slice(4, 7)} ${number.slice(7, 11)}`;
};

// Add this type for phone validation
type PhoneValidation = {
  isValid: boolean;
  message?: string;
};

// Add this validation function
const validateNigerianPhone = (phone: string): PhoneValidation => {
  const cleanNumber = phone.replace(/\D/g, '');
  
  if (!cleanNumber) {
    return { isValid: false, message: 'Phone number is required' };
  }

  if (cleanNumber.length !== 11) {
    return { isValid: false, message: 'Phone number must be 11 digits' };
  }

  const validPrefixes = ['070', '080', '081', '090', '091'];
  const prefix = cleanNumber.substring(0, 3);
  
  if (!validPrefixes.includes(prefix)) {
    return { 
      isValid: false, 
      message: 'Please enter a valid Nigerian phone number' 
    };
  }

  return { isValid: true };
};

function SectionHeader({ 
  number, 
  title, 
  subtitle 
}: { 
  number: number; 
  title: string; 
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-100 text-pink-500 flex items-center justify-center font-semibold">
        {number}
      </div>
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

type OrderStatus = 'pending' | 'processing' | 'completed' | 'failed';

type Order = {
  id: string;
  status: OrderStatus;
  reference: string;
  amount: number;
  items: CartItem[];
  userId?: string | null; // Optional user ID for guest checkouts
  shipping: {
    method: string;
    cost: number;
    address: {
      firstName: string;
      lastName: string;
      address: string;
      city: string;
      state: string;
      additionalInfo?: string;
    };
  };
  payment: {
    method: PaymentMethod;
    status: 'pending' | 'completed';
    reference?: string;
  };
  createdAt: Date;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutForm>();
  
  // Add state for payment handling
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingMethod, setShippingMethod] = useState('pickup');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paystack');
  const [discount, setDiscount] = useState(0);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [showPaystack, setShowPaystack] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [orderReference, setOrderReference] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const shippingCost = shippingLocations[shippingMethod].price;
  const discountAmount = (total * discount) / 100;
  const finalTotal = total + shippingCost - discountAmount;

  const generateReference = () => {
    return `MID-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase();
  };

  const onSubmit = async (data: CheckoutForm) => {
    try {
      setIsProcessing(true);
      const reference = generateReference();
      
      // Create user account if requested
      let userId = null;
      if (data.createAccount) {
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            data.email,
            data.password
          );
          
          userId = userCredential.user.uid;
          
          // Save user profile to Firestore
          await setDoc(doc(db, 'users', userId), {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            newsletter: data.newsletter,
            createdAt: new Date(),
            defaultShipping: {
              address: data.address,
              city: data.city,
              state: data.state,
            }
          });
        } catch (error) {
          console.error('Account creation error:', error);
          setPaymentError('Failed to create account. Email might already be registered.');
          return;
        }
      }

      // Create order data
      const orderData = {
        id: reference,
        amount: finalTotal,
        customerEmail: data.email,
        customerPhone: data.phone,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        shipping: {
          address: {
            firstName: data.firstName,
            lastName: data.lastName,
            address: data.address,
            city: data.city,
            state: data.state,
            additionalInfo: data.additionalInfo
          },
          cost: shippingCost,
          location: shippingLocations[shippingMethod],
          method: shippingMethod,
          status: 'pending'
        },
        status: 'pending' as OrderStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: userId,
        payment: {
          method: paymentMethod,
          status: (paymentMethod === 'transfer' ? 'pending' : 'processing') as 'pending' | 'completed',
          reference: reference
        }
      };

      // Save order to Firestore
      await setDoc(doc(db, 'orders', reference), orderData);

      // Store order data in localStorage for email sending
      localStorage.setItem('lastOrder', JSON.stringify({
        ...orderData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      // Store user data if they created an account
      if (data.createAccount) {
        localStorage.setItem('userData', JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email
        }));
      }

      // Set order in state and continue with payment
      setOrder({
        ...orderData,
        reference: reference,
        payment: {
          ...orderData.payment,
          status: orderData.payment.status as 'pending' | 'completed'
        }
      });
      setOrderReference(reference);

      if (paymentMethod === 'paystack') {
        setShowPaystack(true);
      } else {
        router.push(`/checkout/transfer/${reference}`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setPaymentError('Failed to process checkout. Please try again.');
    } finally {
      if (paymentMethod !== 'paystack') {
        setIsProcessing(false);
      }
    }
  };

  const handlePaymentSuccess = async (reference: string) => {
    try {
      // Clear any previous errors
      setPaymentError(null);
      
      // Here you would typically verify the payment with your backend
      console.log('Payment successful:', reference);
      
      // Clear cart and redirect
      clearCart();
      router.push(`/checkout/success/${reference}`);
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentError('Failed to verify payment. Please contact support.');
    } finally {
      setIsProcessing(false);
      setShowPaystack(false);
    }
  };

  const handlePaymentClose = () => {
    setShowPaystack(false);
    setIsProcessing(false);
    setPaymentError('Payment was cancelled. Please try again.');
  };

  const FormError = ({ message }: { message: string }) => (
    <p className="flex items-center gap-1 text-red-500 text-sm mt-1">
      <AlertCircle className="w-4 h-4" />
      {message}
    </p>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <Link 
              href="/cart" 
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to cart
            </Link>
            <h1 className="text-lg font-semibold">Checkout</h1>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column - Form Fields */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <SectionHeader 
                number={1} 
                title="Contact Information" 
                subtitle="We'll use these details to keep you informed about your delivery"
              />
              <div className="grid gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                    placeholder="your@email.com"
                  />
                  {errors.email && <FormError message={errors.email.message!} />}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <span className="text-gray-500">+234</span>
                    </div>
                    <input
                      type="tel"
                      {...register('phone', {
                        required: 'Phone number is required',
                        validate: (value) => {
                          const validation = validateNigerianPhone(value);
                          return validation.isValid || validation.message;
                        },
                        onChange: (e) => {
                          // Format as user types
                          const formatted = formatPhoneNumber(e.target.value);
                          e.target.value = formatted;
                        }
                      })}
                      className={`w-full pl-16 pr-4 py-2 border rounded-lg focus:outline-none transition-colors ${
                        errors.phone 
                          ? 'border-red-300 focus:border-red-500 bg-red-50' 
                          : 'border-gray-200 focus:border-pink-500'
                      }`}
                      placeholder="8012 345 678"
                      maxLength={13} // Account for spaces in formatting
                    />
                    {errors.phone && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  {errors.phone && (
                    <p className="flex items-center gap-1 text-red-500 text-sm mt-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.phone.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a valid Nigerian phone number (e.g., 0801 234 5678)
                  </p>
                </div>

                {/* Optional Account Creation */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium">Create an Account</h3>
                      <p className="text-sm text-gray-500">
                        Save your details for faster checkout next time
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('createAccount')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                    </label>
                  </div>

                  {watch('createAccount') && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium mb-2">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          {...register('password', {
                            required: watch('createAccount') ? 'Password is required' : false,
                            minLength: {
                              value: 8,
                              message: 'Password must be at least 8 characters'
                            }
                          })}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                          placeholder="Create a password"
                        />
                        {errors.password && <FormError message={errors.password.message!} />}
                      </div>

                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                          Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          {...register('confirmPassword', {
                            required: watch('createAccount') ? 'Please confirm your password' : false,
                            validate: value => 
                              !watch('createAccount') || 
                              value === watch('password') || 
                              'Passwords do not match'
                          })}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                          placeholder="Confirm your password"
                        />
                        {errors.confirmPassword && <FormError message={errors.confirmPassword.message!} />}
                      </div>

                      <div className="flex items-start gap-3 text-sm text-gray-500">
                        <input
                          type="checkbox"
                          {...register('newsletter')}
                          className="mt-1 rounded text-pink-500 focus:ring-pink-500"
                        />
                        <label>
                          Keep me updated with news and exclusive offers
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <SectionHeader 
                number={2} 
                title="Shipping Address" 
                subtitle="Choose where you want your order delivered"
              />
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('firstName', { required: 'First name is required' })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                    />
                    {errors.firstName && <FormError message={errors.firstName.message!} />}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('lastName', { required: 'Last name is required' })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                    />
                    {errors.lastName && <FormError message={errors.lastName.message!} />}
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium mb-2">
                    Delivery Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('address', { required: 'Address is required' })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                    placeholder="Street address, apartment, suite, etc."
                  />
                  {errors.address && <FormError message={errors.address.message!} />}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('city', { required: 'City is required' })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                    />
                    {errors.city && <FormError message={errors.city.message!} />}
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium mb-2">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('state', { required: 'State is required' })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                    />
                    {errors.state && <FormError message={errors.state.message!} />}
                  </div>
                </div>

                <div>
                  <label htmlFor="additionalInfo" className="block text-sm font-medium mb-2">
                    Additional Information
                  </label>
                  <textarea
                    {...register('additionalInfo')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                    placeholder="Additional delivery instructions (optional)"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <SectionHeader 
                number={3} 
                title="Delivery Method" 
                subtitle="Select your preferred shipping option"
              />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="font-medium">{shippingLocations[shippingMethod].name}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsShippingModalOpen(true)}
                  className="text-sm text-pink-500 hover:text-pink-600 font-medium flex items-center gap-1"
                >
                  Change
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">Estimated Delivery Time</p>
                  <p className="text-gray-500 text-sm mt-1">
                    {shippingLocations[shippingMethod].deliveryTime}
                  </p>
                  {shippingLocations[shippingMethod].details && (
                    <p className="text-gray-500 text-sm mt-2 p-3 bg-gray-100 rounded-lg">
                      {shippingLocations[shippingMethod].details}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Shipping Method Modal */}
            {isShippingModalOpen && (
              <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="fixed inset-0 bg-black/50" onClick={() => setIsShippingModalOpen(false)} />
                <div className="relative min-h-screen flex items-center justify-center p-4">
                  <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                      <h2 className="text-xl font-bold">Select Shipping Location</h2>
                      <button 
                        onClick={() => setIsShippingModalOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto max-h-[60vh]">
                      <div className="space-y-3">
                        {Object.entries(shippingLocations).map(([key, location]) => (
                          <label key={key} className="block">
                            <div 
                              className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                shippingMethod === key 
                                  ? 'border-pink-500 bg-pink-50/50' 
                                  : 'border-gray-200 hover:border-pink-200'
                              }`}
                            >
                              <input
                                type="radio"
                                name="shipping_method"
                                value={key}
                                checked={shippingMethod === key}
                                onChange={(e) => {
                                  setShippingMethod(e.target.value);
                                  setIsShippingModalOpen(false);
                                }}
                                className="mr-4 text-pink-500 focus:ring-pink-500"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{location.name}</span>
                                  <span className="font-medium">
                                    {location.price === 0 ? 'Free' : `₦${location.price.toLocaleString()}`}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                  {location.deliveryTime}
                                </p>
                                {location.details && (
                                  <p className="text-sm text-gray-500 mt-2 p-3 bg-gray-100 rounded-lg">
                                    {location.details}
                                  </p>
                                )}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <SectionHeader 
                number={4} 
                title="Payment Method" 
                subtitle="Choose how you'd like to pay"
              />
              <div className="space-y-4">
                <label className="block">
                  <div className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === 'paystack' 
                      ? 'border-pink-500 bg-pink-50/50' 
                      : 'border-gray-200 hover:border-pink-200'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="paystack"
                      checked={paymentMethod === 'paystack'}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="mr-4 text-pink-500 focus:ring-pink-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                        <div>
                          <span className="font-medium">Pay Online</span>
                          <p className="text-sm text-gray-500 mt-1">
                            Secure payment via Paystack
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Image src="/visa.svg" alt="Visa" width={32} height={20} />
                      <Image src="/mastercard.svg" alt="Mastercard" width={32} height={20} />
                    </div>
                  </div>
                </label>

                <label className="block">
                  <div className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === 'transfer' 
                      ? 'border-pink-500 bg-pink-50/50' 
                      : 'border-gray-200 hover:border-pink-200'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="transfer"
                      checked={paymentMethod === 'transfer'}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="mr-4 text-pink-500 focus:ring-pink-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-gray-400" />
                        <div>
                          <span className="font-medium">Bank Transfer</span>
                          <p className="text-sm text-gray-500 mt-1">
                            Pay directly to our bank account
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </label>

                {paymentMethod === 'transfer' && (
                  <div className="mt-4 p-6 bg-gray-50 rounded-xl space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-lg">
                        <p className="text-sm text-gray-500">Bank Name</p>
                        <p className="font-medium mt-1">First Bank</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg">
                        <p className="text-sm text-gray-500">Account Number</p>
                        <p className="font-medium mt-1">0123456789</p>
                      </div>
                    </div>
                    <div className="p-4 bg-white rounded-lg">
                      <p className="text-sm text-gray-500">Account Name</p>
                      <p className="font-medium mt-1">Midessories LTD</p>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg text-blue-600">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">
                        Please use your order number as payment reference. Your order will be shipped once we receive the payment.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm lg:sticky lg:top-24">
              <h2 className="text-lg font-semibold mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-0 right-0 bg-gray-900 text-white text-xs px-1.5 py-0.5 rounded-bl">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        {item.color && `Color: ${item.color}`}
                        {item.size && ` • Size: ${item.size}`}
                      </p>
                      <p className="text-sm font-medium mt-1">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3 pb-6 border-b">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-medium">
                    {shippingMethod === 'standard' ? 'Free' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
              </div>
              <div className="flex justify-between py-6 border-b">
                <span className="text-lg font-bold">Total</span>
                <span className="text-lg font-bold">${finalTotal.toFixed(2)}</span>
              </div>
              <button 
                type="submit"
                disabled={isProcessing}
                className={`w-full py-4 rounded-xl mt-6 transition-colors ${
                  isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-pink-500 hover:bg-pink-600'
                } text-white flex items-center justify-center gap-2`}
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  paymentMethod === 'paystack' ? 'Pay Now' : 'Complete Order'
                )}
              </button>
              <p className="text-xs text-gray-500 text-center mt-4">
                By placing your order, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </form>

      {showPaystack && orderReference && (
        <PaystackPayment
          email={watch('email')}
          amount={finalTotal}
          reference={orderReference}
          onSuccess={handlePaymentSuccess}
          onClose={handlePaymentClose}
        />
      )}

      {paymentError && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl mb-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{paymentError}</p>
        </div>
      )}
    </div>
  );
} 