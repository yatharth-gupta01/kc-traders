import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LoadingScreen = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 800); // Wait for exit animation
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-mustard-50 dark:bg-earth-dark"
        >
          <div className="relative w-24 h-24 mb-8">
            {/* Abstract animated drop */}
            <motion.div
              animate={{ 
                y: [0, 20, 0],
                scale: [1, 1.1, 1],
                borderRadius: ["50% 50% 50% 50%", "40% 60% 60% 40%", "50% 50% 50% 50%"]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-tr from-mustard-600 to-mustard-300 shadow-[0_0_30px_rgba(234,179,8,0.5)]"
              style={{
                borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%" // Drop shape
              }}
            />
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-2xl font-display font-bold text-mustard-800 dark:text-mustard-400 tracking-wider"
          >
            KC TRADERS
          </motion.div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 150 }}
            transition={{ duration: 1.5, ease: "circOut" }}
            className="h-1 bg-mustard-500 mt-4 rounded-full"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
