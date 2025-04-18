'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash, 
  X, 
  Loader2,
  MoveUp,
  MoveDown,
  Image as ImageIcon
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
  orderBy 
} from 'firebase/firestore';
import { Category } from '@/types/category';
import { uploadToImgBB } from '@/lib/upload';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    parentId: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

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
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrl = formData.image;
      if (imageFile) {
        imageUrl = await uploadToImgBB(imageFile);
      }

      const categoryData = {
        name: formData.name,
        slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description,
        image: imageUrl,
        parentId: formData.parentId || null,
        order: selectedCategory?.order || categories.length,
        updatedAt: new Date(),
        createdAt: selectedCategory?.createdAt || new Date(),
      };

      if (selectedCategory) {
        await updateDoc(doc(db, 'categories', selectedCategory.id), categoryData);
      } else {
        await addDoc(collection(db, 'categories'), categoryData);
      }

      setIsModalOpen(false);
      setSelectedCategory(null);
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error uploading image or saving category');
    } finally {
      setUploading(false);
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      image: '',
      parentId: '',
    });
    setImageFile(null);
  }

  async function handleDelete(categoryId: string) {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteDoc(doc(db, 'categories', categoryId));
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category');
      }
    }
  }

  async function handleReorder(categoryId: string, direction: 'up' | 'down') {
    const currentIndex = categories.findIndex(c => c.id === categoryId);
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === categories.length - 1)
    ) {
      return;
    }

    const newCategories = [...categories];
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Swap order values
    const tempOrder = newCategories[currentIndex].order;
    newCategories[currentIndex].order = newCategories[swapIndex].order;
    newCategories[swapIndex].order = tempOrder;

    // Update in Firestore
    try {
      await Promise.all([
        updateDoc(doc(db, 'categories', newCategories[currentIndex].id), {
          order: newCategories[currentIndex].order
        }),
        updateDoc(doc(db, 'categories', newCategories[swapIndex].id), {
          order: newCategories[swapIndex].order
        })
      ]);
      fetchCategories();
    } catch (error) {
      console.error('Error reordering categories:', error);
      alert('Error reordering categories');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-pink-500 text-white px-4 py-2 rounded-xl hover:bg-pink-600 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Description</th>
                  <th className="text-left p-4">Parent</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {category.image && (
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden">
                            <Image
                              src={category.image}
                              alt={category.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-500">{category.description}</td>
                    <td className="p-4 text-gray-500">
                      {category.parentId ? 
                        categories.find(c => c.id === category.parentId)?.name : 
                        '-'
                      }
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleReorder(category.id, 'up')}
                          className="p-2 hover:bg-gray-50 rounded-lg"
                          disabled={categories.indexOf(category) === 0}
                        >
                          <MoveUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReorder(category.id, 'down')}
                          className="p-2 hover:bg-gray-50 rounded-lg"
                          disabled={categories.indexOf(category) === categories.length - 1}
                        >
                          <MoveDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCategory(category);
                            setFormData({
                              name: category.name,
                              description: category.description || '',
                              image: category.image || '',
                              parentId: category.parentId || '',
                            });
                            setIsModalOpen(true);
                          }}
                          className="p-2 hover:bg-gray-50 rounded-lg text-blue-500"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2 hover:bg-gray-50 rounded-lg text-red-500"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {selectedCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedCategory(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
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
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Category
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                >
                  <option value="">None</option>
                  {categories
                    .filter(c => c.id !== selectedCategory?.id)
                    .map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image
                </label>
                {formData.image && (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden mb-4">
                    <Image
                      src={formData.image}
                      alt="Category image"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: '' })}
                      className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-lg hover:bg-red-50"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-pink-500 text-white py-2 rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading && <Loader2 className="w-5 h-5 animate-spin" />}
                {uploading ? 'Uploading...' : selectedCategory ? 'Update Category' : 'Add Category'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 