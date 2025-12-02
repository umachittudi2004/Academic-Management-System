import { motion } from 'framer-motion'

export default function MotionFade({ children, y = 8 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  )
}