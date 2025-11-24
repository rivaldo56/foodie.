'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createReview } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import BackButton from '@/components/BackButton';
import { Star } from 'lucide-react';

function ReviewPageContent() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const mealId = parseInt(params.id as string);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setSubmitting(true);
    setError(null);

    const response = await createReview(mealId, rating, comment);

    if (response.data) {
      router.push(`/meals/${mealId}`);
    } else {
      setError(response.error || 'Failed to submit review');
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#0f1012] py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <BackButton label="Back to Meal" />
        </div>
        <div className="bg-[#16181d] rounded-3xl border border-white/5 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Write a Review</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-4xl focus:outline-none"
                  >
                    <span className={star <= rating ? 'text-yellow-500' : 'text-gray-300'}>
                      <Star className={`h-8 w-8 ${star <= rating ? 'fill-current text-yellow-500' : 'text-gray-300'}`} />
                    </span>
                  </button>
                ))}
                <span className="ml-4 text-lg font-semibold text-gray-700">
                  {rating} / 5
                </span>
              </div>
            </div>

            {/* Comment */}
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Your Review
              </label>
              <textarea
                id="comment"
                rows={6}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Share your experience with this meal..."
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:bg-gray-400"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <ProtectedRoute>
      <ReviewPageContent />
    </ProtectedRoute>
  );
}
