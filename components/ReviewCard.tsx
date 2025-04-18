'use client';

import { Star, ThumbsUp, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { Review } from '@/types/review';

export default function ReviewCard({ review }: { review: Review }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(review.likes);

  const handleLike = () => {
    if (isLiked) {
      setLikes(prev => prev - 1);
    } else {
      setLikes(prev => prev + 1);
    }
    setIsLiked(!isLiked);
  };

  return (
    <div className="border-b border-gray-200 py-8">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-100 relative overflow-hidden">
            {review.user.avatar ? (
              <Image
                src={review.user.avatar}
                alt={review.user.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                {review.user.name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h4 className="font-medium">{review.user.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={14}
                    className={`${
                      star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500">{review.date}</span>
              {review.verified && (
                <>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-green-600">Verified Purchase</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h5 className="font-medium mb-2">{review.title}</h5>
        <p className="text-gray-600">{review.comment}</p>
      </div>

      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mt-4">
          {review.images.map((image, index) => (
            <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden">
              <Image
                src={image}
                alt={`Review image ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            isLiked
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <ThumbsUp size={14} />
          <span>Helpful ({likes})</span>
        </button>
      </div>
    </div>
  );
} 