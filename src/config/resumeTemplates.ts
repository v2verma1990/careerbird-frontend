/**
 * Centralized Resume Template Configuration
 * Single source of truth for all resume templates
 */

export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
  color: string;
  isPremium?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  isRecommended?: boolean;
  availableColors?: string[];
}

export const RESUME_TEMPLATES: Template[] = [
  {
    id: "navy-column-modern",
    name: "Navy Column Modern",
    description: "Professional layout with navy sidebar and clean white content area",
    thumbnail: "/lovable-uploads/navy-column-modern.PNG",
    category: "professional",
    color: "navy",
    availableColors: ["#a4814c", "#18bc6b", "#2196F3", "#ff1e1e", "#000","#0D2844"],
    isRecommended: true,
    isNew: true
  },
  {
    id: "modern-executive",
    name: "Modern Executive",
    description: "Clean, professional design perfect for executives",
    thumbnail: "/lovable-uploads/modern-executive.PNG",
    category: "professional",
    color: "blue",
    availableColors: ["#18bc6b", "#2196F3", "#ff1e1e", "#000", "#a4814c"],
    isPopular: true,
    isRecommended: true
  },
  {
    id: "creative-designer",
    name: "Creative Designer",
    description: "Bold, creative layout for designers",
    thumbnail: "/lovable-uploads/creative-designer.PNG",
    category: "creative",
    color: "purple",
    availableColors: ["#2196F3", "#ff1e1e", "#000", "#18bc6b", "#a4814c"],
    isPremium: true
  },
  {
    id: "tech-minimalist",
    name: "Tech Minimalist",
    description: "Clean, minimal design for tech professionals",
    thumbnail: "/lovable-uploads/tech-minimalist.PNG",
    category: "tech",
    color: "green",
    isNew: true,
    availableColors: ["#18bc6b", "#2196F3", "#000", "#a4814c", "#ff1e1e"]
  },
  {
    id: "academic-scholar",
    name: "Academic Scholar",
    description: "Traditional format for researchers",
    thumbnail: "/resume-templates/thumbnails/academic.PNG",
    category: "academic",
    color: "gray",
    isRecommended: true,
    availableColors: ["#a4814c", "#2196F3", "#18bc6b", "#ff1e1e", "#000"]
  },
  {
    id: "startup-founder",
    name: "Startup Founder",
    description: "Dynamic layout for entrepreneurs",
    thumbnail: "/resume-templates/thumbnails/professional.png",
    category: "professional",
    color: "orange",
    isPremium: true,
    availableColors: ["#ff1e1e", "#18bc6b", "#2196F3", "#000", "#a4814c"]
  },
  {
    id: "fresh-graduate",
    name: "Fresh Graduate",
    description: "Perfect for new graduates and entry-level positions",
    thumbnail: "/resume-templates/thumbnails/entry-level.PNG",
    category: "entry-level",
    color: "teal",
    isPopular: true,
    isRecommended: true,
    availableColors: ["#2196F3", "#18bc6b", "#ff1e1e", "#000", "#a4814c"]
  },
  {
    id: "grey-classic-profile",
    name: "Grey Classic Profile",
    description: "Elegant and clear template with sidebar and modern layout",
    thumbnail: "/lovable-uploads/2d518c3a-cd43-4fb4-b391-8729c98e1479.png",
    category: "classic",
    color: "gray",
    isRecommended: false,
    isNew: true,
    availableColors: ["#000", "#2196F3", "#18bc6b", "#ff1e1e", "#a4814c"]
  },
  {
    id: "blue-sidebar-profile",
    name: "Blue Sidebar Profile",
    description: "Elegant template with left sidebar and section dividers, matching classic professional format.",
    thumbnail: "/lovable-uploads/502adb7a-83b3-4ebe-a1c2-6450915f1ed0.png",
    category: "classic",
    color: "blue",
    isNew: true,
    availableColors: ["#2196F3", "#18bc6b", "#ff1e1e", "#000", "#a4814c"]
  },
  {
    id: "green-sidebar-receptionist",
    name: "Green Sidebar Receptionist",
    description: "Fresh and approachable sidebar template matching receptionist roles",
    thumbnail: "/lovable-uploads/e72aeeac-84f9-493e-85af-c1994a03dc55.png",
    category: "classic",
    color: "green",
    isNew: true,
    availableColors: ["#18bc6b", "#2196F3", "#ff1e1e", "#000", "#a4814c"]
  },
  {
    id: "classic-profile-orange",
    name: "Classic Profile Orange",
    description: "Elegant resume with orange name, clean sidebar and modern readable content.",
    thumbnail: "/lovable-uploads/aefc4f9a-f33d-406b-a191-f7aae767471d.png",
    category: "classic",
    color: "orange",
    isNew: true,
    availableColors: ["#a4814c", "#18bc6b", "#2196F3", "#ff1e1e", "#000"]
  },
  {
    id: "classic-law-bw",
    name: "Classic Law Black & White",
    description: "Traditional black & white legal resume with section dividers and simple typographic elegance.",
    thumbnail: "/lovable-uploads/411cd4d2-9f96-4fa4-abaf-60b6828225fb.png",
    category: "classic",
    color: "gray",
    isNew: true,
    availableColors: ["#000", "#a4814c", "#18bc6b", "#2196F3", "#ff1e1e"]
  },
  {
    id: "green-sidebar-customer-service",
    name: "Green Sidebar Customer Service",
    description: "Modern customer service resume with a green sidebar and clean layout",
    thumbnail: "/lovable-uploads/4fcd8e16-5fb8-46bf-876e-def35b427c45.png",
    category: "classic",
    color: "green",
    isNew: true,
    availableColors: ["#18bc6b", "#2196F3", "#ff1e1e", "#000", "#a4814c"]
  }
];

export const getAllTemplates = () => RESUME_TEMPLATES;