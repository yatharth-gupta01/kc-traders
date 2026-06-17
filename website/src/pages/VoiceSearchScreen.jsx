import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Mic, Search, Volume2 } from 'lucide-react';

const VoiceSearchScreen = () => {
  const navigate = useNavigate();
  const [recognizedText, setRecognizedText] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('Kacchi Ghani');

  const termsList = [
    { text: 'Kacchi Ghani', query: 'Kacchi Ghani' },
    { text: 'Premium Filtered', query: 'Filtered' },
    { text: 'Yellow Oil', query: 'Yellow' }
  ];

  // Simulating listening
  useEffect(() => {
    const timer = setTimeout(() => {
      setRecognizedText(selectedTerm);
      
      // Redirect after confirmation
      setTimeout(() => {
        navigate('/shop'); // Route to search results
      }, 1500);
    }, 3500);

    return () => clearTimeout(timer);
  }, [selectedTerm, navigate]);

  return (
    <div className="min-h-screen bg-[#0a0503] text-white flex flex-col relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-mustard-500/10 rounded-full blur-3xl" />

      {/* Header overlay */}
      <div className="px-6 py-4 bg-transparent border-b border-white/5 flex items-center justify-between relative z-10">
        <Link to="/" className="p-2 bg-white/5 rounded-xl border border-white/10 active:scale-95 text-slate-300">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <span className="text-xs font-black uppercase tracking-widest text-slate-200">
          Voice Search Portal
        </span>
        <div className="w-9 h-9 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 text-slate-300">
          <Volume2 className="w-4 h-4" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        {/* Equalizer Waveform animation */}
        <div className="h-24 flex items-end justify-center gap-1.5 mb-16">
          {!recognizedText ? (
            <>
              <motion.div className="w-2.5 h-6 bg-mustard-500 rounded-full origin-bottom animate-wave-1" />
              <motion.div className="w-2.5 h-12 bg-mustard-500 rounded-full origin-bottom animate-wave-2" />
              <motion.div className="w-2.5 h-20 bg-mustard-500 rounded-full origin-bottom animate-wave-3" />
              <motion.div className="w-2.5 h-14 bg-mustard-500 rounded-full origin-bottom animate-wave-4" />
              <motion.div className="w-2.5 h-8 bg-mustard-500 rounded-full origin-bottom animate-wave-5" />
            </>
          ) : (
            <div className="flex items-center gap-2 text-green-500">
              <Mic className="w-10 h-10 animate-bounce" />
            </div>
          )}
        </div>

        {/* Dynamic prompt */}
        <div className="text-center space-y-4 max-w-sm">
          <AnimatePresence mode="wait">
            {!recognizedText ? (
              <motion.div
                key="listening"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <h2 className="text-2xl font-display font-black text-white">Listening...</h2>
                <p className="text-sm text-slate-400">Say "Kacchi Ghani" or "Filtered Oil"</p>
              </motion.div>
            ) : (
              <motion.div
                key="recognized"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-2"
              >
                <p className="text-[10px] font-black text-green-400 uppercase tracking-widest">Recognized Query</p>
                <h2 className="text-3xl font-display font-black text-mustard-500 italic">"{recognizedText}"</h2>
                <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 mt-2">
                  <Search className="w-4 h-4 animate-spin text-mustard-500" /> Redirecting to Aisle...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Simulator Settings Sheet */}
        <div className="mt-20 w-full max-w-sm bg-white/5 border border-white/10 rounded-3xl p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
             Voice Term Simulator
          </p>
          <div className="flex flex-col gap-2">
            {termsList.map((t) => (
              <button
                key={t.query}
                onClick={() => {
                  setRecognizedText('');
                  setSelectedTerm(t.text);
                }}
                className={`w-full py-2.5 px-4 text-left rounded-xl text-xs font-bold transition-all border ${
                  selectedTerm === t.text
                    ? 'bg-mustard-500/10 border-mustard-500 text-mustard-500 shadow-lg' 
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                Simulate: "{t.text}"
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceSearchScreen;
