import React, { useState, useEffect, useCallback, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const CATEGORIES = ['All', 'SUV', 'Sedan', 'Sports', 'EV', 'Luxury', 'Hybrid', 'Compact', 'Truck', 'Minivan', 'Convertible'];

// Figma Design Colors
const colors = {
  carbon: '#0d0d0f',
  carbon800: '#18181c',
  carbon700: '#222228',
  carbon600: '#2e2e38',
  carbon500: '#44444f',
  surface: '#f4f3ef',
  surface100: '#eae9e3',
  amber: '#e8a020',
  amberLight: '#f5bf5a',
  amberDark: '#b87c10',
  sand: '#c8b99a',
};

function genSessionId() {
  return `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

// Stars Component
function Stars({ rating }) {
  return (
    <span style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M6 1l1.39 2.82 3.11.45-2.25 2.19.53 3.09L6 8.02 3.22 9.55l.53-3.09L1.5 4.27l3.11-.45L6 1z"
            fill={n <= Math.round(rating) ? colors.amber : 'none'}
            stroke={n <= Math.round(rating) ? colors.amber : colors.carbon500}
            strokeWidth="1"
          />
        </svg>
      ))}
    </span>
  );
}

// Car Card Component
function CarCard({ car, onSelect, intent }) {
  const displayPrice = intent === 'Rent' 
    ? (car.daily_rental_rate || (car.purchase_price ? Math.round(car.purchase_price * 0.01) : 0))
    : car.purchase_price;
  const priceLabel = intent === 'Rent' 
    ? '/ day' 
    : 'total';
  
  // Fallback image based on car make
  const fallbackImages = {
    'Audi': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=500&fit=crop&auto=format',
    'Lexus': 'https://images.unsplash.com/photo-1520031441872-26546a6b9270?w=800&h=500&fit=crop&auto=format',
    'Dodge': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=500&fit=crop&auto=format',
    'BMW': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=500&fit=crop&auto=format',
    'Mercedes': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=500&fit=crop&auto=format',
    'Tesla': 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=500&fit=crop&auto=format',
    'Genesis': 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&h=500&fit=crop&auto=format',
    'Buick': 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=500&fit=crop&auto=format',
    'Subaru': 'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800&h=500&fit=crop&auto=format',
    'GMC': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=500&fit=crop&auto=format',
    'Kia': 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=500&fit=crop&auto=format',
    'Fiat': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=500&fit=crop&auto=format',
    'Ferrari': 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=500&fit=crop&auto=format',
    'Jeep': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=500&fit=crop&auto=format',
    'default': 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=500&fit=crop&auto=format',
  };
  
  const imageUrl = car.image_url || fallbackImages[car.make] || fallbackImages['default'];
  return (
    <div
      onClick={() => onSelect(car)}
      style={{
        background: colors.carbon800,
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        border: `1px solid ${colors.carbon700}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = colors.amber;
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(232, 160, 32, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = colors.carbon700;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ position: 'relative', overflow: 'hidden', background: colors.carbon, height: '192px' }}>
        <img 
          src={imageUrl} 
          alt={`${car.make} ${car.model}`} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {car.source === 'auto_dev' && (
          <span style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: colors.amber,
            color: colors.carbon,
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '4px 10px',
            borderRadius: '20px',
          }}>
            Live Data
          </span>
        )}
        <span style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(13, 13, 15, 0.8)',
          color: 'rgba(244, 243, 239, 0.7)',
          fontSize: '11px',
          fontWeight: '600',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '4px 10px',
          borderRadius: '20px',
        }}>
          {car.category}
        </span>
      </div>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div>
            <p style={{
              color: colors.sand,
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '2px',
            }}>
              {car.make}
            </p>
            <h3 style={{
              color: colors.surface,
              fontSize: '20px',
              fontWeight: '800',
              lineHeight: '1.2',
              margin: 0,
            }}>
              {car.model}
            </h3>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{
              color: colors.amber,
              fontSize: '24px',
              fontWeight: '700',
              lineHeight: '1',
              margin: 0,
            }}>
              ${displayPrice?.toLocaleString() || '0'}
            </p>
            <p style={{ color: colors.carbon500, fontSize: '12px', marginTop: '2px' }}>
              {priceLabel}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', marginBottom: '16px' }}>
          <Stars rating={car.rating} />
          <span style={{ color: colors.surface, fontSize: '14px', fontWeight: '600' }}>{car.rating}</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', borderTop: `1px solid ${colors.carbon700}`, paddingTop: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: colors.sand, fontSize: '12px' }}>
            <span style={{ fontSize: '16px' }}>👤</span>{car.seating_capacity} seats
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: colors.sand, fontSize: '12px' }}>
            <span style={{ fontSize: '16px' }}>⚡</span>{car.ev_range > 0 ? `${car.ev_range} mi` : 'Auto'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: colors.sand, fontSize: '12px' }}>
            <span style={{ fontSize: '16px' }}>🛞</span>{car.year}
          </span>
        </div>
      </div>
    </div>
  );
}

