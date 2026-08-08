import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Car,
  CheckCircle,
  Clock,
  ShieldCheck,
  CreditCard,
  Sparkles,
  TrendingUp,
  DollarSign,
  Zap,
  Target,
  Sliders,
  X,
  Lightbulb,
  ArrowRight,
  Filter,
  Search,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const CATEGORIES = [
  'SUV', 'Sedan', 'EV', 'Luxury', 'Sports',
  'Hybrid', 'Compact', 'Truck', 'Minivan', 'Convertible',
];

// Modern gradient backgrounds
const gradients = {
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  accent: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  dark: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  card: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
};

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '10px',
  background: '#0f172a',
  color: '#fff',
  border: '1px solid #334155',
  fontSize: '14px',
  transition: 'all 0.3s ease',
};

const labelStyle = {
  fontSize: '12px',
  color: '#94a3b8',
  marginBottom: '6px',
  display: 'block',
  fontWeight: 500,
};

function StatusIcon({ status }) {
  if (status === 'COMPLETED') return <CheckCircle size={16} color="#22c55e" />;
  if (status === 'IN_PROGRESS') return <Clock size={16} color="#38bdf8" />;
  return <Clock size={16} color="#64748b" />;
}

function PreferencePanel({ app, onSubmit, loading, onUpdate }) {
  const fields = app.fields || {};
  const budgetField = fields.budget || {};
  const [intent, setIntent] = useState('Rent');
  const [isMinimized, setIsMinimized] = useState(false);

  const isRent = intent === 'Rent';
  const budgetLabel = isRent
    ? (budgetField.label_rent || 'Max Daily Rental Rate ($/day)')
    : (budgetField.label_buy || 'Max Purchase Budget ($ total)');
  const budgetDefault = isRent
    ? (budgetField.default_rent || 200)
    : (budgetField.default_buy || 60000);
  const budgetMin = isRent ? (budgetField.min_rent || 50) : (budgetField.min_buy || 15000);

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    // Add the intent state to the form data
    data.intent = intent;
    onSubmit(e, data);
  };

  if (isMinimized) {
    return (
      <div style={{
        background: gradients.card,
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}
      onClick={() => setIsMinimized(false)}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#667eea'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#334155'}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: gradients.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sliders size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f8fafc' }}>
                Preferences
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                {intent} • SUV • ${budgetDefault}
              </div>
            </div>
          </div>
          <ArrowRight size={18} color="#94a3b8" />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: gradients.card,
      border: '1px solid #334155',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: gradients.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
          }}>
            <Sliders size={20} color="#fff" />
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '16px', fontWeight: 'bold' }}>
              Your Preferences
            </h3>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Customize your search
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
          }}
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <input type="hidden" name="intent" value={intent} />
        <div>
          <label style={labelStyle}>{fields.intent?.label || 'Intent'}</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['Rent', 'Buy'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setIntent(option);
                  // Update the hidden input
                  const hiddenInput = document.querySelector('input[name="intent"]');
                  if (hiddenInput) hiddenInput.value = option;
                  if (onUpdate) onUpdate({ intent: option });
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: intent === option ? '2px solid #f5576c' : '1px solid #334155',
                  background: intent === option ? 'rgba(245, 87, 108, 0.2)' : '#0f172a',
                  color: intent === option ? '#f5576c' : '#94a3b8',
                  fontWeight: intent === option ? 'bold' : 'normal',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>{fields.category?.label || 'Category'}</label>
          <select
            name="category"
            defaultValue="SUV"
            style={inputStyle}
            onChange={(e) => onUpdate && onUpdate({ category: e.target.value })}
          >
            {(fields.category?.options || CATEGORIES).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>{budgetLabel}</label>
          <input
            type="number"
            name="budget"
            key={intent}
            defaultValue={budgetDefault}
            min={budgetMin}
            step={isRent ? 10 : 1000}
            style={inputStyle}
            onChange={(e) => onUpdate && onUpdate({ budget: e.target.value })}
          />
          <div style={{
            marginTop: '8px',
            padding: '8px 12px',
            background: 'rgba(56, 189, 248, 0.1)',
            borderRadius: '8px',
            fontSize: '11px',
            color: '#38bdf8',
          }}>
            💡 {isRent
              ? 'Try $100–$500/day for available rentals'
              : 'Try $20,000–$100,000 for available vehicles'}
          </div>
        </div>

        <div>
          <label style={labelStyle}>{fields.target_date?.label || 'Target Date'}</label>
          <input
            type="date"
            name="target_date"
            style={inputStyle}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? '#475569' : gradients.primary,
            color: '#fff',
            fontWeight: 'bold',
            border: 'none',
            padding: '14px',
            borderRadius: '10px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '15px',
            boxShadow: loading ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {loading ? (
            <>
              <Clock size={18} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Target size={18} />
              Find Cars
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function CarCard({ car, onCheckout }) {
  return (
    <div
      style={{
        background: gradients.card,
        border: '1px solid #334155',
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.3)';
        e.currentTarget.style.borderColor = '#667eea';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = '#334155';
      }}
    >
      <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
        <img
          src={car.image_url || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800'}
          alt={car.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {car.source === 'api' && (
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(34, 197, 94, 0.9)',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 'bold',
            backdropFilter: 'blur(8px)',
          }}>
            Live Data
          </div>
        )}
      </div>
      <div style={{ padding: '20px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#f8fafc', fontWeight: 'bold' }}>
          {car.title}
        </h4>
        <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
          {car.year} • {car.category}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            background: gradients.primary,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent'
          }}>
            {car.price_display}
          </div>
        </div>
        <button
          onClick={() => onCheckout(car)}
          style={{
            width: '100%',
            background: gradients.primary,
            color: '#fff',
            fontWeight: 'bold',
            border: 'none',
            padding: '12px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          onMouseEnter={(e) => e.target.style.background = 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'}
          onMouseLeave={(e) => e.target.style.background = gradients.primary}
        >
          <Car size={18} />
          Book Now
        </button>
      </div>
    </div>
  );
}

function LiveResultsPanel({ cars, onCheckout, statusSteps, hasSubmitted }) {
  if (!hasSubmitted) {
    return (
      <div style={{
        background: gradients.card,
        border: '1px solid #334155',
        borderRadius: '16px',
        padding: '60px 40px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: gradients.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
        }}>
          <Car size={48} color="#fff" />
        </div>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '24px', color: '#f8fafc', fontWeight: 'bold' }}>
          Find Your Perfect Car
        </h3>
        <p style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '32px', lineHeight: 1.6 }}>
          AI-powered car matching with real-time market data
        </p>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 20px',
          background: 'rgba(102, 126, 234, 0.2)',
          borderRadius: '10px',
          color: '#667eea',
          fontWeight: '600',
          border: '1px solid rgba(102, 126, 234, 0.3)',
        }}>
          <Sliders size={18} />
          Set your preferences to get started
        </div>
      </div>
    );
  }

  if (!cars || cars.length === 0) {
    return (
      <div style={{
        background: gradients.card,
        border: '1px solid #334155',
        borderRadius: '16px',
        padding: '60px 40px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: gradients.success,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 8px 24px rgba(79, 172, 254, 0.4)',
        }}>
          <Search size={40} color="#fff" />
        </div>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: '#f8fafc' }}>
          Searching for Cars
        </h3>
        <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px' }}>
          AI is finding the best matches for you...
        </p>
        {statusSteps.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            {statusSteps.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
                <StatusIcon status={s.status} />
                <span>{s.step}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: gradients.success,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(79, 172, 254, 0.4)',
          }}>
            <Car size={20} color="#fff" />
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', fontWeight: 'bold' }}>
              Live Results
            </h3>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              {cars.length} cars found
            </div>
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'rgba(34, 197, 94, 0.1)',
          borderRadius: '20px',
          border: '1px solid rgba(34, 197, 94, 0.3)',
        }}>
          <Zap size={16} color="#22c55e" />
          <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: '600' }}>
            Live
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {cars.map((car) => (
          <CarCard key={car.id} car={car} onCheckout={onCheckout} />
        ))}
      </div>
    </div>
  );
}

