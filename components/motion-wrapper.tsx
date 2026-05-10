"use client";

import { motion, AnimatePresence } from "framer-motion";

interface MotionWrapperProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function MotionWrapper({ children, className, delay = 0 }: MotionWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