// Booking Modal Component
function BookingModal({ car, onClose, intent }) {
  const [step, setStep] = useState('details');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const days = startDate && endDate
    ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))
    : 1;
  
  const basePrice = intent === 'Rent' 
    ? (car.daily_rental_rate || (car.purchase_price ? car.purchase_price * 0.01 : 0))
    : car.purchase_price;
  const subtotal = basePrice * days;
  const insurance = Math.round(subtotal * 0.12);
  const total = subtotal + insurance;
  const canProceed = pickup && dropoff && startDate && endDate;
  
  // Fallback image based on car make
  const fallbackImages = {
    'Audi': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=500&fit=crop&auto=format',
    'Lexus': 'https://images.unsplash.com/photo-1520031441872-26546a6b9270?w=800&h=500&fit=crop&auto=format',
    'Dodge': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=500&fit=crop&auto=format',
    'BMW': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=500&fit=crop&auto=format',
    'Mercedes': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=500&fit=crop&auto=format',
    'Tesla': 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=500&fit=crop&auto=format',
    'Genesis': 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&h=500&fit=crop&auto=format',
    'Buick': 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=500&fit=crop&auto=format',
    'Subaru': 'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800&h=500&fit=crop&auto=format',
    'GMC': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=500&fit=crop&auto=format',
    'Kia': 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=500&fit=crop&auto=format',
    'Fiat': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=500&fit=crop&auto=format',
    'Ferrari': 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=500&fit=crop&auto=format',
    'Jeep': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=500&fit=crop&auto=format',
    'default': 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=500&fit=crop&auto=format',
  };
  
  const imageUrl = car.image_url || fallbackImages[car.make] || fallbackImages['default'];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: colors.carbon800,
        border: `1px solid ${colors.carbon600}`,
        borderRadius: '24px',
        width: '100%',
        maxWidth: '512px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
      }}>
        <div style={{ position: 'relative', height: '160px', background: colors.carbon, overflow: 'hidden' }}>
          <img 
            src={imageUrl} 
            alt={car.model} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} 
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, #18181c, transparent)',
          }} />
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(13, 13, 15, 0.8)',
              color: colors.surface,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '20px',
              border: 'none',
            }}
          >
            ×
          </button>
          <div style={{ position: 'absolute', bottom: '16px', left: '20px' }}>
            <p style={{
              color: colors.sand,
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              margin: 0,
            }}>
              {car.make}
            </p>
            <h2 style={{
              color: colors.surface,
              fontSize: '24px',
              fontWeight: '800',
              margin: 0,
            }}>
              {car.model}
            </h2>
          </div>
        </div>
        <div style={{ padding: '24px' }}>
          {step === 'done' ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(232, 160, 32, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <span style={{ fontSize: '24px' }}>✓</span>
              </div>
              <h3 style={{
                color: colors.surface,
                fontSize: '24px',
                fontWeight: '800',
                margin: '0 0 8px 0',
              }}>
                Booking Confirmed!
              </h3>
              <p style={{ color: colors.sand, fontSize: '14px', marginBottom: '4px' }}>
                {car.make} {car.model} · {days} day{days > 1 ? 's' : ''}
              </p>
              <p style={{ color: colors.amber, fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
                ${Math.round(total).toLocaleString()} total
              </p>
              <p style={{ color: colors.carbon500, fontSize: '12px', marginBottom: '24px' }}>
                Confirmation sent to your email. Pick up at {pickup}.
              </p>
              <button 
                onClick={onClose} 
                style={{
                  width: '100%',
                  background: colors.amber,
                  color: colors.carbon,
                  padding: '12px',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '16px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                Done
              </button>
            </div>
          ) : step === 'confirm' ? (
            <>
              <h3 style={{
                color: colors.surface,
                fontSize: '18px',
                fontWeight: '800',
                marginBottom: '16px',
              }}>
                Review Booking
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: colors.carbon500, fontSize: '14px' }}>Pick-up</span>
                  <span style={{ color: colors.surface, fontSize: '14px', fontWeight: '500' }}>{pickup}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: colors.carbon500, fontSize: '14px' }}>Drop-off</span>
                  <span style={{ color: colors.surface, fontSize: '14px', fontWeight: '500' }}>{dropoff}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: colors.carbon500, fontSize: '14px' }}>Dates</span>
                  <span style={{ color: colors.surface, fontSize: '14px', fontWeight: '500' }}>{startDate} → {endDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: colors.carbon500, fontSize: '14px' }}>Duration</span>
                  <span style={{ color: colors.surface, fontSize: '14px', fontWeight: '500' }}>{days} day{days > 1 ? 's' : ''}</span>
                </div>
                <div style={{ borderTop: `1px solid ${colors.carbon600}`, paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: colors.carbon500, fontSize: '14px' }}>
                      ${Math.round(basePrice)} × {days} days
                    </span>
                    <span style={{ color: colors.surface, fontSize: '14px', fontWeight: '500' }}>${Math.round(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: colors.carbon500, fontSize: '14px' }}>Insurance (12%)</span>
                    <span style={{ color: colors.surface, fontSize: '14px', fontWeight: '500' }}>${insurance}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: `1px solid ${colors.carbon600}` }}>
                    <span style={{
                      color: colors.surface,
                      fontWeight: '700',
                      fontSize: '16px',
                    }}>
                      Total
                    </span>
                    <span style={{
                      color: colors.amber,
                      fontWeight: '800',
                      fontSize: '20px',
                    }}>
                      ${Math.round(total).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setStep('details')} 
                  style={{
                    flex: 1,
                    border: `1px solid ${colors.carbon600}`,
                    color: colors.sand,
                    padding: '12px',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '14px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    background: 'none',
                  }}
                >
                  Back
                </button>
                <button 
                  onClick={() => setStep('done')} 
                  style={{
                    flex: 2,
                    background: colors.amber,
                    color: colors.carbon,
                    padding: '12px',
                    borderRadius: '12px',
                    fontWeight: '800',
                    fontSize: '14px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  Confirm & Pay
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 style={{
                color: colors.surface,
                fontSize: '18px',
                fontWeight: '800',
                marginBottom: '16px',
              }}>
                Booking Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ color: colors.carbon500, fontSize: '12px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>
                      Pick-up Location
                    </label>
                    <input
                      type="text"
                      placeholder="City or Airport"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      style={{
                        width: '100%',
                        background: colors.carbon,
                        border: `1px solid ${colors.carbon600}`,
                        borderRadius: '12px',
                        padding: '10px 12px',
                        color: colors.surface,
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: colors.carbon500, fontSize: '12px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>
                      Drop-off Location
                    </label>
                    <input
                      type="text"
                      placeholder="City or Airport"
                      value={dropoff}
                      onChange={(e) => setDropoff(e.target.value)}
                      style={{
                        width: '100%',
                        background: colors.carbon,
                        border: `1px solid ${colors.carbon600}`,
                        borderRadius: '12px',
                        padding: '10px 12px',
                        color: colors.surface,
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: colors.carbon500, fontSize: '12px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{
                        width: '100%',
                        background: colors.carbon,
                        border: `1px solid ${colors.carbon600}`,
                        borderRadius: '12px',
                        padding: '10px 12px',
                        color: colors.surface,
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: colors.carbon500, fontSize: '12px', fontWeight: '500', marginBottom: '4px', display: 'block' }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={{
                        width: '100%',
                        background: colors.carbon,
                        border: `1px solid ${colors.carbon600}`,
                        borderRadius: '12px',
                        padding: '10px 12px',
                        color: colors.surface,
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
                {startDate && endDate && (
                  <div style={{
                    background: colors.carbon,
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{ color: colors.sand, fontSize: '14px' }}>Estimated total ({days} days)</span>
                    <span style={{
                      color: colors.amber,
                      fontWeight: '800',
                      fontSize: '18px',
                    }}>
                      ${Math.round(total).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => canProceed && setStep('confirm')}
                disabled={!canProceed}
                style={{
                  marginTop: '20px',
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '14px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: canProceed ? 'pointer' : 'not-allowed',
                  border: 'none',
                  background: canProceed ? colors.amber : colors.carbon600,
                  color: canProceed ? colors.carbon : colors.carbon500,
                }}
              >
                Continue
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// MCP Preference Form Component
function MCPPreferenceForm({ app, onSubmit }) {
  const [formData, setFormData] = useState({
    intent: 'Rent',
    category: '',
    budget: '',
    target_date: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div style={{
      background: colors.carbon,
      borderRadius: '12px',
      padding: '16px',
      border: `1px solid ${colors.carbon600}`,
    }}>
      <h4 style={{
        color: colors.surface,
        fontSize: '14px',
        fontWeight: '700',
        margin: '0 0 12px 0',
      }}>
        {app.title || 'Car Preferences'}
      </h4>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ color: colors.carbon500, fontSize: '12px', marginBottom: '4px', display: 'block' }}>
            Intent
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {app.fields?.intent?.options?.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, intent: option }))}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  border: formData.intent === option ? `2px solid ${colors.amber}` : `1px solid ${colors.carbon600}`,
                  background: formData.intent === option ? `rgba(232, 160, 32, 0.2)` : 'transparent',
                  color: formData.intent === option ? colors.amber : colors.sand,
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ color: colors.carbon500, fontSize: '12px', marginBottom: '4px', display: 'block' }}>
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            style={{
              width: '100%',
              background: colors.carbon800,
              border: `1px solid ${colors.carbon600}`,
              borderRadius: '8px',
              padding: '8px 12px',
              color: formData.category ? colors.surface : colors.carbon500,
              fontSize: '14px',
              outline: 'none',
            }}
          >
            <option value="">Select a category</option>
            {app.fields?.category?.options?.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ color: colors.carbon500, fontSize: '12px', marginBottom: '4px', display: 'block' }}>
            Budget ({formData.intent === 'Rent' ? '$/day' : '$ total'})
          </label>
          <input
            type="number"
            value={formData.budget}
            onChange={(e) => setFormData(prev => ({ ...prev, budget: parseFloat(e.target.value) }))}
            placeholder={formData.intent === 'Rent' ? 'Daily rate (e.g., 200)' : 'Total budget (e.g., 50000)'}
            min={formData.intent === 'Rent' ? app.fields?.budget?.min_rent : app.fields?.budget?.min_buy}
            style={{
              width: '100%',
              background: colors.carbon800,
              border: `1px solid ${colors.carbon600}`,
              borderRadius: '8px',
              padding: '8px 12px',
              color: formData.budget ? colors.surface : colors.carbon500,
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ color: colors.carbon500, fontSize: '12px', marginBottom: '4px', display: 'block' }}>
            Target Date
          </label>
          <input
            type="date"
            value={formData.target_date}
            onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
            style={{
              width: '100%',
              background: colors.carbon800,
              border: `1px solid ${colors.carbon600}`,
              borderRadius: '8px',
              padding: '8px 12px',
              color: colors.surface,
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            width: '100%',
            background: colors.amber,
            color: colors.carbon,
            padding: '10px',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            border: 'none',
          }}
        >
          Submit Preferences
        </button>
      </form>
    </div>
  );
}

// MCP Checkout App Component
function MCPCheckoutApp({ app, onSubmit }) {
  const [formData, setFormData] = useState({
    cardholder_name: '',
    mock_card_number: '',
    exp_date: '',
    cvv: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      checkout_car_id: app.car_id,
      checkout_confirmed: true,
    });
  };

  return (
    <div style={{
      background: colors.carbon,
      borderRadius: '12px',
      padding: '16px',
      border: `1px solid ${colors.carbon600}`,
    }}>
      <h4 style={{
        color: colors.surface,
        fontSize: '14px',
        fontWeight: '700',
        margin: '0 0 12px 0',
      }}>
        {app.title || 'Secure Checkout'}
      </h4>
      {app.is_safe_sandbox && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.1)',
          border: `1px solid #22c55e`,
          borderRadius: '8px',
          padding: '8px',
          marginBottom: '12px',
        }}>
          <p style={{ color: '#22c55e', fontSize: '11px', margin: 0 }}>
            🔒 Safe Sandbox Mode - No real charges
          </p>
        </div>
      )}
      <div style={{ marginBottom: '12px', padding: '8px', background: colors.carbon800, borderRadius: '8px' }}>
        <p style={{ color: colors.sand, fontSize: '12px', margin: '0 0 4px 0' }}>
          {app.car_model || 'Selected Vehicle'}
        </p>
        <p style={{ color: colors.amber, fontSize: '18px', fontWeight: '700', margin: 0 }}>
          ${app.amount?.toLocaleString() || '0'}
        </p>
        <p style={{ color: colors.carbon500, fontSize: '11px', margin: '4px 0 0 0' }}>
          {app.mode || 'Purchase'}
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ color: colors.carbon500, fontSize: '12px', marginBottom: '4px', display: 'block' }}>
            Cardholder Name
          </label>
          <input
            type="text"
            value={formData.cardholder_name}
            onChange={(e) => setFormData(prev => ({ ...prev, cardholder_name: e.target.value }))}
            placeholder="John Doe"
            required
            style={{
              width: '100%',
              background: colors.carbon800,
              border: `1px solid ${colors.carbon600}`,
              borderRadius: '8px',
              padding: '8px 12px',
              color: colors.surface,
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ color: colors.carbon500, fontSize: '12px', marginBottom: '4px', display: 'block' }}>
            Card Number (Mock)
          </label>
          <input
            type="text"
            value={formData.mock_card_number}
            onChange={(e) => setFormData(prev => ({ ...prev, mock_card_number: e.target.value }))}
            placeholder="4242 4242 4242 4242"
            required
            style={{
              width: '100%',
              background: colors.carbon800,
              border: `1px solid ${colors.carbon600}`,
              borderRadius: '8px',
              padding: '8px 12px',
              color: colors.surface,
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ color: colors.carbon500, fontSize: '12px', marginBottom: '4px', display: 'block' }}>
              Expiry
            </label>
            <input
              type="text"
              value={formData.exp_date}
              onChange={(e) => setFormData(prev => ({ ...prev, exp_date: e.target.value }))}
              placeholder="MM/YY"
              required
              style={{
                width: '100%',
                background: colors.carbon800,
                border: `1px solid ${colors.carbon600}`,
                borderRadius: '8px',
                padding: '8px 12px',
                color: colors.surface,
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
          <div>
            <label style={{ color: colors.carbon500, fontSize: '12px', marginBottom: '4px', display: 'block' }}>
              CVV
            </label>
            <input
              type="text"
              value={formData.cvv}
              onChange={(e) => setFormData(prev => ({ ...prev, cvv: e.target.value }))}
              placeholder="123"
              required
              style={{
                width: '100%',
                background: colors.carbon800,
                border: `1px solid ${colors.carbon600}`,
                borderRadius: '8px',
                padding: '8px 12px',
                color: colors.surface,
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
        </div>
        <button
          type="submit"
          style={{
            width: '100%',
            background: colors.amber,
            color: colors.carbon,
            padding: '10px',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            border: 'none',
          }}
        >
          Pay ${app.amount?.toLocaleString() || '0'} (Mock)
        </button>
      </form>
    </div>
  );
}

// Chat Panel Component
function ChatPanel({ open, onClose, sessionId, onPreferencesSubmit }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendOk, setBackendOk] = useState(null);
  const bottomRef = useRef(null);
  const initRef = useRef(false);

  const sendToAgent = useCallback(async (text, formData = null, shouldScroll = false) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: text, form_data: formData }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Backend error:', errorData);
        throw new Error(errorData.detail || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      // Validate response structure
      if (!data.text && !data.a2ui_events) {
        throw new Error('Invalid response format from server');
      }
      
      
      // Handle A2UI events
      if (data.a2ui_events && data.a2ui_events.length > 0) {
        // Check for MCP Apps to render
        const mcpAppEvent = data.a2ui_events.find(e => e.a2ui_type === 'RENDER_MCP_APP');
        if (mcpAppEvent && mcpAppEvent.app) {
          // Use greeting if text is empty, otherwise use the text
          const displayText = data.text || "Welcome to MATCH MY DRIVE! 🚗 I'm here to help you find the perfect car. You can either tell me what you're looking for in the chat, or use the form below to specify your preferences.";
          
          setMessages((prev) => [
            ...prev,
            {
              role: 'agent',
              text: displayText,
              mcpApp: mcpAppEvent.app,
            },
          ]);
          return;
        }
        
        // Check for status updates (don't return, let catalog render too)
        const statusEvent = data.a2ui_events.find(e => e.a2ui_type === 'UPDATE_STATUS');
        if (statusEvent && statusEvent.status_steps) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'agent',
              text: data.text,
              statusSteps: statusEvent.status_steps,
            },
          ]);
        }
        
        // Check for car catalog results
        const catalogEvent = data.a2ui_events.find(e => e.a2ui_type === 'RENDER_CATALOG_GRID');
        if (catalogEvent && catalogEvent.items && catalogEvent.items.length > 0) {
          if (onPreferencesSubmit) {
            onPreferencesSubmit(catalogEvent.items);
          }
          // Scroll to fleet section if requested
          if (shouldScroll) {
            const fleetSection = document.getElementById('fleet-section');
            if (fleetSection) {
              fleetSection.scrollIntoView({ behavior: 'smooth' });
            } else {
            }
          }
          // Only add additional message if text response is empty
          if (!data.text) {
            setMessages((prev) => [
              ...prev,
              {
                role: 'agent',
                text: `I found ${catalogEvent.items.length} cars for you! They're now displayed in the main view.`,
              },
            ]);
          }
        }
      } else {
        // No A2UI events, just add text message
        setMessages((prev) => [
          ...prev,
          {
            role: 'agent',
            text: data.text || 'Processing your request...',
          },
        ]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          text: `Sorry, I encountered an error: ${err.message}. Please try again.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [sessionId, onPreferencesSubmit]);

  useEffect(() => {
    if (!open) return;
    fetch(`${API_URL}/health`)
      .then((r) => setBackendOk(r.ok))
      .catch(() => setBackendOk(false));
    
    // Send initial empty message to trigger form rendering (only once)
    if (!initRef.current) {
      sendToAgent('', null);
      initRef.current = true;
    }
  }, [open, sendToAgent]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    sendToAgent(text);
  }

  function handleReset() {
    fetch(`${API_URL}/api/session/${sessionId}`, { method: 'DELETE' }).catch(() => {});
    setMessages([
      {
        role: 'agent',
        text: "Session reset! Tell me what kind of car you're looking for.",
      },
    ]);
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        width: 360,
        height: 560,
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0)' : 'translateY(16px)',
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: colors.carbon800,
        border: `1px solid ${colors.carbon600}`,
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '20px',
          borderBottom: `1px solid ${colors.carbon700}`,
          background: colors.carbon,
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(232, 160, 32, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ color: colors.amber, fontSize: '14px' }}>◆</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              color: colors.surface,
              fontSize: '14px',
              fontWeight: '800',
              lineHeight: 1,
              margin: 0,
            }}>
              AI Matchmaker
            </p>
            <p style={{ color: colors.carbon500, fontSize: '12px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: backendOk === true ? '#22c55e' : backendOk === false ? '#ef4444' : colors.carbon500,
                }}
              />
              {backendOk === true ? 'Connected' : backendOk === false ? 'Backend offline' : 'Connecting…'}
            </p>
          </div>
          <button
            onClick={handleReset}
            title="Reset session"
            style={{
              background: 'none',
              border: 'none',
              color: colors.carbon500,
              cursor: 'pointer',
              padding: '8px',
              marginRight: '4px',
              fontSize: '14px',
            }}
          >
            ↺
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: colors.carbon500,
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div
                style={{
                  maxWidth: '85%',
                  background: msg.isError ? 'rgba(239, 68, 68, 0.1)' : msg.role === 'user' ? colors.amber : 'transparent',
                  border: msg.isError ? `1px solid #ef4444` : 'none',
                  color: msg.isError ? '#ef4444' : msg.role === 'user' ? colors.carbon : colors.surface,
                  borderRadius: '16px',
                  borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                  padding: '16px',
                }}
              >
                <p style={{ fontSize: '14px', lineHeight: 1.5, margin: 0 }}>{msg.text}</p>
                
                {/* Render MCP App if present */}
                {msg.mcpApp && (
                  <div style={{ marginTop: '12px' }}>
                    {msg.mcpApp.app_id === 'app_car_preference_interview' ? (
                      <MCPPreferenceForm 
                        app={msg.mcpApp} 
                        onSubmit={(formData) => {
                          setMessages((prev) => [...prev, { role: 'user', text: 'Submitted preferences' }]);
                          sendToAgent('', formData, true); // Pass true to indicate it should scroll
                        }}
                      />
                    ) : msg.mcpApp.app_id === 'app_mock_checkout' ? (
                      <MCPCheckoutApp 
                        app={msg.mcpApp}
                        onSubmit={(formData) => {
                          setMessages((prev) => [...prev, { role: 'user', text: 'Checkout submitted' }]);
                          sendToAgent('', formData);
                        }}
                      />
                    ) : (
                      <div style={{ 
                        padding: '12px', 
                        background: colors.carbon, 
                        borderRadius: '8px',
                        border: `1px solid ${colors.carbon600}`
                      }}>
                        <p style={{ fontSize: '12px', color: colors.sand, margin: 0 }}>
                          MCP App: {msg.mcpApp.title || msg.mcpApp.app_id}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Render status steps if present */}
                {msg.statusSteps && (
                  <div style={{ marginTop: '12px' }}>
                    {msg.statusSteps.map((step, idx) => (
                      <div key={idx} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        marginBottom: '8px',
                        fontSize: '12px'
                      }}>
                        <span style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: step.status === 'COMPLETED' ? '#22c55e' : 
                                     step.status === 'IN_PROGRESS' ? colors.amber : colors.carbon600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                        }}>
                          {step.status === 'COMPLETED' ? '✓' : step.status === 'IN_PROGRESS' ? '○' : '○'}
                        </span>
                        <span style={{ color: colors.sand }}>{step.step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '4px', padding: '4px' }}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'rgba(232, 160, 32, 0.6)',
                      animation: 'bounce 1s infinite',
                      animationDelay: `${i * 150}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{
          padding: '12px 16px',
          borderTop: `1px solid ${colors.carbon700}`,
          display: 'flex',
          gap: '8px',
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe your ideal car…"
            disabled={loading || backendOk === false}
            style={{
              flex: 1,
              background: colors.carbon,
              border: `1px solid ${colors.carbon600}`,
              borderRadius: '12px',
              padding: '10px 12px',
              color: colors.surface,
              fontSize: '14px',
              outline: 'none',
              opacity: loading || backendOk === false ? 0.4 : 1,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading || backendOk === false}
            style={{
              background: colors.amber,
              color: colors.carbon,
              padding: '10px 16px',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '14px',
              cursor: !input.trim() || loading || backendOk === false ? 'not-allowed' : 'pointer',
              border: 'none',
              opacity: !input.trim() || loading || backendOk === false ? 0.4 : 1,
            }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

// Main App Component
export default function App() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [maxPrice, setMaxPrice] = useState(2000);
  const [sortBy, setSortBy] = useState('rating');
  const [selectedCar, setSelectedCar] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [sessionId] = useState(genSessionId);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [intent, setIntent] = useState('Rent'); // Rent or Buy
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'about'
  const fleetSectionRef = useRef(null);
  const [locationsOpen, setLocationsOpen] = useState(false);

  // Navigation handlers
  const handleFleetClick = () => {
    setCurrentPage('home');
    setTimeout(() => {
      if (fleetSectionRef.current) {
        fleetSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleLocationsClick = () => {
    setLocationsOpen(!locationsOpen);
  };

  const handleAboutClick = () => {
    setCurrentPage('about');
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Update maxPrice when intent changes
  useEffect(() => {
    if (intent === 'Rent') {
      setMaxPrice(2000);
    } else {
      setMaxPrice(100000);
    }
  }, [intent]);

  // Load cars from backend
  useEffect(() => {
    loadCars();
  }, [activeCategory, maxPrice, intent]);

  const loadCars = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'All') {
        params.append('category', activeCategory);
      }
      params.append('max_budget', maxPrice.toString());
      params.append('is_rental', intent === 'Rent' ? 'true' : 'false');
      
      const res = await fetch(`${API_URL}/api/cars?${params.toString()}`);
      const data = await res.json();
      
      setCars(data.items || []);
    } catch (err) {
      console.error('Failed to load cars:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = cars.filter((c) => {
    const matchCat = activeCategory === 'All' || c.category === activeCategory;
    
    // For Rent: check daily_rental_rate, or estimate from purchase price
    let matchPrice = false;
    if (intent === 'Rent') {
      if (c.daily_rental_rate && c.daily_rental_rate > 0) {
        matchPrice = c.daily_rental_rate <= maxPrice;
      } else if (c.purchase_price) {
        // Estimate daily rental as ~1% of purchase price
        const estimatedDaily = c.purchase_price * 0.01;
        matchPrice = estimatedDaily <= maxPrice;
      }
    } else {
      // For Buy: check purchase_price
      matchPrice = c.purchase_price <= maxPrice;
    }
    
    const matchSearch =
      searchQuery === '' ||
      c.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.make.toLowerCase().includes(searchQuery.toLowerCase());
    
    
    return matchCat && matchPrice && matchSearch;
  }).sort((a, b) => (sortBy === 'price' 
    ? (intent === 'Rent' ? (a.daily_rental_rate || a.purchase_price * 0.01) - (b.daily_rental_rate || b.purchase_price * 0.01) : a.purchase_price - b.purchase_price) 
    : b.rating - a.rating));
  

  return (
    <div style={{ minHeight: '100vh', background: colors.carbon }}>
      {/* Nav */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        height: '64px',
        borderBottom: `1px solid ${colors.carbon800}`,
        background: 'rgba(13, 13, 15, 0.9)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: colors.amber, fontSize: '20px', lineHeight: 1 }}>◆</span>
          <span style={{
            color: colors.surface,
            fontSize: '20px',
            fontWeight: '800',
            letterSpacing: '0.05em',
          }}>
            MATCH MY DRIVE
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <button 
            onClick={handleFleetClick}
            style={{ color: colors.sand, fontSize: '14px', fontWeight: '500', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Fleet
          </button>
          <button 
            onClick={handleLocationsClick}
            style={{ 
              color: locationsOpen ? colors.amber : colors.sand, 
              fontSize: '14px', 
              fontWeight: '500', 
              textDecoration: 'none', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer' 
            }}
          >
            Locations
          </button>
          <button 
            onClick={handleAboutClick}
            style={{ 
              color: currentPage === 'about' ? colors.amber : colors.sand, 
              fontSize: '14px', 
              fontWeight: '500', 
              textDecoration: 'none', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer' 
            }}
          >
            About
          </button>
        </div>
      </nav>

      {/* Hero - Only show on home page */}
      {currentPage === 'home' && (
      <section style={{
        position: 'relative',
        paddingTop: '64px',
        overflow: 'hidden',
        minHeight: '520px',
      }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <img
            src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1600&h=900&fit=crop&auto=format"
            alt="Sports car on road"
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, #0d0d0f, rgba(13, 13, 15, 0.8), transparent)',
          }} />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, #0d0d0f, transparent)',
          }} />
        </div>
        <div style={{
          position: 'relative',
          zIndex: 10,
          padding: '0 32px',
          paddingTop: '80px',
          paddingBottom: '112px',
          maxWidth: '1280px',
          margin: '0 auto',
        }}>
          <p style={{
            color: colors.amber,
            fontSize: '14px',
            fontWeight: '700',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}>
            AI-Powered • Real Data • Instant Results
          </p>
          <h1 style={{
            color: colors.surface,
            fontWeight: 900,
            lineHeight: 1,
            marginBottom: '24px',
            fontSize: 'clamp(48px, 8vw, 96px)',
          }}>
            Find Your<br />
            <em style={{ fontStyle: 'normal', color: colors.amber }}>Perfect</em> Drive.
          </h1>
          <p style={{
            color: colors.sand,
            fontSize: '18px',
            maxWidth: '512px',
            lineHeight: 1.6,
            marginBottom: '40px',
          }}>
            AI-powered car matching with real-time market data from Auto.dev. Tell us what you need, we'll find the perfect vehicle.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search by model or brand…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: colors.carbon800,
                border: `1px solid ${colors.carbon600}`,
                borderRadius: '16px',
                padding: '14px 20px',
                color: colors.surface,
                fontSize: '14px',
                width: '288px',
                outline: 'none',
              }}
            />
            <button
              onClick={() => setChatOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: colors.carbon800,
                border: `1px solid ${colors.carbon600}`,
                color: colors.sand,
                padding: '14px 24px',
                borderRadius: '16px',
                fontWeight: '700',
                fontSize: '14px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              <span style={{ color: colors.amber }}>◆</span> Ask AI
            </button>
          </div>
        </div>
      </section>
      )}

      {/* Stats strip - Only show on home page */}
      {currentPage === 'home' && (
      <div style={{ background: colors.carbon800, borderTop: `1px solid ${colors.carbon700}`, borderBottom: `1px solid ${colors.carbon700}` }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '24px 32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '24px',
        }}>
          {[
            { value: 'Real API', label: 'Data Source' },
            { value: 'Auto.dev', label: 'Powered By' },
            { value: 'AI Match', label: 'Technology' },
            { value: 'Instant', label: 'Results' },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <p style={{
                color: colors.amber,
                fontSize: '48px',
                fontWeight: 900,
                margin: 0,
              }}>
                {s.value}
              </p>
              <p style={{
                color: colors.carbon500,
                fontSize: '12px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginTop: '2px',
              }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Fleet section - Only show on home page */}
      {currentPage === 'home' && (
      <section id="fleet-section" style={{ maxWidth: '1280px', margin: '0 auto', padding: '56px 32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
          {/* Intent Selector */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['Rent', 'Buy'].map((option) => (
              <button
                key={option}
                onClick={() => setIntent(option)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  border: intent === option ? `2px solid ${colors.amber}` : `1px solid ${colors.carbon600}`,
                  background: intent === option ? `rgba(232, 160, 32, 0.2)` : 'transparent',
                  color: intent === option ? colors.amber : colors.sand,
                }}
              >
                {option}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  border: activeCategory === cat ? 'none' : `1px solid ${colors.carbon600}`,
                  background: activeCategory === cat ? colors.amber : 'transparent',
                  color: activeCategory === cat ? colors.carbon : colors.sand,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {/* Date Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                style={{
                  background: colors.carbon,
                  border: `1px solid ${colors.carbon600}`,
                  borderRadius: '12px',
                  padding: '8px 12px',
                  color: colors.surface,
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Price Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: colors.carbon500, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Max
              </span>
              <span style={{
                color: colors.amber,
                fontSize: '14px',
                fontWeight: '700',
                width: '80px',
              }}>
                ${maxPrice.toLocaleString()}
              </span>
              <input 
                type="range" 
                min={intent === 'Rent' ? 100 : 15000} 
                max={intent === 'Rent' ? 2000 : 100000} 
                step={intent === 'Rent' ? 50 : 1000} 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(Number(e.target.value))} 
                style={{ accentColor: colors.amber, width: '112px' }} 
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['rating', 'price']).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '700',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    background: sortBy === s ? colors.carbon600 : 'transparent',
                    color: sortBy === s ? colors.surface : colors.carbon500,
                    border: 'none',
                  }}
                >
                  {s === 'rating' ? '★ Top Rated' : '$ Price'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div ref={fleetSectionRef} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{
            color: colors.surface,
            fontSize: '48px',
            fontWeight: 900,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            margin: 0,
          }}>
            Available Fleet
          </h2>
          <span style={{ color: colors.carbon500, fontSize: '14px' }}>{filtered.length} vehicles</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 32px', color: colors.carbon500 }}>
            <p style={{
              fontSize: '32px',
              fontWeight: '800',
              marginBottom: '8px',
            }}>
              Loading vehicles...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 32px', color: colors.carbon500 }}>
            <p style={{
              fontSize: '32px',
              fontWeight: '800',
              marginBottom: '8px',
            }}>
              No Matches
            </p>
            <p style={{ fontSize: '14px' }}>
              Try adjusting your filters or <button onClick={() => setChatOpen(true)} style={{ color: colors.amber, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>ask the AI</button>
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {filtered.map((car) => (
              <CarCard key={car.id} car={car} onSelect={setSelectedCar} intent={intent} />
            ))}
          </div>
        )}
      </section>
      )}

      {/* Locations Bubble Overlay */}
      {locationsOpen && (
        <div 
          onClick={() => setLocationsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: colors.carbon800,
              border: `1px solid ${colors.carbon600}`,
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{
                color: colors.surface,
                fontSize: '32px',
                fontWeight: '800',
                margin: 0,
              }}>
                Our Locations
              </h2>
              <button
                onClick={() => setLocationsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.carbon500,
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '8px',
                }}
              >
                ×
              </button>
            </div>
            
            <p style={{ color: colors.carbon500, fontSize: '16px', marginBottom: '32px' }}>
              Select a country to view available vehicles. Currently showing supported regions (coming soon).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {[
                { name: 'Germany', flag: '🇩🇪', status: 'Coming Soon' },
                { name: 'United States', flag: '🇺🇸', status: 'Coming Soon' },
                { name: 'United Kingdom', flag: '🇬🇧', status: 'Coming Soon' },
                { name: 'France', flag: '🇫🇷', status: 'Coming Soon' },
                { name: 'Spain', flag: '🇪🇸', status: 'Coming Soon' },
                { name: 'Italy', flag: '🇮🇹', status: 'Coming Soon' },
                { name: 'Netherlands', flag: '🇳🇱', status: 'Coming Soon' },
                { name: 'Switzerland', flag: '🇨🇭', status: 'Coming Soon' },
                { name: 'Austria', flag: '🇦🇹', status: 'Coming Soon' },
                { name: 'Belgium', flag: '🇧🇪', status: 'Coming Soon' },
                { name: 'Sweden', flag: '🇸🇪', status: 'Coming Soon' },
                { name: 'Norway', flag: '🇳🇴', status: 'Coming Soon' },
              ].map((country) => (
                <div
                  key={country.name}
                  style={{
                    background: colors.carbon700,
                    border: `1px solid ${colors.carbon600}`,
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'not-allowed',
                    opacity: 0.7,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{country.flag}</div>
                  <h3 style={{ color: colors.surface, fontSize: '14px', fontWeight: '700', margin: '0 0 6px 0' }}>
                    {country.name}
                  </h3>
                  <span style={{ 
                    color: colors.carbon500, 
                    fontSize: '10px', 
                    fontWeight: '600',
                    padding: '2px 8px',
                    background: colors.carbon600,
                    borderRadius: '8px',
                  }}>
                    {country.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* About Page */}
      {currentPage === 'about' && (
        <section style={{ padding: '120px 32px', minHeight: 'calc(100vh - 64px)' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <button 
              onClick={handleBackToHome}
              style={{
                background: 'none',
                border: 'none',
                color: colors.amber,
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              ← Back to Home
            </button>
            
            <h1 style={{
              color: colors.surface,
              fontSize: '56px',
              fontWeight: 900,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}>
              About MATCH MY DRIVE
            </h1>
            <p style={{ color: colors.carbon500, fontSize: '18px', marginBottom: '48px' }}>
              AI-Powered Car Matchmaker for the Modern Traveler
            </p>

            <div style={{ marginBottom: '48px' }}>
              <h2 style={{ color: colors.surface, fontSize: '32px', fontWeight: '800', marginBottom: '16px' }}>
                Our Mission
              </h2>
              <p style={{ color: colors.sand, fontSize: '16px', lineHeight: 1.8, marginBottom: '24px' }}>
                MATCH MY DRIVE leverages cutting-edge AI technology to help you find the perfect vehicle for your needs. Whether you're looking to rent a car for a weekend getaway or buy your dream vehicle, our intelligent system analyzes your preferences and matches you with the best options available.
              </p>
            </div>

            <div style={{ marginBottom: '48px' }}>
              <h2 style={{ color: colors.surface, fontSize: '32px', fontWeight: '800', marginBottom: '16px' }}>
                Key Features
              </h2>
              <ul style={{ color: colors.sand, fontSize: '16px', lineHeight: 1.8, listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ color: colors.amber, fontSize: '20px' }}>◆</span>
                  <span><strong>Automatic LLM Fallback:</strong> Multi-provider AI ensures reliability even when one service is down</span>
                </li>
                <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ color: colors.amber, fontSize: '20px' }}>◆</span>
                  <span><strong>Natural Language Search:</strong> Just tell us what you want in plain English</span>
                </li>
                <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ color: colors.amber, fontSize: '20px' }}>◆</span>
                  <span><strong>Real-Time Data:</strong> Live listings from Auto.dev API with smart fallback</span>
                </li>
                <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ color: colors.amber, fontSize: '20px' }}>◆</span>
                  <span><strong>Smart Matching:</strong> AI-powered recommendations based on your preferences</span>
                </li>
                <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ color: colors.amber, fontSize: '20px' }}>◆</span>
                  <span><strong>200+ Vehicles:</strong> Extensive fleet across 10 categories and 10 brands</span>
                </li>
              </ul>
            </div>

            <div style={{ marginBottom: '48px' }}>
              <h2 style={{ color: colors.surface, fontSize: '32px', fontWeight: '800', marginBottom: '16px' }}>
                Technology Stack
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {[
                  'Python & FastAPI',
                  'React & Vite',
                  'Google Gemini AI',
                  'Anthropic Claude',
                  'OpenAI GPT-4o',
                  'Auto.dev API',
                  'MCP Apps Protocol',
                  'A2UI Protocol',
                  'SQLite Database',
                  'Docker Compose',
                ].map((tech) => (
                  <div
                    key={tech}
                    style={{
                      background: colors.carbon800,
                      border: `1px solid ${colors.carbon700}`,
                      borderRadius: '8px',
                      padding: '12px 16px',
                      color: colors.sand,
                      fontSize: '14px',
                      fontWeight: '600',
                      textAlign: 'center',
                    }}
                  >
                    {tech}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '48px' }}>
              <h2 style={{ color: colors.surface, fontSize: '32px', fontWeight: '800', marginBottom: '16px' }}>
                Built for Amulate Summer Hackathon 2026
              </h2>
              <p style={{ color: colors.sand, fontSize: '16px', lineHeight: 1.8 }}>
                This project demonstrates production-ready AI agent architecture with automatic fallback, graceful degradation, and cutting-edge protocols (MCP Apps & A2UI). Built to solve real-world reliability challenges in AI applications.
              </p>
            </div>

            <div style={{ 
              padding: '32px',
              background: colors.carbon800,
              border: `1px solid ${colors.carbon700}`,
              borderRadius: '16px',
              textAlign: 'center',
            }}>
              <h3 style={{ color: colors.surface, fontSize: '24px', fontWeight: '800', marginBottom: '16px' }}>
                Ready to Find Your Perfect Match?
              </h3>
              <button 
                onClick={handleBackToHome}
                style={{
                  background: colors.amber,
                  color: colors.carbon,
                  padding: '16px 40px',
                  borderRadius: '16px',
                  fontWeight: '800',
                  fontSize: '16px',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                Start Searching
              </button>
            </div>
          </div>
        </section>
      )}

      {/* CTA band - Only show on home page */}
      {currentPage === 'home' && (
      <section style={{ background: colors.amber, padding: '56px 32px', textAlign: 'center' }}>
        <p style={{
          color: 'rgba(13, 13, 15, 0.6)',
          fontSize: '14px',
          fontWeight: '700',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginBottom: '12px',
        }}>
          AI-Powered Experience
        </p>
        <h2 style={{
          color: colors.carbon,
          fontWeight: 900,
          lineHeight: 1,
          marginBottom: '16px',
          fontSize: 'clamp(32px, 5vw, 56px)',
        }}>
          Find Your Perfect Match Today.
        </h2>
        <p style={{
          color: 'rgba(13, 13, 15, 0.7)',
          maxWidth: '512px',
          margin: '0 auto 32px',
        }}>
          Real-time data from Auto.dev. AI-powered recommendations. Instant results.
        </p>
        <button 
          onClick={() => setChatOpen(true)}
          style={{
            background: colors.carbon,
            color: colors.amber,
            padding: '16px 40px',
            borderRadius: '16px',
            fontWeight: '800',
            fontSize: '16px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            border: 'none',
          }}
        >
          Start Matching
        </button>
      </section>
      )}

      {/* Footer */}
      <footer style={{ background: colors.carbon, borderTop: `1px solid ${colors.carbon800}`, padding: '40px 32px' }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'row',
          gap: '24px',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: colors.amber, fontSize: '20px' }}>◆</span>
            <span style={{
              color: colors.surface,
              fontSize: '18px',
              fontWeight: '800',
              letterSpacing: '0.05em',
            }}>
              MATCH MY DRIVE
            </span>
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="#" style={{ color: colors.carbon500, fontSize: '14px', textDecoration: 'none' }}>Privacy</a>
            <a href="#" style={{ color: colors.carbon500, fontSize: '14px', textDecoration: 'none' }}>Terms</a>
            <a href="#" style={{ color: colors.carbon500, fontSize: '14px', textDecoration: 'none' }}>Support</a>
          </div>
          <p style={{ color: colors.carbon500, fontSize: '12px', margin: 0 }}>© 2026 Match My Drive. All rights reserved.</p>
        </div>
      </footer>

      {/* Floating AI chat button (mobile) */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 40,
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: colors.amber,
            color: colors.carbon,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(232, 160, 32, 0.3)',
            cursor: 'pointer',
            border: 'none',
            fontSize: '20px',
          }}
        >
          <span>◆</span>
        </button>
      )}

      {/* Chat panel */}
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} sessionId={sessionId} onPreferencesSubmit={(carsFromChat) => setCars(carsFromChat)} />

      {/* Booking modal */}
      {selectedCar && <BookingModal car={selectedCar} onClose={() => setSelectedCar(null)} intent={intent} />}
    </div>
  );
}
