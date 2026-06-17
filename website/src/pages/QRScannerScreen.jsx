import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Zap, Info, RefreshCw, CheckCircle } from 'lucide-react';

const QRScannerScreen = () => {
  const navigate = useNavigate();
  const [flashlight, setFlashlight] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState({ id: 'kcm-01', name: 'Kacchi Ghani (1L)' });

  const productsList = [
    { id: 'kcm-01', name: 'Kacchi Ghani Mustard Oil (1L)' },
    { id: 'kcm-02', name: 'Premium Filtered Mustard Oil (1L)' },
    { id: 'kcm-05', name: 'Yellow Mustard Oil (1L)' }
  ];

  // Simulating scanner recognition
  useEffect(() => {
    const timer = setTimeout(() => {
      setScanResult(selectedProduct);
      
      // Redirect after scan confirmation
      setTimeout(() => {
        navigate(`/product/${selectedProduct.id}`);
      }, 1500);
    }, 3500);

    return () => clearTimeout(timer);
  }, [selectedProduct, navigate]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Background camera mockup */}
      <div className="absolute inset-0 bg-[#0c0d12] flex items-center justify-center opacity-60">
        <div className="w-full h-full bg-[radial-gradient(#ffffff05_1px,transparent_1px)] bg-[size:16px_16px]" />
      </div>

      {/* Laser line overlay */}
      {!scanResult && (
        <div className="absolute left-0 right-0 h-1 bg-red-500 shadow-[0_0_15px_#ef4444] z-20 animate-scan" />
      )}

      {/* Header overlay */}
      <div className="px-6 py-4 bg-black/60 border-b border-white/5 flex items-center justify-between relative z-10 backdrop-blur-md">
        <Link to="/" className="p-2 bg-white/5 rounded-xl border border-white/10 active:scale-95 text-slate-300">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <span className="text-xs font-black uppercase tracking-widest text-slate-200">
          Barcode / QR Scanner
        </span>
        <button 
          onClick={() => setFlashlight(!flashlight)}
          className={`p-2 rounded-xl border transition-colors active:scale-95 ${flashlight ? 'bg-mustard-500 border-mustard-400 text-slate-900' : 'bg-white/5 border-white/10 text-slate-300'}`}
        >
          <Zap className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        {/* Scanner Target Guide Box */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 border-2 border-white/20 rounded-[2.5rem] flex items-center justify-center overflow-hidden bg-black/40 backdrop-blur-[1px]">
          {/* Target Corner brackets */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-mustard-500 rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-mustard-500 rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-mustard-500 rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-mustard-500 rounded-br-lg" />

          {/* Flashlight beam simulation */}
          {flashlight && (
            <div className="absolute inset-0 bg-white/20 blur-xl pointer-events-none" />
          )}

          {/* Result Confirmation card overlay */}
          <AnimatePresence>
            {scanResult && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-4 bg-slate-900/95 rounded-[2rem] border border-green-500/30 p-6 flex flex-col items-center justify-center text-center gap-3 z-30"
              >
                <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400">
                  <CheckCircle className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-green-400 uppercase tracking-widest">Matched Product</p>
                  <h3 className="text-sm font-black text-white mt-1 uppercase leading-snug">{scanResult.name}</h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold mt-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-mustard-500" /> Opening Pipeline...
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Simulated UPC barcode */}
          <div className="flex flex-col items-center gap-2 opacity-30">
            <div className="w-48 h-12 flex gap-1 justify-center">
              {[1,3,2,1,4,1,2,1,3,1,4,2,1,3,1,2,1,4,1].map((w, i) => (
                <div key={i} className="h-full bg-white" style={{ width: `${w * 2}px` }} />
              ))}
            </div>
            <span className="text-[8px] font-mono tracking-widest">0 9542154 091514 8</span>
          </div>
        </div>

        <p className="mt-8 text-xs text-center text-slate-400 max-w-xs leading-relaxed">
          Align the KC Traders canister or bottle barcode/QR code within the frame to automatically view production dates and verify authenticity.
        </p>

        {/* Simulator Settings Sheet */}
        <div className="mt-12 w-full max-w-sm bg-white/5 border border-white/10 rounded-3xl p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
            <Info className="w-3.5 h-3.5 text-mustard-500" /> Simulator Controls
          </p>
          <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
            Select a product variant below to simulate scanning it:
          </p>
          <div className="flex flex-col gap-2">
            {productsList.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setScanResult(null);
                  setSelectedProduct(p);
                }}
                className={`w-full py-2 px-3 text-left rounded-xl text-xs font-bold transition-all border ${
                  selectedProduct.id === p.id 
                    ? 'bg-mustard-500/10 border-mustard-500 text-mustard-500 shadow-lg' 
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerScreen;