function AIInsightsPanel({ messages, statusSteps }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div style={{
      background: gradients.card,
      border: '1px solid #334155',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: gradients.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(240, 147, 251, 0.4)',
          }}>
            <Lightbulb size={20} color="#fff" />
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '16px', fontWeight: 'bold' }}>
              AI Insights
            </h3>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Smart recommendations
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
          }}
        >
          {isExpanded ? <X size={18} /> : <Sparkles size={18} />}
        </button>
      </div>

      {isExpanded && (
        <>
          {statusSteps.length > 0 && (
            <div style={{
              background: 'rgba(56, 189, 248, 0.1)',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '16px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                Progress
              </div>
              {statusSteps.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '13px' }}>
                  <StatusIcon status={s.status} />
                  <span style={{ color: s.status === 'COMPLETED' ? '#f8fafc' : '#94a3b8' }}>
                    {s.step}
                  </span>
                </div>
              ))}
            </div>
          )}

          {messages.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.slice(-3).map((m, i) => (
                <div
                  key={i}
                  style={{
                    background: m.sender === 'user' ? gradients.primary : '#1e293b',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    color: '#f8fafc',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  {m.text}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CheckoutApp({ app, onConfirm, loading }) {
  const [cardData, setCardData] = useState({
    cardholder_name: '',
    mock_card_number: '',
    exp_date: '',
    cvv: '',
    terms_accepted: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCardData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(app);
  };

  return (
    <div style={{
      background: gradients.card,
      border: '1px solid #334155',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    }}>
      <div style={{
        background: 'rgba(34, 197, 94, 0.1)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        textAlign: 'center',
      }}>
        <ShieldCheck size={48} color="#22c55e" style={{ margin: '0 auto 12px auto' }} />
        <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#f8fafc', fontWeight: 'bold' }}>
          Secure Checkout
        </h3>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>
          Merchant: {app.merchant}
        </p>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '0' }}>
          {app.car_model}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Cardholder Name</label>
          <input
            name="cardholder_name"
            value={cardData.cardholder_name}
            onChange={handleChange}
            style={inputStyle}
            placeholder="John Doe"
            required
          />
        </div>
        <div>
          <label style={labelStyle}>Mock Card Number</label>
          <input
            name="mock_card_number"
            value={cardData.mock_card_number}
            onChange={handleChange}
            style={inputStyle}
            placeholder="4111 1111 1111 1111"
            required
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Exp Date</label>
            <input
              name="exp_date"
              value={cardData.exp_date}
              onChange={handleChange}
              style={inputStyle}
              placeholder="MM/YY"
              required
            />
          </div>
          <div>
            <label style={labelStyle}>CVV</label>
            <input
              name="cvv"
              value={cardData.cvv}
              onChange={handleChange}
              style={inputStyle}
              placeholder="123"
              required
            />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            name="terms_accepted"
            checked={cardData.terms_accepted}
            onChange={handleChange}
            id="terms"
            required
            style={{ width: '16px', height: '16px' }}
          />
          <label htmlFor="terms" style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
            I accept the mock terms and conditions
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? '#475569' : gradients.success,
            color: '#fff',
            fontWeight: 'bold',
            border: 'none',
            padding: '14px',
            borderRadius: '10px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '15px',
            boxShadow: loading ? 'none' : '0 4px 12px rgba(79, 172, 254, 0.4)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {loading ? (
            <>
              <Clock size={18} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard size={18} />
              Confirm Payment
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function App() {
  const [sessionId] = useState(() => `session_${Math.random().toString(36).slice(2, 11)}`);
  const [messages, setMessages] = useState([]);
  const [a2uiComponents, setA2uiComponents] = useState([]);
  const [statusSteps, setStatusSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentState, setCurrentState] = useState('INTERVIEW');
  const [lastCars, setLastCars] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const initializedRef = useRef(false);

  const sendToAgent = useCallback(async (text, formData = null) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: text, form_data: formData }),
      });
      const data = await res.json();

      if (text) {
        setMessages((prev) => [...prev, { sender: 'user', text }]);
      }
      if (data.text) {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.sender === 'agent' && last.text === data.text) return prev;
          return [...prev, { sender: 'agent', text: data.text }];
        });
      }
      if (data.current_state) {
        setCurrentState(data.current_state);
      }

      if (data.a2ui_events?.length) {
        const isPreferenceSubmit = formData?.intent && formData?.category;

        for (const evt of data.a2ui_events) {
          if (evt.a2ui_type === 'UPDATE_STATUS') {
            setStatusSteps(evt.status_steps);
          }
          if (evt.a2ui_type === 'RENDER_MCP_APP' || evt.a2ui_type === 'RENDER_CATALOG_GRID') {
            if (isPreferenceSubmit && evt.a2ui_type === 'RENDER_MCP_APP' && evt.app?.app_id === 'app_car_preference_interview') {
              continue;
            }
            if (evt.a2ui_type === 'RENDER_CATALOG_GRID') {
              setLastCars(evt.items || []);
            }
            setA2uiComponents((prev) => [...prev, evt]);
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      sendToAgent('', null);
    }
  }, [sendToAgent]);

  const handleFormSubmit = (e, data) => {
    e.preventDefault();
    setHasSubmitted(true);
    sendToAgent('Submitted preferences', data);
  };

  const handleCheckoutTrigger = (car) => {
    sendToAgent(`Initiate booking for ${car.title}`, {
      checkout_car_id: car.id,
      car_name: car.title,
      amount: car.price_value,
    });
  };

  const handleCheckoutConfirm = (app) => {
    sendToAgent('Confirm payment', {
      checkout_car_id: app.car_id,
      checkout_confirmed: true,
    });
  };

  const renderComponent = (comp, idx) => {
    if (comp.a2ui_type === 'RENDER_MCP_APP') {
      const app = comp.app;
      if (app.app_id === 'app_mock_checkout') {
        return <CheckoutApp key={idx} app={app} onConfirm={handleCheckoutConfirm} loading={loading} />;
      }
    }
    return null;
  };

  const stateColors = {
    INTERVIEW: '#38bdf8',
    RESEARCH: '#fbbf24',
    RECOMMENDATION: '#22c55e',
    CHECKOUT: '#a78bfa',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
      {/* Modern Header */}
      <header style={{
        padding: '20px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: gradients.dark,
        borderBottom: '1px solid #334155',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: gradients.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
          }}>
            <Car size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>
              AI Car Matchmaker
            </h1>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>
              Powered by AI • Real-time Data
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontSize: '12px',
            background: stateColors[currentState] || '#64748b',
            color: '#0f172a',
            padding: '6px 16px',
            borderRadius: '20px',
            fontWeight: 700,
            boxShadow: `0 2px 8px ${stateColors[currentState]}40`,
          }}>
            {currentState}
          </span>
        </div>
      </header>

      {/* Modern Split Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel - Preferences */}
        <div style={{
          width: '380px',
          padding: '24px',
          overflowY: 'auto',
          borderRight: '1px solid #334155',
          background: 'rgba(15, 23, 42, 0.5)',
        }}>
          {a2uiComponents.some(c => c.a2ui_type === 'RENDER_MCP_APP' && c.app?.app_id === 'app_car_preference_interview') ? (
            <PreferencePanel
              app={a2uiComponents.find(c => c.a2ui_type === 'RENDER_MCP_APP' && c.app?.app_id === 'app_car_preference_interview')?.app || { fields: {
                intent: { label: 'Intent', options: ['Rent', 'Buy'] },
                category: { label: 'Category', options: CATEGORIES },
                budget: {
                  label_rent: 'Max Daily Rental Rate ($/day)',
                  label_buy: 'Max Purchase Budget ($ total)',
                  default_rent: 200,
                  default_buy: 60000,
                  min_rent: 50,
                  min_buy: 15000
                },
                target_date: { label: 'Target Purchase / Rental Date' }
              }}}
              onSubmit={handleFormSubmit}
              loading={loading}
            />
          ) : (
            <PreferencePanel
              app={{ fields: {
                intent: { label: 'Intent', options: ['Rent', 'Buy'] },
                category: { label: 'Category', options: CATEGORIES },
                budget: {
                  label_rent: 'Max Daily Rental Rate ($/day)',
                  label_buy: 'Max Purchase Budget ($ total)',
                  default_rent: 200,
                  default_buy: 60000,
                  min_rent: 50,
                  min_buy: 15000
                },
                target_date: { label: 'Target Purchase / Rental Date' }
              }}}
              onSubmit={handleFormSubmit}
              loading={loading}
            />
          )}

          {/* AI Insights */}
          <div style={{ marginTop: '24px' }}>
            <AIInsightsPanel messages={messages} statusSteps={statusSteps} />
          </div>
        </div>

        {/* Main Content - Live Results */}
        <div style={{
          flex: 1,
          padding: '32px',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        }}>
          {/* Checkout Component */}
          {a2uiComponents.some(c => c.a2ui_type === 'RENDER_MCP_APP' && c.app?.app_id === 'app_mock_checkout') && (
            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
              {a2uiComponents
                .filter(c => c.a2ui_type === 'RENDER_MCP_APP' && c.app?.app_id === 'app_mock_checkout')
                .map((comp, idx) => renderComponent(comp, idx))}
            </div>
          )}

          {/* Live Results */}
          <LiveResultsPanel cars={lastCars} onCheckout={handleCheckoutTrigger} statusSteps={statusSteps} hasSubmitted={hasSubmitted} />
        </div>
      </div>
    </div>
  );
}
