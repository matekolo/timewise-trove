
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TileProps {
  title?: string;
  subtitle?: string;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
  onClick?: () => void;
  animate?: boolean;
  delay?: number;
}

const Tile = ({
  title,
  subtitle,
  className,
  contentClassName,
  children,
  onClick,
  animate = true,
  delay = 0,
}: TileProps) => {
  const tileVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
        delay: delay * 0.1
      }
    }
  };

  return (
    <motion.div
      className={cn(
        "tile bg-white rounded-xl shadow-sm border border-border/60 overflow-hidden",
        onClick && "cursor-pointer hover:shadow-md transition-all duration-300",
        className
      )}
      onClick={onClick}
      initial={animate ? "hidden" : undefined}
      animate={animate ? "visible" : undefined}
      variants={animate ? tileVariants : undefined}
      whileHover={onClick ? { y: -5 } : undefined}
      transition={{ duration: 0.2 }}
    >
      {(title || subtitle) && (
        <div className="p-4 border-b border-border/50">
          {title && <h3 className="font-medium text-foreground">{title}</h3>}
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className={cn("p-4", contentClassName)}>
        {children}
      </div>
    </motion.div>
  );
};

export default Tile;
