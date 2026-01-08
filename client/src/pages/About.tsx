import { 
  Award, 
  Users, 
  Gem, 
  Heart, 
  Sparkles, 
  Shield,
  Clock,
  TrendingUp,
  Star,
  ChevronLeft,
  ChevronRight,
  Zap,
  Target,
  Globe
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge"; // Added missing import
import { useState, useEffect, useRef } from "react";

const values = [
  {
    icon: Gem,
    title: "Excellence in Craftsmanship",
    description: "Every piece is handcrafted with precision and attention to detail by our master jewelers.",
    color: "from-amber-500/20 to-yellow-500/10"
  },
  {
    icon: Heart,
    title: "Passion for Beauty",
    description: "We believe jewelry should capture emotion and tell a unique story.",
    color: "from-rose-500/20 to-pink-500/10"
  },
  {
    icon: Shield,
    title: "Ethical Sourcing",
    description: "All our materials are ethically sourced and conflict-free.",
    color: "from-emerald-500/20 to-green-500/10"
  },
  {
    icon: Users,
    title: "Customer First",
    description: "Your satisfaction is our top priority, from design to aftercare.",
    color: "from-blue-500/20 to-cyan-500/10"
  },
  {
    icon: Target,
    title: "Innovation",
    description: "Constantly pushing boundaries in design and technique.",
    color: "from-purple-500/20 to-violet-500/10"
  },
  {
    icon: Globe,
    title: "Global Craftsmanship",
    description: "Bringing together techniques from around the world.",
    color: "from-indigo-500/20 to-blue-500/10"
  }
];

const milestones = [
  { 
    year: "2026", 
    event: "Launched International Shipping",
    icon: "🌍",
    color: "from-blue-500 to-cyan-500"
  },
  { 
    year: "2025", 
    event: "Celebrated 10,000+ happy customers",
    icon: "🎉",
    color: "from-emerald-500 to-green-500"
  },
  { 
    year: "2024", 
    event: "Awarded Kenya's Best Jewelry Store",
    icon: "🏆",
    color: "from-amber-500 to-yellow-500"
  },
  { 
    year: "2023", 
    event: "Opened First Flagship Store",
    icon: "🏪",
    color: "from-purple-500 to-pink-500"
  }
];

const team = [
  {
    name: "Faith Diligence",
    role: "Lead Designer",
    image: "",
    bio: "2+ years in jewelry design, specialized in engagement rings",
    color: "from-amber-500/20 to-yellow-500/10"
  },
  {
    name: "James Ngovi",
    role: "Master Jeweler",
    image: "",
    bio: "Expert in antique restoration and custom creations",
    color: "from-emerald-500/20 to-green-500/10"
  },
  {
    name: "Lydia Jerotich",
    role: "Gemologist",
    image: "",
    bio: "Certified gemologist with expertise in rare stones",
    color: "from-blue-500/20 to-cyan-500/10"
  },
  {
    name: "Logan Ouko",
    role: "Customer Experience",
    image: "",
    bio: "Ensuring every customer feels special and valued",
    color: "from-rose-500/20 to-pink-500/10"
  },
  {
    name: "Gifted Maurice",
    role: "Technical Operations",
    image: "https://gitcdn.giftedtech.co.ke/image/AZO_image.jpg",
    bio: "Ensuring all our operations and sales runs smoothly and without disruptions",
    color: "from-purple-500/20 to-violet-500/10"
  }
];

// Animation styles
const fadeIn = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fadeIn 0.8s ease-out forwards;
  }
`;

const fadeUp = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-up {
    animation: fadeUp 0.6s ease-out forwards;
  }
`;

const zoomIn = `
  @keyframes zoomIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-zoom-in {
    animation: zoomIn 0.5s ease-out forwards;
  }
`;

const swipeLeft = `
  @keyframes swipeLeft {
    from { opacity: 0; transform: translateX(-30px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .animate-swipe-left {
    animation: swipeLeft 0.5s ease-out forwards;
  }
`;

const swipeRight = `
  @keyframes swipeRight {
    from { opacity: 0; transform: translateX(30px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .animate-swipe-right {
    animation: swipeRight 0.5s ease-out forwards;
  }
`;

const gradient = `
  @keyframes gradient {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  .animate-gradient {
    background-size: 200% 200%;
    animation: gradient 3s ease infinite;
  }
`;

const float = `
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
`;

