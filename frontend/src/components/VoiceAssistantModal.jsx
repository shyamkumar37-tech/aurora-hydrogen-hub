import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, X, Sparkles, Navigation, Fuel, ShieldCheck, Zap, CornerDownLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function VoiceAssistantModal({ isOpen, onClose, user, walletBalance, stations = [] }) {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevels, setAudioLevels] = useState([12, 18, 24, 32, 28, 16, 10]);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
        if (event.results[current].isFinal) {
          processVoiceCommand(text);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Equalizer visualizer animation when listening or speaking
  useEffect(() => {
    let interval;
    if (isListening || isSpeaking) {
      interval = setInterval(() => {
        setAudioLevels([
          Math.floor(Math.random() * 38) + 8,
          Math.floor(Math.random() * 45) + 12,
          Math.floor(Math.random() * 52) + 16,
          Math.floor(Math.random() * 58) + 20,
          Math.floor(Math.random() * 48) + 14,
          Math.floor(Math.random() * 36) + 10,
          Math.floor(Math.random() * 25) + 6,
        ]);
      }, 90);
    } else {
      setAudioLevels([10, 14, 18, 22, 18, 14, 10]);
    }
    return () => clearInterval(interval);
  }, [isListening, isSpeaking]);

  const speak = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    
    // Choose a high-quality voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.lang.startsWith('en'));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const processVoiceCommand = (rawText) => {
    const text = rawText.toLowerCase().trim();
    let reply = "";

    if (text.includes('balance') || text.includes('wallet') || text.includes('funds')) {
      reply = `Your current Aurora wallet balance is ₹${walletBalance?.toLocaleString() || 0}. You have sufficient funds for refuels.`;
      speak(reply);
      setResponse(reply);
    } else if (text.includes('station') || text.includes('nearest') || text.includes('pump') || text.includes('find')) {
      const activeCount = stations.length || 3;
      reply = `I found ${activeCount} active Green Hydrogen stations near you. The Koramangala Hub has 700 bar dispensers ready with zero queue.`;
      speak(reply);
      setResponse(reply);
      setTimeout(() => {
        onClose();
        navigate('/stations');
      }, 2600);
    } else if (text.includes('book') || text.includes('reserve') || text.includes('slot')) {
      reply = "Opening the smart dispenser reservation terminal now.";
      speak(reply);
      setResponse(reply);
      setTimeout(() => {
        onClose();
        navigate('/customer/book');
      }, 2200);
    } else if (text.includes('trip') || text.includes('route') || text.includes('plan')) {
      reply = "Navigating to the AI H2 Trip Planner.";
      speak(reply);
      setResponse(reply);
      setTimeout(() => {
        onClose();
        navigate('/customer/trip-planner');
      }, 2000);
    } else if (text.includes('certificate') || text.includes('carbon') || text.includes('esg') || text.includes('saved')) {
      reply = "Your zero-emission green hydrogen has prevented over 412 kilograms of CO2 from entering our atmosphere.";
      speak(reply);
      setResponse(reply);
    } else if (text.includes('hello') || text.includes('hi') || text.includes('aurora')) {
      reply = `Greetings ${user?.name?.split(' ')[0] || 'Captain'}. I am Aurora Voice Copilot. How can I assist your hydrogen journey today?`;
      speak(reply);
      setResponse(reply);
    } else {
      reply = `Understood: "${rawText}". I am analyzing optimal hydrogen logistics and telemetry.`;
      speak(reply);
      setResponse(reply);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Web Speech API is not supported in this browser. You can type commands below.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setResponse('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Speech start error', err);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1200, backdropFilter: 'blur(12px)', background: 'rgba(3, 7, 18, 0.85)' }}>
      <div style={{
        background: 'linear-gradient(145deg, #090e1a 0%, #040711 100%)',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        borderRadius: '28px',
        width: '100%',
        maxWidth: '560px',
        padding: '36px',
        boxShadow: '0 25px 70px rgba(0, 0, 0, 0.9), 0 0 50px rgba(6, 182, 212, 0.15)',
        position: 'relative',
        textAlign: 'center'
      }}>
        {/* Close button */}
        <button 
          onClick={() => {
            window.speechSynthesis?.cancel();
            onClose();
          }}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            color: '#a1a1aa',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {/* AI Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(6, 182, 212, 0.12)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          padding: '6px 14px',
          borderRadius: '999px',
          color: 'var(--accent-cyan)',
          fontSize: '12px',
          fontWeight: '700',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '24px'
        }}>
          <Sparkles size={14} />
          <span>Next-Gen Voice Copilot</span>
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', margin: '0 0 8px 0' }}>
          Aurora In-Car Voice AI
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 32px 0' }}>
          Speak natural hands-free commands while driving or navigating stations.
        </p>

        {/* Glowing Interactive Voice Orb */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '32px' }}>
          <button
            onClick={toggleListening}
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: isListening
                ? 'radial-gradient(circle, #06b6d4 0%, #0284c7 70%, #0369a1 100%)'
                : isSpeaking
                ? 'radial-gradient(circle, #10b981 0%, #059669 70%, #047857 100%)'
                : 'radial-gradient(circle, #1e293b 0%, #0f172a 100%)',
              border: isListening ? '4px solid rgba(6, 182, 212, 0.8)' : '2px solid rgba(255,255,255,0.1)',
              boxShadow: isListening
                ? '0 0 45px rgba(6, 182, 212, 0.6), inset 0 0 20px rgba(255,255,255,0.4)'
                : isSpeaking
                ? '0 0 45px rgba(16, 185, 129, 0.6)'
                : '0 10px 30px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isListening || isSpeaking ? 'scale(1.06)' : 'scale(1)',
              outline: 'none'
            }}
          >
            {isListening ? (
              <Mic size={40} color="#ffffff" />
            ) : isSpeaking ? (
              <Volume2 size={40} color="#ffffff" />
            ) : (
              <Mic size={38} color="#06b6d4" />
            )}
            <span style={{ fontSize: '10px', color: '#ffffff', fontWeight: '700', marginTop: '6px', textTransform: 'uppercase' }}>
              {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : 'Tap to Talk'}
            </span>
          </button>
        </div>

        {/* Dynamic Soundwave Equalizer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '50px', marginBottom: '24px' }}>
          {audioLevels.map((height, idx) => (
            <div
              key={idx}
              style={{
                width: '6px',
                height: `${height}px`,
                background: isListening
                  ? 'linear-gradient(180deg, #06b6d4 0%, #3b82f6 100%)'
                  : isSpeaking
                  ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)'
                  : 'rgba(255, 255, 255, 0.15)',
                borderRadius: '999px',
                transition: 'height 0.1s ease-in-out'
              }}
            />
          ))}
        </div>

        {/* Live Transcription or Response Box */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '16px 20px',
          minHeight: '70px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          {transcript && (
            <p style={{ color: '#06b6d4', fontSize: '15px', fontWeight: '600', margin: '0 0 6px 0', fontStyle: 'italic' }}>
              "{transcript}"
            </p>
          )}
          {response ? (
            <p style={{ color: '#f8fafc', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
              {response}
            </p>
          ) : !transcript ? (
            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
              Say: <strong style={{ color: '#94a3b8' }}>"Find nearest station"</strong>, <strong style={{ color: '#94a3b8' }}>"Check my wallet balance"</strong>, or <strong style={{ color: '#94a3b8' }}>"Book 5kg at 700 bar"</strong>
            </p>
          ) : null}
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
          {[
            'Check my wallet balance',
            'Find nearest 700 bar station',
            'Book hydrogen refill',
            'How much CO2 have I saved?'
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => {
                setTranscript(prompt);
                processVoiceCommand(prompt);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                borderRadius: '20px',
                padding: '6px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#06b6d4';
                e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
