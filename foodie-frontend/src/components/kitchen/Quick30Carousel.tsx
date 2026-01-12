import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { kitchenService } from '../../services/kitchen';

export const Quick30Carousel = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  
  useEffect(() => {
    loadRecs();
  }, []);

  const loadRecs = async () => {
    try {
      const data = await kitchenService.getRecommendations(30);
      setRecommendations(data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="px-6 py-4">
       <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-white">Quick 30 <span className="text-accent">⚡</span></h2>
        <span className="text-xs text-muted">Under 30 mins</span>
      </div>

      <div className="grid gap-4">
        {recommendations.map((rec, idx) => (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="rounded-2xl bg-surface border border-surface-stroke overflow-hidden flex"
          >
            <div className="w-24 h-24 bg-surface-elevated flex-shrink-0">
               {/* Image placeholder */}
               <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${rec.image_url})` }} />
            </div>
            
            <div className="p-3 flex-1 flex flex-col justify-center">
              <h3 className="font-medium text-white mb-1 line-clamp-1">{rec.title}</h3>
              <div className="flex items-center gap-3 text-xs text-muted mb-2">
                <span>⏱️ {rec.total_time} min</span>
              </div>
              
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-1">
                   <div className="h-1.5 w-16 bg-surface-elevated rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${rec.match_score > 80 ? 'bg-success' : rec.match_score > 50 ? 'bg-warning' : 'bg-danger'}`}
                        style={{ width: `${rec.match_score}%` }}
                      />
                   </div>
                   <span className="text-xs text-muted-strong">{Math.round(rec.match_score)}% match</span>
                 </div>
              </div>
            </div>
          </motion.div>
        ))}
        {recommendations.length === 0 && (
            <div className="text-muted text-sm p-4 text-center border border-dashed border-surface-stroke rounded-xl">
                Add ingredients to see what you can cook!
            </div>
        )}
      </div>
    </div>
  );
};
