import { 
  Gem, 
  Wrench, 
  Eye, 
  Shield, 
  Truck, 
  Clock, 
  Heart, 
  Sparkles,
  Award,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ZoomIn
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef } from "react";

const services = [
  {
    icon: Gem,
    title: "Custom Jewelry Design",
    description: "Create your own unique piece with our expert designers.",
    features: [
      "One-on-one design consultation",
      "3D rendering of your design",
      "Choice of materials and gemstones",
      "Multiple revisions until perfect"
    ],
    badge: "Most Popular",
    color: "from-yellow-500/20 to-amber-500/10",
    accent: "text-yellow-600"
  },
  {
    icon: Wrench,
    title: "Repair & Restoration",
    description: "Restore your precious jewelry to its original glory.",
    features: [
      "Ring resizing",
      "Stone replacement",
      "Polishing and cleaning",
      "Antique restoration"
    ],
    badge: "Expert Service",
    color: "from-amber-500/20 to-orange-500/10",
    accent: "text-amber-600"
  },
  {
    icon: Eye,
    title: "Jewelry Appraisal",
    description: "Professional valuation for insurance and sale.",
    features: [
      "Certified gemologist assessment",
      "Detailed appraisal report",
      "Insurance documentation",
      "Market value analysis"
    ],
    badge: "Certified",
    color: "from-amber-600/20 to-yellow-500/10",
    accent: "text-amber-700"
  },
  {
    icon: Heart,
    title: "Engagement Ring Consultation",
    description: "Find the perfect ring for your special moment.",
    features: [
      "Budget planning",
      "Style assessment",
      "Diamond education",
      "Ring sizing"
    ],
    badge: "Romantic",
    color: "from-rose-500/20 to-pink-500/10",
    accent: "text-rose-600"
  },
  {
    icon: Clock,
    title: "Express Service",
    description: "Quick turnaround for urgent jewelry needs.",
    features: [
      "Same-day cleaning",
      "24-hour ring resizing",
      "Emergency repairs",
      "Express shipping"
    ],
    badge: "Fast",
    color: "from-yellow-400/20 to-amber-400/10",
    accent: "text-yellow-500"
  },
  {
    icon: Sparkles,
    title: "Cleaning & Maintenance",
    description: "Keep your jewelry looking brand new.",
    features: [
      "Ultrasonic cleaning",
      "Steam cleaning",
      "Professional polishing",
      "Inspection service"
    ],
    badge: "Essential",
    color: "from-amber-400/20 to-yellow-400/10",
    accent: "text-amber-500"
  }
];

const guarantees = [
  {
    icon: Shield,
    title: "Lifetime Warranty",
    description: "All our jewelry comes with a lifetime craftsmanship warranty."
  },
  {
    icon: Truck,
    title: "Free Shipping & Returns",
    description: "Enjoy free shipping nationwide and 30-day returns."
  },
  {
    icon: Award,
    title: "Certified Quality",
    description: "Every piece is certified for quality and authenticity."
  },
  {
    icon: CheckCircle,
    title: "100% Satisfaction",
    description: "We guarantee your satisfaction with every purchase."
  }
];

