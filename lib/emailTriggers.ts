import { formatNaira } from './utils';

// Helper function to call the email API
async function callEmailApi(to: string, templateName: string, data: any) {
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        templateName,
        data,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Email API error: ${errorData.error || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling email API:', error);
    throw error;
  }
}

// Trigger email when a new order is placed
export async function triggerOrderConfirmationEmail(order: any, user: any) {
  const orderItems = order.items.map((item: any) => ({
    name: item.name,
    quantity: item.quantity,
    price: formatNaira(item.price * item.quantity)
  }));
  
  const data = {
    orderId: order.id,
    customerName: `${user.firstName} ${user.lastName}`,
    date: new Date(order.createdAt).toLocaleDateString(),
    total: formatNaira(order.total),
    items: orderItems,
    shippingAddress: {
      name: `${order.shipping.address.firstName} ${order.shipping.address.lastName}`,
      address: order.shipping.address.address,
      city: order.shipping.address.city,
      state: order.shipping.address.state
    },
    orderUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/account?tab=orders&order=${order.id}`
  };
  
  return callEmailApi(user.email, 'orderConfirmation', data);
}

// Trigger email when an order ships
export async function triggerShippingConfirmationEmail(order: any, user: any, trackingInfo: any) {
  const data = {
    orderId: order.id,
    customerName: `${user.firstName} ${user.lastName}`,
    trackingNumber: trackingInfo.trackingNumber,
    carrier: trackingInfo.carrier,
    estimatedDelivery: trackingInfo.estimatedDelivery,
    trackingUrl: trackingInfo.trackingUrl,
    items: order.items.map((item: any) => ({
      name: item.name,
      quantity: item.quantity
    })),
    orderUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/account?tab=orders&order=${order.id}`
  };
  
  return callEmailApi(user.email, 'shippingConfirmation', data);
}

// Trigger welcome email when a user registers
export async function triggerWelcomeEmail(user: any) {
  const data = {
    firstName: user.firstName,
    shopUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/shop`
  };
  
  return callEmailApi(user.email, 'welcomeEmail', data);
}

// Trigger password reset email
export async function triggerPasswordResetEmail(email: string, resetToken: string) {
  const data = {
    resetUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${resetToken}`
  };
  
  return callEmailApi(email, 'passwordReset', data);
}

// Trigger abandoned cart email
export async function triggerAbandonedCartEmail(user: any, cartItems: any[]) {
  const data = {
    customerName: user.firstName,
    items: cartItems.map(item => ({
      name: item.name,
      price: formatNaira(item.price)
    })),
    cartUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/cart`
  };
  
  return callEmailApi(user.email, 'abandonedCart', data);
}

// Trigger order delivered email
export async function triggerOrderDeliveredEmail(order: any, user: any) {
  const data = {
    orderId: order.id,
    customerName: `${user.firstName} ${user.lastName}`,
    items: order.items.map((item: any) => ({
      name: item.name,
      quantity: item.quantity
    })),
    orderUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/account?tab=orders&order=${order.id}`,
    reviewUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/review?order=${order.id}`
  };
  
  return callEmailApi(user.email, 'orderDelivered', data);
}

// Trigger back in stock notification
export async function triggerBackInStockEmail(user: any, product: any) {
  const data = {
    firstName: user.firstName,
    productName: product.name,
    productImage: product.images[0],
    productUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/product/${product.id}`,
    price: formatNaira(product.price)
  };
  
  return callEmailApi(user.email, 'backInStock', data);
}

// Trigger review request email
export async function triggerReviewRequestEmail(user: any, order: any) {
  const data = {
    firstName: user.firstName,
    orderId: order.id,
    items: order.items.map((item: any) => ({
      name: item.name,
      image: item.image,
      productUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/product/${item.productId}`,
      reviewUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/review/${item.productId}?order=${order.id}`
    })),
    orderDate: new Date(order.createdAt).toLocaleDateString()
  };
  
  return callEmailApi(user.email, 'reviewRequest', data);
}

// Trigger order canceled email
export async function triggerOrderCanceledEmail(order: any, user: any, reason: string) {
  const data = {
    orderId: order.id,
    customerName: `${user.firstName} ${user.lastName}`,
    cancellationReason: reason,
    items: order.items.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      price: formatNaira(item.price * item.quantity)
    })),
    total: formatNaira(order.total),
    refundAmount: order.paymentStatus === 'paid' ? formatNaira(order.total) : 'N/A',
    supportEmail: 'support@midessories.com'
  };
  
  return callEmailApi(user.email, 'orderCanceled', data);
}

// Trigger price drop alert
export async function triggerPriceDropEmail(user: any, product: any, oldPrice: number, newPrice: number) {
  const data = {
    firstName: user.firstName,
    productName: product.name,
    productImage: product.images[0],
    productUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/product/${product.id}`,
    oldPrice: formatNaira(oldPrice),
    newPrice: formatNaira(newPrice),
    savingsPercent: Math.round(((oldPrice - newPrice) / oldPrice) * 100)
  };
  
  return callEmailApi(user.email, 'priceDrop', data);
}

// Trigger newsletter email
export async function triggerNewsletterEmail(email: string, newsletterData: any) {
  const data = {
    ...newsletterData,
    unsubscribeUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}`
  };
  
  return callEmailApi(email, 'newsletter', data);
}

// Trigger order refund email
export async function triggerRefundEmail(order: any, user: any, refundAmount: number) {
  const data = {
    orderId: order.id,
    customerName: `${user.firstName} ${user.lastName}`,
    refundAmount: formatNaira(refundAmount),
    refundDate: new Date().toLocaleDateString(),
    orderUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/account?tab=orders&order=${order.id}`,
    supportEmail: 'support@midessories.com'
  };
  
  return callEmailApi(user.email, 'refundProcessed', data);
}

// Trigger account verification email
export async function triggerVerificationEmail(user: any, verificationToken: string) {
  const data = {
    firstName: user.firstName,
    verificationUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/verify-email?token=${verificationToken}`
  };
  
  return callEmailApi(user.email, 'accountVerification', data);
}

// Trigger transfer order email
export async function triggerTransferOrderEmail(order: any, user: any) {
  const orderItems = order.items.map((item: any) => ({
    name: item.name,
    quantity: item.quantity,
    price: formatNaira(item.price * item.quantity)
  }));
  
  const data = {
    orderId: order.id,
    customerName: `${user.firstName} ${user.lastName}`,
    date: new Date(order.createdAt).toLocaleDateString(),
    total: formatNaira(order.total),
    items: orderItems,
    shippingAddress: {
      name: `${order.shipping.address.firstName} ${order.shipping.address.lastName}`,
      address: order.shipping.address.address,
      city: order.shipping.address.city,
      state: order.shipping.address.state
    },
    bankDetails: {
      bank: "First Bank",
      accountNumber: "0123456789",
      accountName: "Midessories LTD"
    },
    orderUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/account?tab=orders&order=${order.id}`
  };
  
  return callEmailApi(user.email, 'transferOrder', data);
} 