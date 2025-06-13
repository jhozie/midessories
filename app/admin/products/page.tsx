'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash, 
  X,
  Upload,
  Loader2,
  Tag,
  Box,
  Truck
} from 'lucide-react';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc,
  doc, 
  updateDoc,
  query,
  orderBy,
  getDoc
} from 'firebase/firestore';
import { Product } from '@/types/product';
import { Category } from '@/types/category';
import { VariantOption, ProductVariant } from '@/types/product';
import Link from 'next/link';
import { generateSlug, formatNaira } from '@/lib/utils';
import { triggerBackInStockEmail } from '@/lib/emailTriggers';
import { getBackInStockSubscribers } from '@/lib/productService';

async function uploadToImgBB(file: File) {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to upload image');
  }
  return data.data.url;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'variants' | 'shipping' | 'seo'>('basic');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    compareAtPrice: '',
    category: '',
    subcategory: '',
    images: [] as string[],
    stock: '',
    sku: '',
    barcode: '',
    brand: '',
    tags: [] as string[],
    specifications: {} as { [key: string]: string },
    status: 'draft' as 'active' | 'draft' | 'archived',
    featured: false,
    isNewArrival: false,
    newArrivalUntil: '',
    variantOptions: [] as VariantOption[],
    variants: [] as ProductVariant[],
    seo: {
      title: '',
      description: '',
      keywords: [] as string[],
    },
    shipping: {
      weight: '',
      dimensions: {
        length: '',
        width: '',
        height: '',
      },
      freeShipping: false,
    },
    hasVariants: false,
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isQuickCategoryModalOpen, setIsQuickCategoryModalOpen] = useState(false);
  const [quickCategoryForm, setQuickCategoryForm] = useState({
    name: '',
    description: '',
    image: '',
  });
  const [bulkEdit, setBulkEdit] = useState({
    price: '',
    stock: '',
    applyToAll: false
  });
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState('');
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  async function fetchProducts() {
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        newArrivalUntil: doc.data().newArrivalUntil?.toDate()
      })) as Product[];
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const q = query(collection(db, 'categories'), orderBy('order'));
      const snapshot = await getDocs(q);
      const categoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);

    try {
      // Upload images if there are any new ones
      let uploadedImages = [...formData.images];
      
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const imageUrl = await uploadToImgBB(file);
          uploadedImages.push(imageUrl);
        }
      }
      
      // Prepare product data
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
        category: formData.category,
        subcategory: formData.subcategory || '',
        images: uploadedImages,
        stock: parseInt(formData.stock) || 0,
        sku: formData.sku,
        barcode: formData.barcode || '',
        brand: formData.brand || '',
        tags: formData.tags,
        specifications: formData.specifications,
        status: formData.status,
        featured: formData.featured,
        isNewArrival: formData.isNewArrival,
        newArrivalUntil: formData.newArrivalUntil ? new Date(formData.newArrivalUntil) : null,
        hasVariants: formData.hasVariants,
        variantOptions: formData.hasVariants ? formData.variantOptions : [],
        variants: formData.hasVariants ? formData.variants : [],
        ratings: {
          average: 0,
          count: 0
        },
        seo: {
          title: formData.seo.title || formData.name,
          description: formData.seo.description || formData.description.substring(0, 160),
          keywords: formData.seo.keywords
        },
        shipping: {
          weight: parseFloat(formData.shipping.weight) || 0,
          dimensions: {
            length: parseFloat(formData.shipping.dimensions.length) || 0,
            width: parseFloat(formData.shipping.dimensions.width) || 0,
            height: parseFloat(formData.shipping.dimensions.height) || 0
          },
          freeShipping: formData.shipping.freeShipping
        },
        updatedAt: new Date()
      };

      if (selectedProduct) {
        await updateDoc(doc(db, 'products', selectedProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), productData);
      }

      setIsModalOpen(false);
      setSelectedProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      price: '',
      compareAtPrice: '',
      category: '',
      subcategory: '',
      images: [],
      stock: '',
      sku: '',
      barcode: '',
      brand: '',
      tags: [],
      specifications: {},
      status: 'draft',
      featured: false,
      isNewArrival: false,
      newArrivalUntil: '',
      variantOptions: [],
      variants: [],
      seo: {
        title: '',
        description: '',
        keywords: [],
      },
      shipping: {
        weight: '',
        dimensions: {
          length: '',
          width: '',
          height: '',
        },
        freeShipping: false,
      },
      hasVariants: false,
    });
    setImageFiles([]);
  }

  async function handleDelete(productId: string) {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', productId));
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  }

  function handleEdit(product: Product) {
    setSelectedProduct(product);
    setProductFormData(product);
    setIsModalOpen(true);
  }

  function setProductFormData(product: Product) {
    setFormData({
      ...formData,
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      compareAtPrice: product.compareAtPrice?.toString() || '',
      category: product.category,
      subcategory: product.subcategory || '',
      images: product.images || [],
      stock: product.stock.toString(),
      sku: product.sku || '',
      barcode: product.barcode || '',
      brand: product.brand || '',
      tags: product.tags || [],
      specifications: product.specifications || {},
      status: product.status || 'draft',
      featured: product.featured || false,
      isNewArrival: product.isNewArrival || false,
      newArrivalUntil: product.newArrivalUntil ? (product.newArrivalUntil as Date).toISOString().split('T')[0] : '',
      variantOptions: product.variantOptions || [],
      variants: product.variants || [],
      seo: {
        title: product.seo?.title || '',
        description: product.seo?.description || '',
        keywords: product.seo?.keywords || [],
      },
      shipping: {
        weight: product.shipping?.weight?.toString() || '',
        dimensions: {
          length: product.shipping?.dimensions?.length?.toString() || '',
          width: product.shipping?.dimensions?.width?.toString() || '',
          height: product.shipping?.dimensions?.height?.toString() || '',
        },
        freeShipping: product.shipping?.freeShipping || false,
      },
      hasVariants: product.hasVariants,
    });
  }

  function generateVariantCombinations() {
    const options = formData.variantOptions;
    const combinations = cartesianProduct(
      options.map(opt => opt.values)
    );
    
    const newVariants: ProductVariant[] = combinations.map(combo => {
      const attributes: { [key: string]: string } = {};
      options.forEach((opt, index) => {
        attributes[opt.name] = combo[index];
      });
      
      return {
        id: Date.now().toString() + Math.random(),
        sku: '',
        price: parseFloat(formData.price) || 0,
        stock: 0,
        attributes,
        images: []
      };
    });

    setFormData({
      ...formData,
      variants: newVariants
    });
  }

  function cartesianProduct(arrays: any[][]): any[][] {
    return arrays.reduce((acc, curr) => 
      acc.flatMap(combo => curr.map(item => [...combo, item])),
      [[]]
    );
  }

  const handleCategoryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCategoryImageFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setCategoryImagePreview(previewUrl);
    }
  };

  async function handleQuickCategoryCreate(e: React.FormEvent) {
    e.preventDefault();
    setUploadingCategoryImage(true);

    try {
      let imageUrl = '/placeholder.jpg';

      // Upload image if selected
      if (categoryImageFile) {
        imageUrl = await uploadToImgBB(categoryImageFile);
      }

      const categoryRef = await addDoc(collection(db, 'categories'), {
        name: quickCategoryForm.name,
        description: quickCategoryForm.description,
        image: imageUrl,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Refresh categories
      fetchCategories();
      
      // Reset form and states
      setIsQuickCategoryModalOpen(false);
      setQuickCategoryForm({
        name: '',
        description: '',
        image: ''
      });
      setCategoryImageFile(null);
      setCategoryImagePreview('');
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Error creating category');
    } finally {
      setUploadingCategoryImage(false);
    }
  }

  function handleBulkUpdate() {
    if (!bulkEdit.price && !bulkEdit.stock) return;
    
    const newVariants = formData.variants.map(variant => ({
      ...variant,
      ...(bulkEdit.price && { price: parseFloat(bulkEdit.price) || 0 }),
      ...(bulkEdit.stock && { stock: parseInt(bulkEdit.stock) || 0 })
    }));

    setFormData({ ...formData, variants: newVariants });
    setBulkEdit({ price: '', stock: '', applyToAll: false });
  }

  function generateSKU(variant: ProductVariant) {
    const baseSlug = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
    const variantSlug = Object.values(variant.attributes)
      .map(value => value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 3))
      .join('');
    
    return `${baseSlug}-${variantSlug}`;
  }

  function generateAllSKUs() {
    const newVariants = formData.variants.map(variant => ({
      ...variant,
      sku: generateSKU(variant)
    }));

    setFormData({ ...formData, variants: newVariants });
  }

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, '-').slice(0, 50);
  }

  async function updateProductInventory(productId: string, newInventory: number) {
    try {
      const productRef = doc(db, 'products', productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        console.error('Product not found');
        return;
      }
      
      const productData = productSnap.data();
      
      // Check if product was out of stock but now has inventory
      if (productData && productData.inventory <= 0 && newInventory > 0) {
        // Get subscribers who want to be notified
        const subscribers = await getBackInStockSubscribers(productId);
        
        // Send back in stock emails
        for (const subscriber of subscribers) {
          await triggerBackInStockEmail(subscriber, {
            id: productId,
            name: productData.name,
            images: productData.images,
            price: productData.price
          });
        }
        
        // Clear the notification list
        await updateDoc(productRef, {
          'backInStockSubscribers': []
        });
      }
      
      // Update inventory
      await updateDoc(productRef, {
        inventory: newInventory,
        updatedAt: new Date()
      });
      
      // Refresh products
      fetchProducts();
    } catch (error) {
      console.error('Error updating product inventory:', error);
      alert('Error updating product inventory');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Products</h1>
          <p className="text-gray-600">Manage your product inventory</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-pink-500 text-white px-4 py-2 rounded-xl hover:bg-pink-600 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
              />
            </div>
            <button className="px-4 py-2 border border-gray-200 rounded-xl hover:border-pink-500 transition-colors flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
          </div>
        ) : (
          <div className="divide-y">
            {products.map((product) => (
              <div key={product.id} className="p-6 flex items-center gap-6">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <Link 
                    href={`/product/${generateSlug(product.name)}-${product.id}`}
                    className="text-pink-500 hover:text-pink-600"
                  >
                    {product.name}
                  </Link>
                  <p className="text-sm text-gray-500">{product.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {formatNaira(product.price)}
                  </p>
                  <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-2 hover:bg-gray-50 rounded-lg"
                  >
                    <Edit className="w-5 h-5 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 hover:bg-gray-50 rounded-lg"
                  >
                    <Trash className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {selectedProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedProduct(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 pt-4 border-b border-gray-100">
              <div className="flex gap-4">
                {['basic', 'variants', 'shipping', 'seo'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg -mb-px ${
                      activeTab === tab 
                        ? 'text-pink-500 border-b-2 border-pink-500' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {activeTab === 'basic' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Brand
                      </label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price
                      </label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Compare at Price
                      </label>
                      <input
                        type="number"
                        value={formData.compareAtPrice}
                        onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SKU
                      </label>
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Barcode
                      </label>
                      <input
                        type="text"
                        value={formData.barcode}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stock
                      </label>
                      <input
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                          required
                        >
                          <option value="">Select a category</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setIsQuickCategoryModalOpen(true)}
                          className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center"
                        >
                          <Plus className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subcategory
                      </label>
                      <input
                        type="text"
                        value={formData.subcategory}
                        onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-pink-50 text-pink-500 rounded-full text-sm flex items-center gap-2"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => {
                              const newTags = [...formData.tags];
                              newTags.splice(index, 1);
                              setFormData({ ...formData, tags: newTags });
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
                            if (value && !formData.tags.includes(value)) {
                              setFormData({ 
                                ...formData, 
                                tags: [...formData.tags, value] 
                              });
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Images
                    </label>
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden">
                          <Image
                            src={image}
                            alt={`Product image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = [...formData.images];
                              newImages.splice(index, 1);
                              setFormData({ ...formData, images: newImages });
                            }}
                            className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-lg hover:bg-red-50"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                    />
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({
                            ...formData,
                            status: e.target.value as 'active' | 'draft' | 'archived'
                          })}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                        >
                          <option value="active">Active</option>
                          <option value="draft">Draft</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                      
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="featured"
                            checked={formData.featured}
                            onChange={(e) => setFormData({
                              ...formData,
                              featured: e.target.checked
                            })}
                            className="h-4 w-4 text-pink-500 focus:ring-pink-500 border-gray-300 rounded"
                          />
                          <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                            Featured Product
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="isNewArrival"
                            checked={formData.isNewArrival}
                            onChange={(e) => setFormData({
                              ...formData,
                              isNewArrival: e.target.checked
                            })}
                            className="h-4 w-4 text-pink-500 focus:ring-pink-500 border-gray-300 rounded"
                          />
                          <label htmlFor="isNewArrival" className="ml-2 block text-sm text-gray-700">
                            Mark as New Arrival
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {formData.isNewArrival && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Arrival Until (optional)
                        </label>
                        <input
                          type="date"
                          value={formData.newArrivalUntil}
                          onChange={(e) => setFormData({
                            ...formData,
                            newArrivalUntil: e.target.value
                          })}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          If set, the product will automatically stop being a new arrival after this date.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'variants' && (
                <div className="space-y-6">
                  {/* Step 1: Define Variant Options */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium">Step 1: Define Variant Options</h3>
                        <p className="text-sm text-gray-500">Add options like Size, Color, Material etc.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            variantOptions: [
                              ...formData.variantOptions,
                              { name: '', values: [] }
                            ]
                          });
                        }}
                        className="text-sm text-pink-500 hover:text-pink-600 font-medium flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Add Option
                      </button>
                    </div>

                    {formData.variantOptions.map((option, optionIndex) => (
                      <div key={optionIndex} className="mb-6 last:mb-0 bg-white p-4 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-4 mb-2">
                          <input
                            type="text"
                            placeholder="Option name (e.g., Size, Color)"
                            value={option.name}
                            onChange={(e) => {
                              const newOptions = [...formData.variantOptions];
                              newOptions[optionIndex].name = e.target.value;
                              setFormData({
                                ...formData,
                                variantOptions: newOptions
                              });
                            }}
                            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newOptions = [...formData.variantOptions];
                              newOptions.splice(optionIndex, 1);
                              setFormData({
                                ...formData,
                                variantOptions: newOptions
                              });
                            }}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {option.values.map((value, valueIndex) => (
                            <span 
                              key={valueIndex}
                              className="px-3 py-1 bg-pink-50 text-pink-500 rounded-full text-sm flex items-center gap-2"
                            >
                              {value}
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions = [...formData.variantOptions];
                                  newOptions[optionIndex].values.splice(valueIndex, 1);
                                  setFormData({
                                    ...formData,
                                    variantOptions: newOptions
                                  });
                                }}
                                className="hover:bg-pink-100 rounded-full p-1"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          <input
                            type="text"
                            placeholder={`Add ${option.name || 'value'} and press Enter`}
                            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const value = e.currentTarget.value.trim();
                                if (value && !option.values.includes(value)) {
                                  const newOptions = [...formData.variantOptions];
                                  newOptions[optionIndex].values.push(value);
                                  setFormData({
                                    ...formData,
                                    variantOptions: newOptions
                                  });
                                  e.currentTarget.value = '';
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    ))}

                    {/* Step 2: Generate Combinations */}
                    <div className="mt-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-medium">Step 2: Generate Combinations</h3>
                        <p className="text-sm text-gray-500">
                          This will create all possible combinations of your variants
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={generateVariantCombinations}
                        disabled={!formData.variantOptions.every(opt => opt.name && opt.values.length > 0)}
                        className="w-full bg-pink-500 text-white py-2 rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Generate Variants
                      </button>
                    </div>
                  </div>

                  {/* Step 3: Configure Variants */}
                  {formData.variants.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium">Step 3: Configure Variants</h3>
                          <p className="text-sm text-gray-500">Set price, stock, and SKU for each variant</p>
                        </div>
                        <button
                          type="button"
                          onClick={generateAllSKUs}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium"
                        >
                          Generate All SKUs
                        </button>
                      </div>

                      {/* Bulk Edit Section */}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-4 mb-4">
                          <h4 className="font-medium">Bulk Edit</h4>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="applyToAll"
                              checked={bulkEdit.applyToAll}
                              onChange={(e) => setBulkEdit({ ...bulkEdit, applyToAll: e.target.checked })}
                              className="rounded text-pink-500 focus:ring-pink-500"
                            />
                            <label htmlFor="applyToAll" className="text-sm text-gray-700">
                              Apply to all variants
                            </label>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <input
                              type="number"
                              placeholder="Set price for all"
                              value={bulkEdit.price}
                              onChange={(e) => setBulkEdit({ ...bulkEdit, price: e.target.value })}
                              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              placeholder="Set stock for all"
                              value={bulkEdit.stock}
                              onChange={(e) => setBulkEdit({ ...bulkEdit, stock: e.target.value })}
                              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleBulkUpdate}
                            disabled={!bulkEdit.price && !bulkEdit.stock}
                            className="bg-pink-500 text-white px-4 py-2 rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Apply
                          </button>
                        </div>
                      </div>

                      {/* Variants List */}
                      {formData.variants.map((variant, index) => (
                        <div key={variant.id} className="bg-white border border-gray-200 rounded-xl p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium">
                              {Object.entries(variant.attributes)
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(' / ')}
                            </h4>
                            <button
                              type="button"
                              onClick={() => {
                                const newVariants = [...formData.variants];
                                newVariants.splice(index, 1);
                                setFormData({ ...formData, variants: newVariants });
                              }}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                                <span>SKU</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newVariants = [...formData.variants];
                                    newVariants[index].sku = generateSKU(variant);
                                    setFormData({ ...formData, variants: newVariants });
                                  }}
                                  className="text-xs text-pink-500 hover:text-pink-600"
                                >
                                  Generate
                                </button>
                              </label>
                              <input
                                type="text"
                                value={variant.sku}
                                onChange={(e) => {
                                  const newVariants = [...formData.variants];
                                  newVariants[index].sku = e.target.value;
                                  setFormData({ ...formData, variants: newVariants });
                                }}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Price
                              </label>
                              <input
                                type="number"
                                value={variant.price}
                                onChange={(e) => {
                                  const newVariants = [...formData.variants];
                                  newVariants[index].price = parseFloat(e.target.value) || 0;
                                  setFormData({ ...formData, variants: newVariants });
                                }}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Stock
                              </label>
                              <input
                                type="number"
                                value={variant.stock}
                                onChange={(e) => {
                                  const newVariants = [...formData.variants];
                                  newVariants[index].stock = parseInt(e.target.value) || 0;
                                  setFormData({ ...formData, variants: newVariants });
                                }}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'shipping' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        value={formData.shipping.weight}
                        onChange={(e) => setFormData({
                          ...formData,
                          shipping: {
                            ...formData.shipping,
                            weight: e.target.value
                          }
                        })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                        step="0.1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="freeShipping"
                        checked={formData.shipping.freeShipping}
                        onChange={(e) => setFormData({
                          ...formData,
                          shipping: {
                            ...formData.shipping,
                            freeShipping: e.target.checked
                          }
                        })}
                        className="rounded text-pink-500 focus:ring-pink-500"
                      />
                      <label htmlFor="freeShipping" className="text-sm text-gray-700">
                        Free Shipping
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dimensions (cm)
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Length</label>
                        <input
                          type="number"
                          value={formData.shipping.dimensions.length}
                          onChange={(e) => setFormData({
                            ...formData,
                            shipping: {
                              ...formData.shipping,
                              dimensions: {
                                ...formData.shipping.dimensions,
                                length: e.target.value
                              }
                            }
                          })}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Width</label>
                        <input
                          type="number"
                          value={formData.shipping.dimensions.width}
                          onChange={(e) => setFormData({
                            ...formData,
                            shipping: {
                              ...formData.shipping,
                              dimensions: {
                                ...formData.shipping.dimensions,
                                width: e.target.value
                              }
                            }
                          })}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Height</label>
                        <input
                          type="number"
                          value={formData.shipping.dimensions.height}
                          onChange={(e) => setFormData({
                            ...formData,
                            shipping: {
                              ...formData.shipping,
                              dimensions: {
                                ...formData.shipping.dimensions,
                                height: e.target.value
                              }
                            }
                          })}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                          step="0.1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'seo' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Title
                    </label>
                    <input
                      type="text"
                      value={formData.seo.title}
                      onChange={(e) => setFormData({
                        ...formData,
                        seo: {
                          ...formData.seo,
                          title: e.target.value
                        }
                      })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Recommended length: 50-60 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      value={formData.seo.description}
                      onChange={(e) => setFormData({
                        ...formData,
                        seo: {
                          ...formData.seo,
                          description: e.target.value
                        }
                      })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                      rows={3}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Recommended length: 150-160 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Keywords
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {formData.seo.keywords.map((keyword, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-pink-50 text-pink-500 rounded-full text-sm flex items-center gap-2"
                        >
                          {keyword}
                          <button
                            type="button"
                            onClick={() => {
                              const newKeywords = [...formData.seo.keywords];
                              newKeywords.splice(index, 1);
                              setFormData({
                                ...formData,
                                seo: {
                                  ...formData.seo,
                                  keywords: newKeywords
                                }
                              });
                            }}
                            className="hover:bg-pink-100 rounded-full p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder="Add keyword and press Enter"
                        className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const value = e.currentTarget.value.trim();
                            if (value && !formData.seo.keywords.includes(value)) {
                              setFormData({
                                ...formData,
                                seo: {
                                  ...formData.seo,
                                  keywords: [...formData.seo.keywords, value]
                                }
                              });
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-pink-500 text-white py-2 rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading && <Loader2 className="w-5 h-5 animate-spin" />}
                {uploading ? 'Uploading...' : selectedProduct ? 'Update Product' : 'Add Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Quick Category Modal */}
      {isQuickCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md my-8">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-xl font-bold">Add New Category</h2>
              <button
                onClick={() => setIsQuickCategoryModalOpen(false)}
                className="p-2 hover:bg-gray-50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <form onSubmit={handleQuickCategoryCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={quickCategoryForm.name}
                    onChange={(e) => setQuickCategoryForm({
                      ...quickCategoryForm,
                      name: e.target.value
                    })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Image
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCategoryImageChange}
                      className="hidden"
                      id="categoryImage"
                    />
                    <label
                      htmlFor="categoryImage"
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Choose Image
                    </label>
                    {categoryImageFile && (
                      <span className="text-sm text-gray-600">
                        {categoryImageFile.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Image Preview */}
                {categoryImagePreview && (
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <Image
                      src={categoryImagePreview}
                      alt="Category preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={quickCategoryForm.description}
                    onChange={(e) => setQuickCategoryForm({
                      ...quickCategoryForm,
                      description: e.target.value
                    })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                    rows={3}
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploadingCategoryImage}
                  className="w-full bg-pink-500 text-white py-2 rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploadingCategoryImage ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Create Category'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 