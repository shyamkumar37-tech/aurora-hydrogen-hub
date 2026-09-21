import React, { useState, useRef, useEffect, useContext } from 'react';
import { Send, Bot, User, Loader, Sparkles, Navigation, MapPin } from 'lucide-react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your Aurora Smart Assistant. Ask me anything about refueling, routing, or your impact!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const suggestedQuestions = [
    "Where is the cheapest station?",
    "Find nearest operational station",
    "How much did I spend this month?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (text = input) => {
    if (!text.trim()) return;
    
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/refueling-assistant', { message: text });
      const reply = res.data?.data?.reply || res.data?.reply || "I am online and ready to assist you with refueling questions.";
      const structuredData = res.data?.data?.structuredData || res.data?.structuredData || null;
      
      const assistantMsg = { 
        role: 'assistant', 
        content: reply, 
        data: structuredData 
      };
      
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('AI assistant error:', err);
      const serverMsg = err.response?.data?.message;
      const fallbackContent = serverMsg 
        ? `Aurora Assistant: ${serverMsg}`
        : "I'm experiencing a brief network sync delay. You can find active stations directly on your dashboard or try asking again!";
      setMessages(prev => [...prev, { role: 'assistant', content: fallbackContent }]);
    } finally {
      setLoading(false);
    }
  };

  const renderStructuredData = (data) => {
    if (!data) return null;
    
    if (data.type === 'station_recommendation') {
      const st = data.station;
      return (
        <div style={{ marginTop: '12px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(0, 255, 255, 0.1)' }}>
          <div style={{ fontWeight: '500', color: '#fff', marginBottom: '4px' }}>{st.name}</div>
          <div style={{ color: '#a1a1aa', fontSize: '0.875rem', marginBottom: '12px' }}>{data.reason}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <div>
              <div style={{ color: '#71717a', fontSize: '0.75rem' }}>Price</div>
              <div style={{ color: '#00ffff', fontWeight: '500' }}>₹{st.pricePerKg}/kg</div>
            </div>
            <div>
              <div style={{ color: '#71717a', fontSize: '0.75rem' }}>Pumps</div>
              <div style={{ color: '#fff' }}>{st.availablePumps}/{st.totalPumps}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => navigate(`/customer/book?station=${st._id}`)}
              style={{ flex: 1, padding: '8px', background: 'var(--accent-cyan)', color: '#000', border: 'none', borderRadius: '4px', fontSize: '0.875rem', cursor: 'pointer', fontWeight: '500' }}
            >
              Book Slot
            </button>
            <button style={{ padding: '8px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>
              <Navigation size={16} />
            </button>
          </div>
        </div>
      );
    }
    
    if (data.type === 'spend_summary') {
       return (
         <div style={{ marginTop: '12px', display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, background: 'rgba(0, 0, 0, 0.4)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
               <div style={{ color: '#71717a', fontSize: '0.75rem', marginBottom: '4px' }}>Monthly Spend</div>
               <div style={{ fontSize: '1.25rem', color: '#fff' }}>₹{data.totalSpend.toFixed(2)}</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(0, 0, 0, 0.4)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
               <div style={{ color: '#71717a', fontSize: '0.75rem', marginBottom: '4px' }}>H₂ Dispensed</div>
               <div style={{ fontSize: '1.25rem', color: '#fff' }}>{data.totalKg.toFixed(1)} kg</div>
            </div>
         </div>
       );
    }

    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'linear-gradient(180deg, rgba(20,20,22,1) 0%, rgba(10,10,12,1) 100%)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(0, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ffff' }}>
          <Sparkles size={16} />
        </div>
        <div>
          <div style={{ fontWeight: '500', color: '#fff' }}>Aurora Intelligence</div>
          <div style={{ fontSize: '0.75rem', color: '#71717a' }}>Always active</div>
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
            
            {/* Avatar */}
            <div style={{ 
              width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: msg.role === 'user' ? '#fff' : 'transparent',
              color: msg.role === 'user' ? '#000' : '#00ffff',
              border: msg.role === 'assistant' ? '1px solid rgba(0, 255, 255, 0.2)' : 'none'
            }}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>

            {/* Bubble */}
            <div style={{ maxWidth: '80%' }}>
              <div style={{ 
                padding: '12px 16px', 
                background: msg.role === 'user' ? '#27272a' : 'rgba(0, 255, 255, 0.05)', 
                color: '#e4e4e7',
                borderRadius: msg.role === 'user' ? '12px 0px 12px 12px' : '0px 12px 12px 12px',
                fontSize: '0.875rem',
                lineHeight: '1.5'
              }}>
                {/* Basic markdown bold parsing for demonstration */}
                {msg.content.split('**').map((part, idx) => idx % 2 === 1 ? <strong key={idx} style={{ color: '#fff' }}>{part}</strong> : part)}
              </div>
              {msg.data && renderStructuredData(msg.data)}
            </div>
            
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'transparent', border: '1px solid rgba(0, 255, 255, 0.2)', color: '#00ffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader size={14} className="spin" />
            </div>
            <div style={{ padding: '12px 16px', background: 'rgba(0, 255, 255, 0.05)', borderRadius: '0 12px 12px 12px', fontSize: '0.875rem', color: '#71717a' }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length < 3 && (
        <div style={{ padding: '0 24px 16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {suggestedQuestions.map((q, i) => (
            <button 
              key={i} 
              onClick={() => handleSend(q)}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', padding: '6px 12px', borderRadius: '16px', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0A0A0B' }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about refueling, routes, or stats..." 
            style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px 16px', borderRadius: '8px', fontSize: '0.875rem', outline: 'none' }}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            style={{ width: '40px', height: '40px', borderRadius: '8px', background: input.trim() ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)', color: input.trim() ? '#000' : '#71717a', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
      
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
