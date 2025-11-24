import { Review } from '@/lib/api';

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-500' : 'text-gray-300'}>
        ⭐
      </span>
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-semibold text-gray-800">{review.user}</h4>
          <div className="flex items-center space-x-1 mt-1">
            {renderStars(review.rating)}
          </div>
        </div>
        <span className="text-xs text-gray-500">
          {new Date(review.created_at).toLocaleDateString()}
        </span>
      </div>
      
      <p className="text-gray-700 text-sm mt-3">{review.comment}</p>
    </div>
  );
}