export default function Services() {
  const [activeService, setActiveService] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Auto-rotate services
  useEffect(() => {
    if (!mounted) return;
    
    const interval = setInterval(() => {
      setActiveService((prev) => (prev + 1) % services.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [mounted]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Simplified styles without Google Fonts dependency
  const styles = `
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    
    @keyframes gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes popIn {
      0% { opacity: 0; transform: scale(0.9); }
      100% { opacity: 1; transform: scale(1); }
    }
    
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
  `;

  return (
    <div className="min-h-screen py-12 bg-gradient-to-b from-amber-50/20 to-white dark:from-gray-900 dark:to-gray-950">
      <style>{styles}</style>
      
      <div className="container mx-auto px-4 md:px-6">
        {/* Hero Section */}
        <div className="text-center mb-16 relative py-8">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-100/10 to-transparent dark:via-amber-900/5"></div>
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 relative">
            <span className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent" style={{
              backgroundSize: '200% 200%',
              animation: 'gradient 3s ease infinite'
            }}>
              Our Services
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto relative mb-8" style={{
            animation: 'fadeIn 0.6s ease-out'
          }}>
            Beyond beautiful jewelry, we offer exceptional services to care for your precious pieces 
            and create custom designs that tell your unique story.
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <Button 
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 transition-all duration-300 shadow-lg hover:shadow-amber-200/50 h-12 px-8 text-white font-semibold"
              asChild
            >
              <Link href="/contact">
                <Sparkles className="h-5 w-5 mr-2" />
                <span className="text-base">Book Service</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Services Grid */}
        <div className="mb-20 relative">
          <div className="flex justify-between items-center mb-8 px-2">
            <h2 className="font-serif text-3xl font-bold text-gray-900 dark:text-white">
              Premium Services
            </h2>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="border-amber-200 hover:bg-amber-50 hover:scale-110 transition-transform duration-200"
                onClick={scrollLeft}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="border-amber-200 hover:bg-amber-50 hover:scale-110 transition-transform duration-200"
                onClick={scrollRight}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-6 pb-8 scrollbar-hide snap-x snap-mandatory scroll-smooth px-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {services.map((service, index) => {
              const Icon = service.icon;
              const isActive = index === activeService;
              
              return (
                <div 
                  key={index}
                  className="min-w-[85vw] sm:min-w-[400px] md:min-w-[450px] lg:min-w-[500px] flex-shrink-0 snap-center"
                  onMouseEnter={() => setActiveService(index)}
                >
                  <Card className="group h-full relative overflow-hidden border-2 hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-200/20 bg-gradient-to-br from-amber-50 to-white dark:from-gray-800 dark:to-gray-900 min-h-[420px]">
                    <CardHeader className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                          <Icon className={`h-6 w-6 ${service.accent}`} />
                        </div>
                        {service.badge && (
                          <Badge 
                            className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white group-hover:from-amber-600 group-hover:to-yellow-600 transition-all duration-300"
                          >
                            {service.badge}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="group-hover:translate-x-2 transition-transform duration-300">
                        <span className={`bg-gradient-to-r from-amber-700 to-yellow-600 bg-clip-text text-transparent ${service.accent} text-xl`}>
                          {service.title}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative pt-4">
                      <p className="text-gray-600 dark:text-gray-300 mb-6 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300 text-base">
                        {service.description}
                      </p>
                      <ul className="space-y-3 mb-6">
                        {service.features.map((feature, idx) => (
                          <li 
                            key={idx} 
                            className="flex items-center gap-3 text-sm group-hover:translate-x-1 transition-transform duration-300"
                            style={{ transitionDelay: `${idx * 50}ms` }}
                          >
                            <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/30 group-hover:scale-125 transition-transform duration-300">
                              <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                      
                      <div className="mt-6 opacity-100 translate-y-0 transition-all duration-500">
                        <Button 
                          size="sm" 
                          className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 transition-all duration-300 h-10 text-white"
                          asChild
                        >
                          <Link href="/contact">
                            Learn More
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
          
          {/* Service indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {services.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveService(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === activeService 
                    ? 'w-8 bg-gradient-to-r from-amber-500 to-yellow-500' 
                    : 'bg-amber-200 hover:bg-amber-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Process Section */}
        <div className="mb-20 px-4">
          <h2 className="font-serif text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            <span className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
              Our Custom Design Process
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {[
              { step: "1", title: "Consultation", desc: "Share your vision with our designers", icon: "💎" },
              { step: "2", title: "Design", desc: "Create 3D renderings of your piece", icon: "✏️" },
              { step: "3", title: "Approval", desc: "Review and finalize the design", icon: "✅" },
              { step: "4", title: "Creation", desc: "Craft your piece with precision", icon: "⚒️" }
            ].map((process, idx) => (
              <div key={idx} className="relative group" style={{
                animation: 'fadeUp 0.6s ease-out',
                animationDelay: `${idx * 100}ms`
              }}>
                <Card className="text-center h-full border-2 border-amber-100 dark:border-amber-900 hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-300 hover:shadow-xl hover:shadow-amber-100/20 min-h-[220px] flex flex-col justify-center">
                  <CardContent className="pt-8 pb-6">
                    <div className="relative inline-block mb-4">
                      <div className="text-4xl font-bold bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
                        {process.step}
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors duration-300">
                      {process.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300">
                      {process.desc}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Guarantees Section */}
        <div className="mb-20 px-4">
          <h2 className="font-serif text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            <span className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
              Our Golden Guarantees
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {guarantees.map((guarantee, idx) => {
              const Icon = guarantee.icon;
              return (
                <div 
                  key={idx} 
                  className="relative group"
                  style={{ 
                    animation: 'fadeUp 0.6s ease-out',
                    animationDelay: `${idx * 100}ms`
                  }}
                >
                  <Card className="text-center h-full relative overflow-hidden border-2 border-amber-100 dark:border-amber-900 hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-300 hover:scale-105 min-h-[280px] flex flex-col justify-center">
                    <CardContent className="pt-8 pb-6 relative">
                      <div className="p-4 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/20 inline-block mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <Icon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors duration-300">
                        {guarantee.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300 px-2">
                        {guarantee.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative group px-4 mb-12">
          <Card className="bg-gradient-to-br from-amber-50 via-yellow-50/30 to-amber-100/20 dark:from-amber-900/20 dark:via-yellow-900/10 dark:to-amber-900/20 border-2 border-amber-200/50 dark:border-amber-800/30 overflow-hidden min-h-[380px] flex items-center justify-center">
            <CardContent className="py-12 text-center relative w-full" style={{
              animation: 'popIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            }}>
              <div className="h-12 w-12 text-amber-400 mx-auto mb-6" style={{
                animation: 'float 3s ease-in-out infinite'
              }}>
                <Sparkles className="h-12 w-12" />
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
                <span className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent" style={{
                  backgroundSize: '200% 200%',
                  animation: 'gradient 3s ease infinite'
                }}>
                  Ready to Create Something Special?
                </span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
                Schedule a consultation with our expert designers or visit our store 
                to experience our services firsthand.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 hover:shadow-2xl hover:shadow-amber-200/50 transition-all duration-300 transform hover:-translate-y-1 gap-2 px-8 h-12 text-white font-semibold"
                  >
                    <Sparkles className="h-5 w-5" />
                    Schedule Consultation
                  </Button>
                </Link>
                <Link href="/shop">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-800 transition-all duration-300 transform hover:-translate-y-1 px-8 h-12 font-semibold dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/20"
                  >
                    <ZoomIn className="h-5 w-5 mr-2" />
                    Browse Collections
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}