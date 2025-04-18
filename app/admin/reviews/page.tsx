'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Star,
  ThumbsUp,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  MoreVertical,
  X,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { Review } from '@/types/review';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Review['status'] | 'all'>('all');
  const [response, setResponse] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    try {
      const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateReviewStatus(reviewId: string, status: Review['status']) {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        status,
        updatedAt: new Date()
      });
      fetchReviews();
    } catch (error) {
      console.error('Error updating review status:', error);
      alert('Error updating review status');
    }
  }

  async function respondToReview(reviewId: string) {
    if (!response.trim()) return;

    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        response: {
          text: response,
          date: new Date()
        },
        updatedAt: new Date()
      });
      setResponse('');
      fetchReviews();
    } catch (error) {
      console.error('Error responding to review:', error);
      alert('Error responding to review');
    }
  }

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reviews</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Review['status'] | 'all')}
            className="px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map(review => (
            <div 
              key={review.id} 
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-medium">{review.customerName}</div>
                    <div className="flex items-center text-yellow-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'stroke-current'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <h3 className="font-medium mb-1">{review.title}</h3>
                  <p className="text-gray-600">{review.comment}</p>
                  
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {review.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Review image ${index + 1}`}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    review.status === 'approved' 
                      ? 'bg-green-50 text-green-600'
                      : review.status === 'rejected'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-yellow-50 text-yellow-600'
                  }`}>
                    {review.status}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedReview(review);
                      setIsModalOpen(true);
                    }}
                    className="p-2 hover:bg-gray-50 rounded-lg"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {review.response && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium mb-2">Your Response</div>
                    <p className="text-gray-600">{review.response.text}</p>
                    <div className="text-sm text-gray-500 mt-2">
                      {new Date(review.response.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Details Modal */}
      {isModalOpen && selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            {/* Modal content */}
          </div>
        </div>
      )}
    </div>
  );
} 