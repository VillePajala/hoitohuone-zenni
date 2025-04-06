'use client';

import { motion } from 'framer-motion';

export default function PageLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80">
      <motion.div
        className="h-16 w-16 rounded-full border-4 border-neutral-200 border-t-neutral-800"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
} 