export default function About() {
  const [activeMilestone, setActiveMilestone] = useState(0);
  const [activeValueIndex, setActiveValueIndex] = useState(0);
  const [activeTeamIndex, setActiveTeamIndex] = useState(0);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right'>('right');
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);

  // Auto-scroll milestones
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMilestone((prev) => (prev + 1) % milestones.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const scrollSection = (sectionRef: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (sectionRef.current) {
      const scrollAmount = 320;
      sectionRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const navigateValues = (direction: 'left' | 'right') => {
    setAnimationDirection(direction);
    const newIndex = direction === 'right' 
      ? (activeValueIndex + 1) % values.length 
      : (activeValueIndex - 1 + values.length) % values.length;
    setActiveValueIndex(newIndex);
    scrollSection(valuesRef, direction);
  };

  const navigateTeam = (direction: 'left' | 'right') => {
    setAnimationDirection(direction);
    const newIndex = direction === 'right' 
      ? (activeTeamIndex + 1) % team.length 
      : (activeTeamIndex - 1 + team.length) % team.length;
    setActiveTeamIndex(newIndex);
    scrollSection(teamRef, direction);
  };

  // Inject animation styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `${fadeIn} ${fadeUp} ${zoomIn} ${swipeLeft} ${swipeRight} ${gradient} ${float}`;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="min-h-screen py-8 bg-gradient-to-b from-amber-50/20 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 md:px-6">
        {/* Hero Section with Animation */}
        <div className="text-center mb-16 relative animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-100/10 to-transparent dark:via-amber-900/5 animate-pulse"></div>
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-foreground mb-6 relative">
            <span className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent animate-gradient">
              Our Story
            </span>
          </h1>
          <p className="text-lg text-muted-foreground dark:text-gray-300 max-w-3xl mx-auto relative">
            For over a decade, Jewel Haven has been creating exquisite jewelry that 
            captures moments, celebrates love, and expresses individuality. 
            We're more than jewelers — we're storytellers.
          </p>
        </div>

        {/* Enhanced Mission Statement */}
        <Card className="
          bg-gradient-to-br from-amber-50/50 via-yellow-50/30 to-amber-100/20 
          dark:from-amber-900/20 dark:via-yellow-900/10 dark:to-amber-900/20
          border-2 border-amber-200/50 dark:border-amber-800/30
          mb-16 overflow-hidden group animate-zoom-in
        ">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-amber-400/20 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-yellow-400/20 to-transparent rounded-full blur-3xl"></div>
          </div>
          
          <CardContent className="py-16 text-center relative">
            <div className="flex justify-center mb-6">
              <div className="
                p-4 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 
                dark:from-amber-900/30 dark:to-yellow-900/20
                group-hover:scale-110 group-hover:rotate-6
                transition-all duration-500 shadow-lg
              ">
                <Sparkles className="h-12 w-12 text-amber-600 dark:text-amber-400 animate-float" />
              </div>
            </div>
            <h2 className="font-serif text-4xl font-bold mb-6">
              <span className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent animate-gradient">
                Our Mission
              </span>
            </h2>
            <p className="text-xl text-foreground/80 dark:text-gray-200 max-w-2xl mx-auto">
              To create timeless jewelry that inspires confidence, celebrates milestones, 
              and becomes cherished heirlooms for generations to come.
            </p>
          </CardContent>
        </Card>

        {/* Enhanced Values with Carousel */}
        <div className="mb-20">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-serif text-4xl font-bold">
              <span className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
                Our Golden Values
              </span>
            </h2>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="border-amber-200 hover:bg-amber-50 hover:scale-110 transition-transform duration-200 dark:border-amber-800 dark:hover:bg-amber-900/20"
                onClick={() => navigateValues('left')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="border-amber-200 hover:bg-amber-50 hover:scale-110 transition-transform duration-200 dark:border-amber-800 dark:hover:bg-amber-900/20"
                onClick={() => navigateValues('right')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div 
            ref={valuesRef}
            className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide snap-x snap-mandatory scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {values.map((value, idx) => {
              const Icon = value.icon;
              const isActive = idx === activeValueIndex;
              return (
                <div 
                  key={idx}
                  className="min-w-[300px] snap-center"
                  onMouseEnter={() => setActiveValueIndex(idx)}
                >
                  <Card className={`
                    h-full relative overflow-hidden 
                    border-2 ${isActive ? 'border-amber-400 ring-2 ring-amber-400/50 ring-offset-2 dark:ring-amber-600/30' : 'border-amber-200 dark:border-amber-800'}
                    transition-all duration-300 hover:scale-105 hover:shadow-xl
                    bg-gradient-to-br ${value.color} dark:${value.color.replace('500', '700')}
                    animate-${animationDirection === 'right' ? 'swipe-left' : 'swipe-right'}
                  `}>
                    <CardContent className="pt-8 pb-6 text-center relative">
                      <div className="
                        p-4 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 
                        dark:from-amber-900/30 dark:to-yellow-900/20
                        inline-block mb-4 group-hover:scale-110 
                        transition-transform duration-300 shadow-lg mx-auto
                      ">
                        <Icon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h3 className="font-semibold text-lg mb-3 text-gray-800 dark:text-gray-200">
                        {value.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-center gap-2 mt-6">
            {values.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveValueIndex(idx)}
                className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${idx === activeValueIndex 
                    ? 'w-8 bg-gradient-to-r from-amber-500 to-yellow-500' 
                    : 'bg-amber-200 hover:bg-amber-300 dark:bg-amber-800 dark:hover:bg-amber-700'
                  }
                `}
              />
            ))}
          </div>
        </div>

        {/* Enhanced Timeline */}
        <div className="mb-20">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-serif text-4xl font-bold">
              <span className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
                Our Journey
              </span>
            </h2>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="border-amber-200 hover:bg-amber-50 hover:scale-110 transition-transform duration-200 dark:border-amber-800 dark:hover:bg-amber-900/20"
                onClick={() => scrollSection(timelineRef, 'left')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="border-amber-200 hover:bg-amber-50 hover:scale-110 transition-transform duration-200 dark:border-amber-800 dark:hover:bg-amber-900/20"
                onClick={() => scrollSection(timelineRef, 'right')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div 
            ref={timelineRef}
            className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide snap-x snap-mandatory scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {milestones.map((milestone, idx) => {
              const isActive = idx === activeMilestone;
              return (
                <div 
                  key={idx}
                  className="min-w-[300px] snap-center"
                  onMouseEnter={() => setActiveMilestone(idx)}
                >
                  <Card className={`
                    h-full relative overflow-hidden 
                    border-2 ${isActive ? 'border-amber-400 ring-2 ring-amber-400/50 ring-offset-2 dark:ring-amber-600/30' : 'border-amber-200 dark:border-amber-800'}
                    transition-all duration-300 hover:scale-105 hover:shadow-xl
                    bg-gradient-to-br ${milestone.color}/10 dark:${milestone.color.replace('500', '700')}/20
                  `}>
                    <div className="absolute top-0 right-0 p-2 text-3xl opacity-20">
                      {milestone.icon}
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`
                          p-3 rounded-full bg-gradient-to-br ${milestone.color}
                          shadow-lg transform group-hover:scale-110 transition-transform duration-300
                        `}>
                          <Award className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-bold text-2xl bg-gradient-to-br ${milestone.color} bg-clip-text text-transparent dark:text-white">
                          {milestone.year}
                        </h3>
                      </div>
                      <p className="text-lg font-medium text-gray-800 dark:text-gray-200">{milestone.event}</p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-center gap-2 mt-6">
            {milestones.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveMilestone(idx)}
                className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${idx === activeMilestone 
                    ? 'w-8 bg-gradient-to-r from-amber-500 to-yellow-500' 
                    : 'bg-amber-200 hover:bg-amber-300 dark:bg-amber-800 dark:hover:bg-amber-700'
                  }
                `}
              />
            ))}
          </div>
        </div>

        {/* Enhanced Team Section with Carousel */}
        <div className="mb-20">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-serif text-4xl font-bold">
              <span className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
                Meet Our Experts
              </span>
            </h2>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="border-amber-200 hover:bg-amber-50 hover:scale-110 transition-transform duration-200 dark:border-amber-800 dark:hover:bg-amber-900/20"
                onClick={() => navigateTeam('left')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="border-amber-200 hover:bg-amber-50 hover:scale-110 transition-transform duration-200 dark:border-amber-800 dark:hover:bg-amber-900/20"
                onClick={() => navigateTeam('right')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div 
            ref={teamRef}
            className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide snap-x snap-mandatory scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {team.map((member, idx) => {
              const isActive = idx === activeTeamIndex;
              return (
                <div 
                  key={idx}
                  className="min-w-[280px] snap-center"
                  onMouseEnter={() => setActiveTeamIndex(idx)}
                >
                  <Card className={`
                    h-full relative overflow-hidden text-center
                    border-2 ${isActive ? 'border-amber-400 ring-2 ring-amber-400/50 ring-offset-2 dark:ring-amber-600/30' : 'border-amber-200 dark:border-amber-800'}
                    transition-all duration-300 hover:scale-105 hover:shadow-xl
                    bg-gradient-to-br ${member.color} dark:${member.color.replace('500', '700')}
                    animate-${animationDirection === 'right' ? 'swipe-left' : 'swipe-right'}
                  `}>
                    <CardContent className="pt-8 pb-6 relative">
                      <div className="relative inline-block mb-4">
                        <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-800 shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <AvatarImage src={member.image} />
                          <AvatarFallback className="
                            bg-gradient-to-br from-amber-100 to-yellow-100 
                            dark:from-amber-900/30 dark:to-yellow-900/20
                            text-amber-700 dark:text-amber-400
                          ">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="
                          absolute -top-2 -right-2 w-10 h-10 rounded-full 
                          bg-gradient-to-br from-amber-500 to-yellow-500 
                          flex items-center justify-center text-white text-lg
                          opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-100
                          transition-all duration-300 shadow-lg
                        ">
                          <Target className="h-5 w-5" />
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-lg mb-1 text-gray-800 dark:text-gray-200">
                        {member.name}
                      </h3>
                      <Badge className="
                        mb-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white
                        hover:from-amber-600 hover:to-yellow-600
                        transition-all duration-300
                      ">
                        {member.role}
                      </Badge>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {member.bio}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-center gap-2 mt-6">
            {team.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTeamIndex(idx)}
                className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${idx === activeTeamIndex 
                    ? 'w-8 bg-gradient-to-r from-amber-500 to-yellow-500' 
                    : 'bg-amber-200 hover:bg-amber-300 dark:bg-amber-800 dark:hover:bg-amber-700'
                  }
                `}
              />
            ))}
          </div>
        </div>

        {/* Enhanced Stats - Fixed dark text visibility */}
        <div className="mb-20 animate-fade-up">
          <Card className="
            bg-gradient-to-br from-amber-50/50 via-yellow-50/30 to-amber-100/20 
            dark:from-gray-800 dark:via-gray-800/80 dark:to-gray-900
            border-2 border-amber-200/50 dark:border-amber-800/30
            overflow-hidden
          ">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-amber-400/20 to-transparent rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-yellow-400/20 to-transparent rounded-full blur-3xl"></div>
            </div>
            
            <CardContent className="py-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { icon: Clock, value: "2+", label: "Years of Excellence", color: "from-amber-500 to-yellow-500" },
                  { icon: Users, value: "5K+", label: "Happy Customers", color: "from-emerald-500 to-green-500" },
                  { icon: Star, value: "4.9", label: "Average Rating", color: "from-blue-500 to-cyan-500" },
                  { icon: TrendingUp, value: "98%", label: "Satisfaction Rate", color: "from-purple-500 to-pink-500" }
                ].map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div key={idx} className="text-center group">
                      <div className="relative inline-block mb-4">
                        <div className={`
                          p-4 rounded-full bg-gradient-to-br ${stat.color} 
                          shadow-lg group-hover:scale-110 group-hover:rotate-6
                          transition-all duration-500
                        `}>
                          <Icon className="h-8 w-8 text-white" />
                        </div>
                        <div className={`
                          absolute -inset-2 rounded-full bg-gradient-to-br ${stat.color}/20 
                          opacity-0 group-hover:opacity-100 blur-lg
                          transition-opacity duration-500
                        `}></div>
                      </div>
                      <div className={`
                        text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-br ${stat.color} 
                        bg-clip-text text-transparent group-hover:scale-105
                        transition-transform duration-300 dark:text-white
                      `}>
                        {stat.value}
                      </div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300">
                        {stat.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced CTA Section */}
        <div className="relative group animate-fade-in">
          <Card className="
            bg-gradient-to-br from-amber-50/50 via-yellow-50/30 to-amber-100/20 
            dark:from-gray-800 dark:via-gray-800/80 dark:to-gray-900
            border-2 border-amber-200/50 dark:border-amber-800/30
            overflow-hidden
          ">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-amber-400/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-yellow-400/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
            
            <CardContent className="py-16 text-center relative">
              <div className="p-4 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/20 inline-block mb-6">
                <Globe className="h-12 w-12 text-amber-600 dark:text-amber-400 animate-float" />
              </div>
              <h2 className="font-serif text-4xl font-bold mb-6">
                <span className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent animate-gradient">
                  Experience Jewel Haven
                </span>
              </h2>
              <p className="text-xl text-gray-700 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
                Visit our store or browse our collections to discover jewelry that speaks to you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/shop">
                  <Button 
                    size="lg" 
                    className="
                      bg-gradient-to-r from-amber-500 to-yellow-500 
                      hover:from-amber-600 hover:to-yellow-600
                      hover:shadow-2xl hover:shadow-amber-200/50 dark:hover:shadow-amber-700/30
                      transition-all duration-300 transform hover:-translate-y-1
                      px-8 gap-2
                    "
                  >
                    <Gem className="h-5 w-5" />
                    Browse Collections
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="
                      border-amber-300 text-amber-700 hover:bg-amber-50 
                      hover:border-amber-400 hover:text-amber-800
                      dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20
                      dark:hover:border-amber-600 dark:hover:text-amber-200
                      transition-all duration-300 transform hover:-translate-y-1
                      px-8 gap-2
                    "
                  >
                    <Zap className="h-5 w-5" />
                    Visit Our Store
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