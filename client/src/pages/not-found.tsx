import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft, Search } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";

export default function NotFound() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });

  // Parallax effect for background glow
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePosition({ x, y });
      
      // Smooth transition for glow effect
      setGlowPosition(prev => ({
        x: prev.x + (x - prev.x) * 0.1,
        y: prev.y + (y - prev.y) * 0.1
      }));
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Theme-specific colors
  const lightGlow = "rgba(59, 130, 246, 0.08)";
  const darkGlow = "rgba(96, 165, 250, 0.15)";
  const lightOrbColor = "bg-blue-400/10";
  const darkOrbColor = "bg-blue-600/10";
  const lightPurpleOrb = "bg-purple-400/10";
  const darkPurpleOrb = "bg-purple-600/10";
  const lightParticleColor = "bg-blue-400/30";
  const darkParticleColor = "bg-blue-300/20";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-900 relative overflow-hidden transition-colors duration-300">
      {/* Animated background glow */}
      <div 
        className="absolute inset-0 transition-all duration-500"
        style={{
          background: `radial-gradient(circle at ${glowPosition.x}% ${glowPosition.y}%, 
            rgba(59, 130, 246, 0.08) 0%, 
            transparent 50%
          )`
        }}
      />
      
      {/* Background orbs */}
      <div className={`absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse 
        ${lightOrbColor} dark:${darkOrbColor}`} 
      />
      <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse delay-1000 
        ${lightPurpleOrb} dark:${darkPurpleOrb}`} 
      />
      
      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 rounded-full 
              ${lightParticleColor} dark:${darkParticleColor}`}
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s infinite ease-in-out ${i * 0.2}s`,
              transform: `scale(${0.5 + Math.random()})`
            }}
          />
        ))}
      </div>

      {/* Main card */}
      <Card className="w-full max-w-lg mx-4 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 shadow-2xl shadow-blue-500/10 dark:shadow-blue-500/5 hover:shadow-blue-500/20 dark:hover:shadow-blue-500/10 transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group">
        {/* Top accent gradient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-600 dark:via-purple-600 dark:to-pink-600" />
        
        {/* Card glow effect on hover */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-600 dark:to-purple-600 rounded-xl blur opacity-0 group-hover:opacity-20 dark:group-hover:opacity-10 transition duration-500" />
        
        <CardContent className="pt-12 pb-8 px-8 relative z-10">
          {/* Main icon with animation */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-400/20 rounded-full animate-ping" />
              <AlertCircle className="h-24 w-24 text-blue-500 dark:text-blue-400 relative z-10 animate-bounce" />
            </div>
          </div>

          {/* Error number with gradient */}
          <div className="text-center mb-4">
            <div className="text-9xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-500 dark:via-purple-500 dark:to-pink-500 bg-clip-text text-transparent leading-none">
              404
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              Page Not Found
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-300 text-center mb-2">
            Oops! The page you're looking for seems to have wandered off into the digital void.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">
            It might have been moved, deleted, or perhaps it never existed.
          </p>

          {/* Search suggestion */}
          <div className="bg-blue-50/50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/30 rounded-lg p-4 mb-8 animate-pulse">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Search className="h-4 w-4" />
              <span className="text-sm font-medium">Suggestions:</span>
            </div>
            <ul className="mt-2 text-sm text-blue-600 dark:text-blue-300 list-disc pl-5 space-y-1">
              <li>Check the URL for typos</li>
              <li>Use the navigation menu to find your way</li>
              <li>Return to the homepage and start over</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild
              variant="outline"
              className="border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-300 group/btn"
            >
              <Link href="/" className="flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300">
                <ArrowLeft className="h-4 w-4 group-hover/btn:-translate-x-1 transition-transform" />
                Go Back
              </Link>
            </Button>
            
            <Button 
              asChild
              className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 hover:from-blue-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 group/btn"
            >
              <Link href="/" className="flex items-center justify-center gap-2">
                <Home className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                Return Home
              </Link>
            </Button>
          </div>

          {/* Footer note */}
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              If you believe this is an error, please{" "}
              <Link 
                href="/contact" 
                className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 underline transition-colors"
              >
                contact support
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Style for floating animation */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) scale(${0.5 + Math.random()});
          }
          50% {
            transform: translateY(-20px) scale(${0.5 + Math.random()});
          }
        }
        
        /* Dynamic background glow based on theme */
        @media (prefers-color-scheme: dark) {
          .dark-radial-glow {
            background: radial-gradient(circle at ${glowPosition.x}% ${glowPosition.y}%, rgba(96, 165, 250, 0.15) 0%, transparent 50%);
          }
        }
        
        .radial-glow {
          background: radial-gradient(circle at ${glowPosition.x}% ${glowPosition.y}%, rgba(59, 130, 246, 0.08) 0%, transparent 50%);
        }
      `}</style>
    </div>
  );
}