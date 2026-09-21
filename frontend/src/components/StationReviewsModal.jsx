import { useState, useEffect } from 'react';
import { Star, MessageSquare, ThumbsUp, Send, ShieldCheck, Zap, Coffee, Wifi, Sparkles } from 'lucide-react';
import api from '../api/api';
import toast from 'react-hot-toast';

export default function StationReviewsModal({ station, onClose }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ totalReviews: 0, avgRating: 4.8, avgSpeedScore: 4.9 });
  const [loading, setLoading] = useState(true);
  
  // New Review Form
  const [rating, setRating] = useState(5);
  const [speedScore, setSpeedScore] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState(['Clean Restrooms', 'High-Speed Wi-Fi']);
  const [submitting, setSubmitting] = useState(false);

  const AMENITY_OPTIONS = [
    'EV/H2 Lounge', 'High-Speed Wi-Fi', 'Artisan Café', 'Clean Restrooms', 'Tire Pressure & Water', '24/7 Security'
  ];

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reviews/station/${station._id}`);
      setReviews(res.data.reviews || []);
      setStats(res.data.stats || { totalReviews: 0, avgRating: 4.8, avgSpeedScore: 4.9 });
    } catch (err) {
      console.error('Fetch reviews error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (station?._id) {
      fetchReviews();
    }
  }, [station?._id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Please write a short review comment');
      return;
    }
    try {
      setSubmitting(true);
      await api.post(`/reviews/station/${station._id}`, {
        rating,
        dispenseSpeedScore: speedScore,
        comment,
        amenitiesRated: selectedAmenities
      });
      toast.success('Review published! Thank you for helping the H2 community.');
      setComment('');
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not post review');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAmenity = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div style={{
        background: '#0a0a0f',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '760px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '36px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 40px rgba(6, 182, 212, 0.15)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '6px', borderRadius: '10px' }}>
                <Star size={20} color="#f59e0b" fill="#f59e0b" />
              </div>
              <span style={{ color: '#06b6d4', fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Verified Driver Community
              </span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
              {station?.name || 'Station'} Reviews & Ratings
            </h2>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#a1a1aa', borderRadius: '12px', padding: '8px 16px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
          >
            Close
          </button>
        </div>

        {/* Rating Overview Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '28px'
        }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '18px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Overall Rating</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <span style={{ fontSize: '28px', fontWeight: '800', color: '#ffffff' }}>{stats.avgRating}</span>
              <Star size={22} color="#f59e0b" fill="#f59e0b" />
            </div>
            <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Based on {stats.totalReviews || reviews.length} driver reviews</span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '18px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Dispense Speed Score</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <span style={{ fontSize: '28px', fontWeight: '800', color: '#06b6d4' }}>{stats.avgSpeedScore}</span>
              <Zap size={22} color="#06b6d4" />
            </div>
            <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Avg ~3.8 min full fill time</span>
          </div>
        </div>

        {/* Write Review Form */}
        <form onSubmit={handleSubmitReview} style={{
          background: 'rgba(6, 182, 212, 0.04)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          borderRadius: '18px',
          padding: '22px',
          marginBottom: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>Leave a Verified Driver Review</span>
          
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#a1a1aa', display: 'block', marginBottom: '6px' }}>Overall Rating:</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    size={22} 
                    color="#f59e0b" 
                    fill={star <= rating ? '#f59e0b' : 'transparent'} 
                    onClick={() => setRating(star)} 
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '12px', color: '#a1a1aa', display: 'block', marginBottom: '6px' }}>Pump Speed Score:</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 3, 4, 5].map((speed) => (
                  <Zap 
                    key={speed} 
                    size={22} 
                    color="#06b6d4" 
                    fill={speed <= speedScore ? '#06b6d4' : 'transparent'} 
                    onClick={() => setSpeedScore(speed)} 
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Amenities Selector */}
          <div>
            <span style={{ fontSize: '12px', color: '#a1a1aa', display: 'block', marginBottom: '6px' }}>Station Amenities Available:</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {AMENITY_OPTIONS.map(amenity => {
                const isSelected = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    style={{
                      background: isSelected ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isSelected ? '#06b6d4' : 'rgba(255,255,255,0.1)'}`,
                      color: isSelected ? '#22d3ee' : '#a1a1aa',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    {amenity}
                  </button>
                );
              })}
            </div>
          </div>

          <textarea 
            placeholder="Share your dispensing experience, nozzle cleanliness, or wait times..." 
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              background: '#12141d',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '12px 14px',
              color: '#ffffff',
              fontSize: '13px',
              outline: 'none',
              resize: 'none'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="submit"
              disabled={submitting}
              style={{
                background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                border: 'none',
                color: '#ffffff',
                padding: '10px 22px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Send size={14} />
              <span>{submitting ? 'Submitting...' : 'Post Review'}</span>
            </button>
          </div>
        </form>

        {/* Reviews List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>Recent Driver Reviews</span>
          {reviews.length === 0 ? (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '14px', textAlign: 'center', color: '#71717a', fontSize: '13px' }}>
              No driver reviews yet. Be the first to rate this station!
            </div>
          ) : (
            reviews.map(rev => (
              <div key={rev._id} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '14px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>{rev.user?.name || 'Verified Driver'}</span>
                    <ShieldCheck size={14} color="#10b981" />
                  </div>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={14} color="#f59e0b" fill={s <= rev.rating ? '#f59e0b' : 'transparent'} />
                    ))}
                  </div>
                </div>

                <p style={{ color: '#d4d4d8', fontSize: '13px', margin: '0 0 10px 0', lineHeight: '1.5' }}>
                  {rev.comment}
                </p>

                {rev.amenitiesRated && rev.amenitiesRated.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {rev.amenitiesRated.map(am => (
                      <span key={am} style={{ background: 'rgba(255,255,255,0.05)', color: '#a1a1aa', padding: '2px 8px', borderRadius: '6px', fontSize: '10px' }}>
                        {am}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
