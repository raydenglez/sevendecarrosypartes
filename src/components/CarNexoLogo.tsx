import { motion, type Variants } from "framer-motion";

interface CarNexoLogoProps {
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  animate?: boolean;
  className?: string;
}

const CarNexoLogo = ({ 
  size = "md", 
  showIcon = true, 
  animate = true,
  className = "" 
}: CarNexoLogoProps) => {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl"
  };

  const iconSizes = {
    sm: { width: 28, height: 20 },
    md: { width: 36, height: 26 },
    lg: { width: 52, height: 38 }
  };

  const iconSize = iconSizes[size];

  const carVariants: Variants = {
    initial: { x: -5 },
    animate: {
      x: [0, 2, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  };

  const wheelVariants: Variants = {
    initial: { rotate: 0 },
    animate: {
      rotate: 360,
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "linear" as const
      }
    }
  };

  const glowVariants: Variants = {
    initial: { opacity: 0.5 },
    animate: {
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  };

  const textVariants: Variants = {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.05
      }
    }
  };

  const letterVariants: Variants = {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && (
        <motion.div
          className="relative"
          variants={animate ? carVariants : undefined}
          initial="initial"
          animate={animate ? "animate" : "initial"}
        >
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 blur-md bg-primary/40 rounded-full"
            variants={animate ? glowVariants : undefined}
            initial="initial"
            animate={animate ? "animate" : "initial"}
          />
          
          {/* Car SVG Icon */}
          <svg
            width={iconSize.width}
            height={iconSize.height}
            viewBox="0 0 52 38"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative z-10"
          >
            {/* Car body */}
            <motion.path
              d="M8 24H44C46.2091 24 48 22.2091 48 20V18C48 15.7909 46.2091 14 44 14H40L36 6C35.4 4.8 34.1 4 32.7 4H19.3C17.9 4 16.6 4.8 16 6L12 14H8C5.79086 14 4 15.7909 4 18V20C4 22.2091 5.79086 24 8 24Z"
              fill="hsl(var(--primary))"
              initial={{ pathLength: 0 }}
              animate={animate ? { pathLength: 1 } : { pathLength: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            
            {/* Windows */}
            <path
              d="M18 14L21 8H31L34 14H18Z"
              fill="hsl(var(--background))"
              opacity={0.3}
            />
            
            {/* Headlights */}
            <motion.circle
              cx="42"
              cy="18"
              r="2"
              fill="hsl(var(--warning))"
              initial={{ opacity: 0.6 }}
              animate={animate ? { opacity: [0.6, 1, 0.6] } : { opacity: 0.8 }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <motion.circle
              cx="10"
              cy="18"
              r="2"
              fill="hsl(var(--destructive))"
              initial={{ opacity: 0.6 }}
              animate={animate ? { opacity: [0.6, 0.9, 0.6] } : { opacity: 0.8 }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            
            {/* Wheels */}
            <motion.g
              variants={animate ? wheelVariants : undefined}
              initial="initial"
              animate={animate ? "animate" : "initial"}
              style={{ transformOrigin: "14px 28px" }}
            >
              <circle cx="14" cy="28" r="6" fill="hsl(var(--foreground))" />
              <circle cx="14" cy="28" r="3" fill="hsl(var(--muted))" />
              <circle cx="14" cy="28" r="1" fill="hsl(var(--foreground))" />
            </motion.g>
            
            <motion.g
              variants={animate ? wheelVariants : undefined}
              initial="initial"
              animate={animate ? "animate" : "initial"}
              style={{ transformOrigin: "38px 28px" }}
            >
              <circle cx="38" cy="28" r="6" fill="hsl(var(--foreground))" />
              <circle cx="38" cy="28" r="3" fill="hsl(var(--muted))" />
              <circle cx="38" cy="28" r="1" fill="hsl(var(--foreground))" />
            </motion.g>
            
            {/* Speed lines */}
            {animate && (
              <>
                <motion.line
                  x1="0"
                  y1="16"
                  x2="4"
                  y2="16"
                  stroke="hsl(var(--primary))"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  initial={{ opacity: 0, x: 5 }}
                  animate={{ opacity: [0, 0.8, 0], x: [-2, -8, -2] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                />
                <motion.line
                  x1="0"
                  y1="20"
                  x2="6"
                  y2="20"
                  stroke="hsl(var(--primary))"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  initial={{ opacity: 0, x: 5 }}
                  animate={{ opacity: [0, 0.6, 0], x: [-2, -10, -2] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                />
              </>
            )}
          </svg>
        </motion.div>
      )}

      {/* Text Logo */}
      <motion.div
        className={`font-bold tracking-tight ${sizeClasses[size]}`}
        variants={animate ? textVariants : undefined}
        initial="initial"
        animate="animate"
      >
        <motion.span 
          className="text-foreground"
          variants={animate ? letterVariants : undefined}
        >
          Car
        </motion.span>
        <motion.span 
          className="text-primary"
          variants={animate ? letterVariants : undefined}
        >
          Networx
        </motion.span>
      </motion.div>
    </div>
  );
};

export default CarNexoLogo;
