import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import type { UserArtStyle, CustomModel } from '@shared/schema';
import { 
  Send, 
  Download, 
  RefreshCw,
  Languages,
  FileText,
  Settings,
  Copy,
  Image as ImageIcon,
  Loader2,
  Video,
  Zap,
  Save,
  Edit,
  X,
  Sparkles,
  Shuffle,
  Check,
  ChevronsUpDown
} from "lucide-react";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  negativePrompt?: string;
  model: string;
  timestamp: Date;
  width: number;
  height: number;
}

const TextToImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [activeTab, setActiveTab] = useState('image');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);
  const [placeDropdownOpen, setPlaceDropdownOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const createdUrlsRef = useRef<string[]>([]);
  const isGeneratingRef = useRef(false);
  const savingRef = useRef<Set<string>>(new Set());

  // Art styles comprehensive list
  const artStyles = [
    "realistic", "cinematic", "cyberpunk", "anime", "manga", "ghibli", "comic", "impressionist", "pixel art", "abstract", "sketch", "fantasy", "3d render", "watercolor", "oil painting", "pop art", "steampunk", "digital painting", "cartoon", "gothic", "isometric", "sci-fi", "minimalist", "vaporwave", "synthwave", "dystopian", "utopian", "art deco", "art nouveau", "cubist", "surrealist", "futuristic", "retrowave", "neo-expressionist", "street art", "graffiti", "mural", "mosaic", "stained glass", "geometric", "abstract expressionism", "pointillism", "charcoal", "pencil sketch", "ink wash", "line art", "pop surrealism", "low poly", "voxel art", "vector art", "comic book", "cartoon modern", "traditional painting", "concept art", "matte painting", "photo realistic", "hdr photography", "vintage photograph", "blueprint", "schematic", "technical drawing", "infographic", "diagrammatic", "hieroglyphic", "cave painting", "tribal art", "african art", "asian art", "western art", "mythological", "horror", "gore", "macabre", "dark fantasy", "sci-fi horror", "post-apocalyptic", "urbex photography", "wildlife photography", "landscape photography", "portraiture", "still life", "botanical illustration", "zoological illustration", "anatomical drawing", "architectural sketch", "cityscape", "seascape", "space art", "astrophotography", "underwater art", "macro photography", "microscopic art", "infrared art", "light painting", "smoke art", "sand art", "watercolour sketch", "acrylic painting", "gouache", "pastel", "fauvism", "expressionism", "suprematism", "constructivism", "dadaism", "minimalism", "op art", "kinetic art", "photorealism", "hyperrealism", "romanticism", "baroque", "rococo", "neoclassicism", "pre-raphaelite", "symbolism", "divisionism", "luminism", "tonalism", "hudson river school", "ashcan school", "precisionism", "regionalism", "social realism", "magic realism", "fantastic realism", "naive art", "outsider art", "folk art", "self-taught art", "graffito", "body art", "land art", "environmental art", "performance art", "video art", "sound art", "bio art", "light art", "textile art", "glass art", "ceramic art", "jewelry design", "fashion illustration", "industrial design", "automotive art", "architectural visualization", "scientific illustration", "medical illustration", "forensic art", "color manga", "color sketch", "logo", "icon", "ads", "cyberpunk watercolor", "anime gothic", "pixel noir", "steampunk fantasy", "retro futurism", "sci-fi impressionism", "minimalist dystopian", "vaporwave botanical", "graffiti pop art", "mythological surrealism", "glitch art", "fractal art", "ai collage", "neon holographic", "augmented reality style", "liquid chrome", "synth organic", "bioluminescent art", "data visualization art", "dreamcore", "weirdcore", "celestial fantasy", "underwater cyberpunk", "dark fairytale", "post-apocalyptic nature", "interdimensional travel", "time-shifted art", "ethereal portraits", "frozen wasteland", "solar punk", "parallel universe art", "cyberpunk origami", "glass neon", "digital stained glass", "astral geometry", "chromatic smoke art", "dreamy pastel noir", "cyber samurai", "floating island fantasy", "frozen neon", "underwater steampunk", "shattered reality", "celestial watercolor", "paper cutout 3d", "neon tribal", "glass forest", "liquid metal", "mechanical nature", "holographic portraits", "luminous ink wash", "dark academia", "techno graffiti", "zero gravity cities", "fire & ice duality", "dreams in glass", "cosmic mosaic", "biomechanical horror", "cyberpunk jungle", "time fracture art", "rainbow mist", "ghost light", "fractal forest", "golden hour fantasy", "underwater cosmos", "tech bloom", "ancient tech ruins", "arcane circuits", "neon rain", "infinite spiral worlds", "shadow light contrast", "electric ice sculptures", "mythic bioluminescence", "paint splash universe", "shimmering desert", "firefly nights", "wired dreams", "ocean punk", "ai surrealism", "blood moon fantasy", "steam & stars", "ethereal silk art", "light beam architecture", "glass ocean", "rainbow circuitry", "toxic beauty", "shadow puppet art", "neon sandstorm", "crystal punk", "mirror world", "paint drip surrealism", "prismatic shadows", "stormlight fantasy", "electric aurora", "techno mythos", "molten core art", "lunar glass cities", "chromatic steampunk", "floating lantern realms", "laser horizon", "frozen galaxy", "quantum dreams", "eclipse realism", "bio-steel creatures", "woven light art", "retro arcade pixelism", "fogpunk", "prism rain", "cyber desert mirage", "blood crystal landscapes", "lava flow cities", "sky tunnels", "neon coral reef", "shattered moon", "starfall skies", "silver mist realism", "deep sea mecha", "aurora gothic", "cosmic origami", "jungle mech fusion", "electric feathered beasts", "hologram graffiti", "toxic jungle", "bioluminescent desert", "infinite mirror maze", "steamstorm skies", "pixel noir fantasy", "shattered light art", "solar flare city", "mecha samurai dreams", "icebound neon forest", "time loop art", "glass volcano", "mechanical butterfly garden", "asteroid colony realism", "shadow neon fusion", "blood rain dystopia", "luminous cave worlds", "neon storm ocean", "cloudpunk", "dragonpunk", "glitchpunk", "discpretion"
  ];

  // Places comprehensive list - curated and optimized (500+ unique places)
  const places = [
    // Natural Landscapes & Geographic Features
    "beach", "mountain", "forest", "desert", "ocean", "lake", "river", "waterfall", "cave", "valley", "hill", "meadow", "field", "island", "volcano", "canyon", "jungle", "rainforest", "savanna", "arctic", "tundra", "glacier", "cliff", "plateau", "gorge", "fjord", "bay", "lagoon", "marsh", "wetland", "swamp", "delta", "oasis", "dunes", "badlands", "mesa", "ridge", "peak", "crater", "geyser", "hot spring", "coral reef", "atoll", "peninsula", "cape", "inlet", "cove", "prairie", "steppe", "moor", "highlands", "lowlands", "headland", "escarpment", "ravine", "brook", "creek", "stream", "rapids", "cascade", "pond", "reservoir",

    // Major World Cities
    "new york", "london", "paris", "tokyo", "beijing", "moscow", "rome", "madrid", "berlin", "athens", "vienna", "prague", "budapest", "amsterdam", "copenhagen", "stockholm", "oslo", "helsinki", "dublin", "edinburgh", "barcelona", "lisbon", "milan", "florence", "venice", "zurich", "brussels", "warsaw", "cairo", "istanbul", "mumbai", "delhi", "bangalore", "bangkok", "singapore", "kuala lumpur", "jakarta", "manila", "seoul", "kyoto", "osaka", "hong kong", "shanghai", "sydney", "melbourne", "toronto", "vancouver", "montreal", "los angeles", "san francisco", "chicago", "boston", "miami", "las vegas", "seattle", "denver", "phoenix", "houston", "atlanta", "philadelphia", "washington dc", "mexico city", "sao paulo", "rio de janeiro", "buenos aires", "lima", "santiago", "bogota", "caracas", "dubai", "karachi", "lahore", "dhaka", "cape town", "johannesburg", "nairobi", "lagos", "marrakech", "casablanca", "jerusalem", "tel aviv", "beirut", "riyadh", "doha", "kuwait city", "tehran", "baghdad", "tashkent", "almaty", "tbilisi", "yerevan", "baku", "minsk", "kiev", "vilnius", "riga", "tallinn", "reykjavik",

    // Famous Landmarks & Monuments  
    "eiffel tower", "big ben", "colosseum", "taj mahal", "great wall of china", "machu picchu", "petra", "christ the redeemer", "chichen itza", "easter island", "stonehenge", "neuschwanstein castle", "sagrada familia", "notre dame", "louvre", "sistine chapel", "vatican", "buckingham palace", "tower of london", "statue of liberty", "empire state building", "golden gate bridge", "brooklyn bridge", "hollywood sign", "mount rushmore", "grand canyon", "yellowstone", "yosemite", "niagara falls", "antelope canyon", "uluru", "sydney opera house", "burj khalifa", "pyramids of giza", "sphinx", "angkor wat", "forbidden city", "kremlin", "red square", "acropolis", "parthenon", "mount olympus", "mount vesuvius", "pompeii", "victoria falls", "serengeti", "kilimanjaro", "everest base camp", "mont blanc", "matterhorn", "santorini", "mykonos", "bali", "phuket", "maldives", "seychelles", "mauritius", "fiji", "tahiti", "bora bora", "banff", "jasper", "grand teton", "zion", "bryce canyon", "arches", "death valley", "joshua tree", "sequoia", "redwood", "crater lake", "mount rainier", "glacier bay", "denali",

    // Architectural & Indoor Spaces
    "cathedral", "basilica", "chapel", "abbey", "monastery", "temple", "pagoda", "mosque", "synagogue", "castle", "palace", "fortress", "manor", "mansion", "villa", "cottage", "cabin", "lighthouse", "windmill", "barn", "greenhouse", "conservatory", "library", "museum", "gallery", "theater", "opera house", "concert hall", "stadium", "arena", "marketplace", "bazaar", "souk", "plaza", "courtyard", "garden", "park", "botanical garden", "zoo", "aquarium", "observatory", "planetarium", "university", "school", "hospital", "hotel", "restaurant", "cafe", "pub", "tavern", "inn", "living room", "bedroom", "kitchen", "dining room", "study", "office", "studio", "workshop", "attic", "basement", "cellar", "garage", "balcony", "terrace", "rooftop", "penthouse", "loft", "apartment", "suite", "lobby", "hallway", "staircase", "elevator", "bathroom", "spa", "sauna", "gym", "pool", "jacuzzi", "ballroom", "boardroom", "conference room", "classroom", "laboratory", "factory", "warehouse", "mall", "store", "boutique",

    // Transportation & Infrastructure
    "airport", "train station", "subway", "bus station", "harbor", "port", "pier", "dock", "marina", "bridge", "tunnel", "highway", "road", "street", "alley", "pathway", "sidewalk", "crossroads", "intersection", "roundabout", "parking lot", "gas station", "rest stop", "toll booth", "border crossing", "checkpoint", "airplane", "train", "subway car", "bus", "taxi", "ferry", "cruise ship", "yacht", "sailboat", "speedboat", "helicopter", "hot air balloon", "cable car", "gondola", "rickshaw", "bicycle", "motorcycle", "car interior", "truck", "rv", "camper van", "treehouse", "houseboat", "caravan", "tent", "igloo", "yurt", "tepee",

    // Fantasy & Fictional Places
    "atlantis", "el dorado", "shangri la", "avalon", "camelot", "valhalla", "asgard", "olympus", "wonderland", "neverland", "oz", "narnia", "middle earth", "shire", "rivendell", "gondor", "mordor", "hogwarts", "diagon alley", "hogsmeade", "winterfell", "kings landing", "dragonstone", "casterly rock", "braavos", "vaes dothrak", "meereen", "oldtown", "the wall", "beyond the wall", "westeros", "essos", "gotham city", "metropolis", "wakanda", "azeroth", "tamriel", "skyrim", "hyrule", "mushroom kingdom", "pandora", "naboo", "tatooine", "coruscant", "endor", "hoth", "dagobah", "mustafar", "kamino", "geonosis", "kashyyyk", "utapau", "mygeeto", "felucia", "cato neimoidia", "ryloth", "mandalore", "alderaan", "bespin", "jakku", "starkiller base", "crait", "exegol", "ahch to", "cantonica", "scarif", "erebor", "lonely mountain", "mirkwood", "fangorn forest", "helms deep", "edoras", "weathertop", "mount doom", "barad dur", "isengard", "minas tirith", "hobbiton", "bree", "lake town", "dale",

    // Sci-Fi & Futuristic Places
    "space station", "orbital platform", "moon base", "mars colony", "asteroid belt", "generation ship", "starship bridge", "engine room", "cargo bay", "hangar bay", "medical bay", "sci-fi laboratory", "command center", "observation deck", "teleporter room", "holodeck", "cryogenic chamber", "escape pod", "airlock", "docking bay", "reactor core", "artificial gravity", "zero gravity", "alien planet", "parallel universe", "alternate dimension", "time machine", "portal", "wormhole", "black hole", "nebula", "galaxy far far away", "dystopian city", "utopian society", "cyberpunk city", "steampunk world", "post apocalyptic wasteland", "underground bunker", "fallout shelter", "vault", "metro tunnels", "abandoned city", "ghost town", "ruins of civilization", "overgrown city", "floating city", "underwater city", "cloud city", "sky fortress", "orbital ring", "dyson sphere", "ringworld", "artificial world", "mining station", "research facility", "terraforming station", "solar array", "communications hub",

    // Historical & Time Periods
    "ancient egypt", "ancient greece", "ancient rome", "ancient china", "ancient india", "mesopotamia", "babylon", "pompeii", "viking village", "medieval castle", "medieval town", "renaissance italy", "elizabethan england", "colonial america", "wild west saloon", "wild west town", "victorian london", "victorian mansion", "industrial revolution", "roaring twenties", "great depression", "world war i trench", "world war ii bunker", "cold war era", "1950s diner", "1960s woodstock", "1970s disco", "1980s arcade", "1990s mall", "stone age cave", "bronze age settlement", "iron age fort", "roman forum", "greek agora", "egyptian tomb", "mayan temple", "aztec pyramid", "inca citadel", "samurai castle", "ninja village", "pirate ship", "pirate island", "treasure cave", "shipwreck", "lost city", "hidden temple", "secret chamber", "forgotten ruins", "native american village", "colonial fort", "pioneer settlement", "gold rush town", "plantation", "slave quarters", "civil war battlefield", "frontier town", "trading post",

    // Atmospheric & Weather Settings
    "sunny day", "cloudy sky", "stormy weather", "thunderstorm", "lightning", "rainbow", "sunrise", "sunset", "golden hour", "blue hour", "twilight", "dawn", "dusk", "midnight", "noon", "foggy morning", "misty evening", "snowy landscape", "winter wonderland", "spring garden", "summer beach", "autumn forest", "rainy day", "desert storm", "hurricane", "tornado", "blizzard", "aurora borealis", "northern lights", "shooting stars", "full moon", "crescent moon", "solar eclipse", "lunar eclipse", "meteor shower", "comet", "milky way", "starry night", "clear sky", "overcast", "partly cloudy", "heat wave", "drought", "flood", "avalanche", "volcanic eruption", "earthquake", "tsunami", "sandstorm", "dust devil", "whirlpool", "maelstrom", "geyser eruption", "forest fire", "wildfire", "smoke", "ash cloud", "ice storm", "hailstorm", "monsoon", "typhoon", "cyclone", "blowing snow", "ice fog", "dust storm", "haboob"
  ];

  // Settings state
  const [selectedModel, setSelectedModel] = useState('flux');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [customWidth, setCustomWidth] = useState('1024');
  const [customHeight, setCustomHeight] = useState('1024');
  const [style, setStyle] = useState('realistic');
  const [place, setPlace] = useState('');
  const [customPlace, setCustomPlace] = useState('');
  const [isCustomPlace, setIsCustomPlace] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [seed, setSeed] = useState<string>('');
  const [useRandomSeed, setUseRandomSeed] = useState(true);
  const [numberOfImages, setNumberOfImages] = useState(4);
  const [isCustomNumber, setIsCustomNumber] = useState(false);
  const [customNumberOfImages, setCustomNumberOfImages] = useState('');
  const [shareToGallery, setShareToGallery] = useState(true);
  const [savingImages, setSavingImages] = useState<Set<string>>(new Set());
  const [savedImages, setSavedImages] = useState<Set<string>>(new Set());
  
  // Custom art style state
  const [customArtStyles, setCustomArtStyles] = useState<string[]>([]);
  const [newCustomStyle, setNewCustomStyle] = useState('');
  const [showCustomStyleInput, setShowCustomStyleInput] = useState(false);
  
  // Database art styles
  const { data: databaseArtStyles = [], isLoading: isLoadingDbStyles } = useQuery<UserArtStyle[]>({
    queryKey: ['/api/user-art-styles', user?.uid],
    enabled: !!user?.uid,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await fetch(`/api/user-art-styles?userId=${user?.uid}`);
      if (!response.ok) {
        throw new Error('Failed to fetch art styles');
      }
      return response.json();
    },
  });
  
  // Custom models state and query
  const { data: customModels = [], isLoading: isLoadingCustomModels, refetch: refetchCustomModels } = useQuery<CustomModel[]>({
    queryKey: ['/api/custom-models', user?.uid],
    enabled: !!user?.uid,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await fetch(`/api/custom-models?userId=${user?.uid}`);
      if (!response.ok) {
        throw new Error('Failed to fetch custom models');
      }
      return response.json();
    },
  });
  
  // Custom model dialog state
  const [showCustomModelDialog, setShowCustomModelDialog] = useState(false);
  const [customModelType, setCustomModelType] = useState<'huggingface'>('huggingface');
  const [customModelName, setCustomModelName] = useState('');
  const [customModelUrl, setCustomModelUrl] = useState('');
  const [customModelApiKey, setCustomModelApiKey] = useState('');
  const [isSavingCustomModel, setIsSavingCustomModel] = useState(false);
  
  // Custom art style information state
  interface StyleInfo {
    description: string;
    keywords: string;
    inspiration: string;
    characteristics: string;
  }
  const [customStylesInfo, setCustomStylesInfo] = useState<Record<string, StyleInfo>>({});
  
  // Custom art style information popup state
  const [showStyleInfoPopup, setShowStyleInfoPopup] = useState(false);
  const [currentStyleBeingDefined, setCurrentStyleBeingDefined] = useState('');
  const [styleDescription, setStyleDescription] = useState('');
  const [styleKeywords, setStyleKeywords] = useState('');
  const [styleInspiration, setStyleInspiration] = useState('');
  const [styleCharacteristics, setStyleCharacteristics] = useState('');

  // Cleanup object URLs only on component unmount
  useEffect(() => {
    return () => {
      createdUrlsRef.current.forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  // Load custom art styles from localStorage on mount
  useEffect(() => {
    const savedCustomStyles = localStorage.getItem('customArtStyles');
    if (savedCustomStyles) {
      setCustomArtStyles(JSON.parse(savedCustomStyles));
    }
    
    // Load custom styles info from localStorage
    const savedCustomStylesInfo = localStorage.getItem('customArtStylesInfo');
    if (savedCustomStylesInfo) {
      setCustomStylesInfo(JSON.parse(savedCustomStylesInfo));
    }
    
    // Check for selected art style from My Art Style page
    const selectedArtStyle = localStorage.getItem('selectedArtStyle');
    if (selectedArtStyle) {
      try {
        const styleData = JSON.parse(selectedArtStyle);
        if (styleData.source === 'database' || styleData.source === 'community') {
          // Set the style name
          setStyle(styleData.name);
          
          // Add to custom styles info if it has detailed information
          if (styleData.description || styleData.keywords || styleData.inspiration || styleData.characteristics) {
            setCustomStylesInfo(prev => ({
              ...prev,
              [styleData.name]: {
                description: styleData.description || '',
                keywords: styleData.keywords || '',
                inspiration: styleData.inspiration || '',
                characteristics: styleData.characteristics || ''
              }
            }));
          }
          
          toast({
            title: "Art style loaded!",
            description: `"${styleData.name}" is now selected for image generation.`,
          });
        }
        
        // Clear the selected style from localStorage
        localStorage.removeItem('selectedArtStyle');
      } catch (error) {
        console.error('Error loading selected art style:', error);
      }
    }
  }, [toast]);

  // Save custom art styles to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('customArtStyles', JSON.stringify(customArtStyles));
  }, [customArtStyles]);
  
  // Save custom styles info to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('customArtStylesInfo', JSON.stringify(customStylesInfo));
  }, [customStylesInfo]);

  // Function to initiate custom art style creation with popup
  const addCustomArtStyle = () => {
    const trimmedStyle = newCustomStyle.trim();
    if (trimmedStyle && !customArtStyles.some(style => style.toLowerCase() === trimmedStyle.toLowerCase())) {
      setCurrentStyleBeingDefined(trimmedStyle);
      setNewCustomStyle('');
      setShowCustomStyleInput(false);
      setShowStyleInfoPopup(true);
    }
  };

  // Function to save the custom art style with collected information
  const saveCustomArtStyleWithInfo = async () => {
    if (currentStyleBeingDefined) {
      // Add the style to the list
      setCustomArtStyles([...customArtStyles, currentStyleBeingDefined]);
      setStyle(currentStyleBeingDefined); // Automatically select the newly created style
      
      // Save the detailed information to state (which will auto-save to localStorage)
      const styleInfo = {
        description: styleDescription,
        keywords: styleKeywords,
        inspiration: styleInspiration,
        characteristics: styleCharacteristics
      };
      
      setCustomStylesInfo({
        ...customStylesInfo,
        [currentStyleBeingDefined]: styleInfo
      });
      
      // If user is logged in, also save to database
      if (user?.uid) {
        try {
          const response = await fetch('/api/user-art-styles', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.uid,
              name: currentStyleBeingDefined.trim(),
              description: styleDescription.trim() || null,
              keywords: styleKeywords.trim() || null,
              inspiration: styleInspiration.trim() || null,
              characteristics: styleCharacteristics.trim() || null
            }),
          });
          
          if (response.ok) {
            toast({
              title: "Custom art style created!",
              description: `"${currentStyleBeingDefined}" has been saved to your account and is ready to use.`,
            });
          } else {
            throw new Error('Failed to save to database');
          }
        } catch (error) {
          console.error('Error saving art style to database:', error);
          toast({
            title: "Art style created locally",
            description: `"${currentStyleBeingDefined}" was saved locally but couldn't be synced to your account.`,
          });
        }
      } else {
        toast({
          title: "Custom art style created!",
          description: `"${currentStyleBeingDefined}" has been saved locally. Sign in to save styles to your account.`,
        });
      }
      
      // Reset form and close popup
      setStyleDescription('');
      setStyleKeywords('');
      setStyleInspiration('');
      setStyleCharacteristics('');
      setCurrentStyleBeingDefined('');
      setShowStyleInfoPopup(false);
    }
  };

  // Function to remove a custom art style
  const removeCustomArtStyle = (styleToRemove: string) => {
    setCustomArtStyles(customArtStyles.filter(style => style !== styleToRemove));
    
    // Remove the style info as well
    const updatedStylesInfo = { ...customStylesInfo };
    delete updatedStylesInfo[styleToRemove];
    setCustomStylesInfo(updatedStylesInfo);
    
    if (style === styleToRemove) {
      setStyle('realistic'); // Reset to default if current style is removed
    }
  };

  // Helper function to get model display name
  const getModelDisplayName = (modelId: string): string => {
    if (modelId.startsWith('custom-')) {
      const customModelId = modelId.replace('custom-', '');
      const customModel = customModels.find(m => m.id === customModelId);
      return customModel ? customModel.name : modelId;
    }
    
    // Return friendly names for built-in models
    const modelNames: Record<string, string> = {
      'flux-schnell': 'Flux-Schnell',
      'flux-real': 'Flux-Real',
      'flux': 'Flux (fast)',
      'turbo': 'Turbo',
      'image-4': 'Image-4',
      'image-4-ultra': 'Image-4 Ultra'
    };
    
    return modelNames[modelId] || modelId;
  };

  // Function to save custom model
  const saveCustomModel = async () => {
    if (!user?.uid) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save custom models.",
        variant: "destructive",
      });
      return;
    }

    // Validation based on model type
    if (!customModelName.trim() || !customModelUrl.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingCustomModel(true);
    try {
      const response = await fetch('/api/custom-models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          name: customModelName.trim(),
          modelType: customModelType,
          apiUrl: customModelUrl.trim(),
          apiKey: customModelApiKey.trim() || null,
          requestFormat: 'standard',
          isActive: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save custom model');
      }

      toast({
        title: "Custom model added!",
        description: `"${customModelName}" has been saved and is ready to use.`,
      });

      // Reset form and close dialog
      setCustomModelType('huggingface');
      setCustomModelName('');
      setCustomModelUrl('');
      setCustomModelApiKey('');
      setShowCustomModelDialog(false);

      // Refetch custom models
      refetchCustomModels();
    } catch (error) {
      console.error('Error saving custom model:', error);
      toast({
        title: "Failed to save",
        description: "Could not save custom model. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingCustomModel(false);
    }
  };

  // Function to delete custom model
  const deleteCustomModel = async (modelId: string) => {
    if (!user?.uid) return;

    try {
      const response = await fetch(`/api/custom-models/${modelId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete custom model');
      }

      toast({
        title: "Model deleted",
        description: "Custom model has been removed.",
      });

      // Refetch custom models
      refetchCustomModels();

      // Reset selected model if it was deleted
      if (selectedModel === `custom-${modelId}`) {
        setSelectedModel('flux');
      }
    } catch (error) {
      console.error('Error deleting custom model:', error);
      toast({
        title: "Delete failed",
        description: "Could not delete custom model. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Combined art styles for dropdown (predefined + custom + database)
  const databaseStyleNames = databaseArtStyles.map(style => style.name);
  const allArtStyles = [...artStyles, ...customArtStyles, ...databaseStyleNames];

  // Simplified configuration
  const guidance = '7.5';
  const strength = '0.8';

  // Helper function to calculate dimensions from aspect ratio
  const getDimensions = () => {
    if (aspectRatio === 'custom') {
      // Clamp and round to nearest multiple of 64 for API compatibility
      const clampAndRound = (value: string, min = 256, max = 1536) => {
        const num = parseInt(value) || 1024;
        const clamped = Math.max(min, Math.min(max, num));
        return Math.round(clamped / 64) * 64;
      };
      return [clampAndRound(customWidth), clampAndRound(customHeight)];
    }
    
    // Use standard, API-friendly dimensions that are multiples of 64
    switch (aspectRatio) {
      case '1:1':
        return [1024, 1024];
      case '16:9':
        return [1024, 576];  // 1024/576 ≈ 1.78 (16:9)
      case '4:3':
        return [1024, 768];  // 1024/768 ≈ 1.33 (4:3)
      case '9:16':
        return [576, 1024];  // 576/1024 ≈ 0.56 (9:16)
      default:
        return [1024, 1024];
    }
  };

  // Helper function to convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Helper function to save image to gallery
  const saveToGallery = async (image: GeneratedImage, imageBlob: Blob) => {
    try {
      const base64Data = await blobToBase64(imageBlob);
      
      await fetch('/api/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: image.prompt,
          negativePrompt: image.negativePrompt,
          model: image.model,
          width: image.width,
          height: image.height,
          imageData: base64Data,
          artStyle: style, // Include the selected art style
          userDisplayName: user?.displayName || user?.email || 'Anonymous User'
        }),
      });
      
      toast({
        title: "Shared to gallery!",
        description: "Your image is now visible in the community gallery.",
      });
    } catch (error) {
      console.error('Failed to save image to gallery:', error);
      toast({
        title: "Share failed",
        description: "Could not share image to gallery. Image saved locally.",
        variant: "destructive",
      });
    }
  };

  // Helper function to generate a single image
  const generateSingleImage = async (promptToUse: string, imageIndex: number): Promise<GeneratedImage> => {
    let enhancedPrompt = promptToUse;
    
    // Add place if selected (custom or predefined)
    const currentPlace = isCustomPlace ? customPlace : place;
    if (currentPlace.trim()) {
      enhancedPrompt += ` in ${currentPlace}`;
    }
    
    // Add style with enhanced information for custom styles or database styles
    if (style && style.trim()) {
      const isCustomStyle = customArtStyles.includes(style) && customStylesInfo[style];
      const isDatabaseStyle = databaseArtStyles.find(dbStyle => dbStyle.name === style);
      
      if (isCustomStyle || isDatabaseStyle) {
        // Use detailed information for custom styles or database styles with sanitization and length limits
        let styleInfo;
        
        if (isCustomStyle) {
          styleInfo = customStylesInfo[style];
        } else if (isDatabaseStyle) {
          styleInfo = {
            description: isDatabaseStyle.description || '',
            keywords: isDatabaseStyle.keywords || '',
            inspiration: isDatabaseStyle.inspiration || '',
            characteristics: isDatabaseStyle.characteristics || ''
          };
        }
        
        let stylePrompt = `, ${style} style`;
        
        // Only proceed with style information if we have valid styleInfo
        if (styleInfo) {
          // Helper function to sanitize and limit text
          const sanitizeText = (text: string, maxLength = 50) => {
            return text
              .trim()
              .replace(/\s+/g, ' ') // Collapse whitespace
              .replace(/[\n\r]/g, ' ') // Remove newlines
              .substring(0, maxLength) // Limit length
              .trim();
          };
          
          // Collect all style information with limits
          const styleElements: string[] = [];
          
          if (styleInfo.description) {
            styleElements.push(sanitizeText(styleInfo.description, 60));
          }
          
          if (styleInfo.keywords) {
            styleElements.push(sanitizeText(styleInfo.keywords, 40));
          }
          
          if (styleInfo.inspiration) {
            styleElements.push(sanitizeText(styleInfo.inspiration, 30));
          }
          
          if (styleInfo.characteristics) {
            styleElements.push(sanitizeText(styleInfo.characteristics, 50));
          }
          
          // Join elements and apply total length limit to prevent URL overflow
          const additionalInfo = styleElements.join(', ');
          const maxTotalAdditionalLength = 200; // Conservative limit for URL compatibility
          const finalAdditionalInfo = additionalInfo.length > maxTotalAdditionalLength 
            ? additionalInfo.substring(0, maxTotalAdditionalLength).trim() + '...'
            : additionalInfo;
          
          if (finalAdditionalInfo) {
            stylePrompt += `, ${finalAdditionalInfo}`;
          }
        }
        
        enhancedPrompt += stylePrompt;
      } else {
        // Use simple style name for predefined styles
        enhancedPrompt += `, ${style} style`;
      }
    }
    
    // Add negative prompt if provided
    if (negativePrompt.trim()) {
      enhancedPrompt += `, --no ${negativePrompt.trim()}`;
    }
    
    // Apply robust global prompt length budget to prevent URL overflow
    const maxEncodedLength = 1800; // Conservative limit for URL safety
    let wasTruncated = false;
    
    // Priority-based trimming: preserve base prompt most, then style, then place, finally negative
    const trimWithPriority = (basePrompt: string, styleSegment: string, placeSegment: string, negativeSegment: string) => {
      const checkLength = (prompt: string) => encodeURIComponent(prompt).length;
      
      // Helper to trim at word boundaries safely
      const trimSafe = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        const trimmed = text.substring(0, maxLength);
        const lastSpace = trimmed.lastIndexOf(' ');
        return lastSpace > maxLength * 0.7 ? trimmed.substring(0, lastSpace) + '...' : trimmed + '...';
      };
      
      // Start with all segments
      let currentPrompt = basePrompt + styleSegment + placeSegment + negativeSegment;
      
      // 1. First, try reducing custom style info if it was added
      if (checkLength(currentPrompt) > maxEncodedLength && styleSegment.includes(',') && styleSegment.length > 20) {
        // Fix: properly extract base style, accounting for leading comma
        const styleParts = styleSegment.split(',').filter(part => part.trim());
        const baseStyle = styleParts.length > 0 ? `, ${styleParts[0].trim()}` : styleSegment;
        styleSegment = baseStyle;
        currentPrompt = basePrompt + styleSegment + placeSegment + negativeSegment;
        wasTruncated = true;
      }
      
      // 2. Remove place if still too long
      if (checkLength(currentPrompt) > maxEncodedLength && placeSegment) {
        placeSegment = '';
        currentPrompt = basePrompt + styleSegment + negativeSegment;
        wasTruncated = true;
      }
      
      // 3. Remove negative prompt if still too long
      if (checkLength(currentPrompt) > maxEncodedLength && negativeSegment) {
        negativeSegment = '';
        currentPrompt = basePrompt + styleSegment;
        wasTruncated = true;
      }
      
      // 4. Finally, trim base prompt if absolutely necessary
      if (checkLength(currentPrompt) > maxEncodedLength) {
        const availableLength = maxEncodedLength - checkLength(styleSegment) - 100; // Account for URL overhead
        if (availableLength > 50) { // Ensure minimum viable prompt
          basePrompt = trimSafe(basePrompt, Math.floor(availableLength / 2)); // Conservative encoding estimate
          currentPrompt = basePrompt + styleSegment;
          wasTruncated = true;
        }
      }
      
      return { prompt: currentPrompt, wasTruncated };
    };
    
    // Construct explicit segments for deterministic trimming
    const basePrompt = promptToUse;
    const placeSegment = place.trim() ? ` in ${place}` : '';
    const negativeSegment = negativePrompt.trim() ? `, --no ${negativePrompt.trim()}` : '';
    
    // Extract the style segment that was built earlier
    const styleStart = basePrompt.length + placeSegment.length;
    const styleEnd = enhancedPrompt.length - negativeSegment.length;
    const styleSegment = enhancedPrompt.substring(styleStart, styleEnd);
    
    // Apply priority-based trimming and get result
    const result = trimWithPriority(basePrompt, styleSegment, placeSegment, negativeSegment);
    enhancedPrompt = result.prompt;
    wasTruncated = result.wasTruncated;
    
    // Final safety check with assertion
    const finalEncodedLength = encodeURIComponent(enhancedPrompt).length;
    if (finalEncodedLength > maxEncodedLength) {
      // Hard fallback: trim to absolute limit
      const safeLength = Math.floor(maxEncodedLength * 0.6); // Very conservative
      enhancedPrompt = enhancedPrompt.substring(0, safeLength) + '...';
      wasTruncated = true;
    }
    
    // Show user-visible notification if truncated
    if (wasTruncated) {
      toast({
        title: "Prompt shortened",
        description: "Your prompt was automatically shortened to ensure reliable image generation.",
        variant: "default",
      });
    }
    
    const [width, height] = getDimensions();
    
    // Check if this is a custom model
    const isCustomModel = selectedModel.startsWith('custom-');
    
    // Determine API based on model
    let url: string;
    let isCustomModelRequest = false;
    const xevenModels = ['flux-schnell', 'flux-real'];
    const pollinationsModels = ['flux', 'turbo', 'image-4', 'image-4-ultra'];
    
    if (isCustomModel) {
      // Extract custom model ID
      const customModelId = selectedModel.replace('custom-', '');
      isCustomModelRequest = true;
      url = '/api/generate-with-custom-model'; // Will be a POST request
    } else if (xevenModels.includes(selectedModel)) {
      // Use xeven.workers.dev API with aspect ratio support
      url = `https://ai-image-api.xeven.workers.dev/img?prompt=${encodeURIComponent(enhancedPrompt)}&model=${selectedModel}&guidance=${guidance}&strength=${strength}&width=${width}&height=${height}`;
    } else if (pollinationsModels.includes(selectedModel)) {
      // Use pollinations.ai API
      const actualSeed = useRandomSeed ? Math.floor(Math.random() * 1000000) : (parseInt(seed) || Math.floor(Math.random() * 1000000));
      url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${width}&height=${height}&seed=${actualSeed}&model=${selectedModel}&nologo=true`;
    } else {
      throw new Error('Unknown model selected');
    }
    
    // Proper retry logic with exponential backoff
    let response: Response | null = null;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      let controller: AbortController | null = null;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      
      try {
        controller = new AbortController();
        // Much more generous timeouts to allow for slow AI image generation APIs
        // Progressive timeout increases for retries: 60s, 90s, 120s
        const baseTimeout = 60000; // 60 seconds base
        const timeoutMultiplier = attempt; // 1x, 2x, 3x for attempts
        const timeoutDelay = baseTimeout * timeoutMultiplier;
        timeoutId = setTimeout(() => {
          if (controller) {
            controller.abort(`Request timeout after ${timeoutDelay / 1000} seconds (attempt ${attempt})`);
          }
        }, timeoutDelay);
        
        // Custom model requires POST request with JSON body
        if (isCustomModelRequest) {
          const customModelId = selectedModel.replace('custom-', '');
          
          // Get the current place (custom or predefined)
          const currentPlace = isCustomPlace ? customPlace : place;
          
          // Build options object with all UI features
          const options: Record<string, any> = {
            width,
            height,
            aspect_ratio: aspectRatio,
            ...(negativePrompt.trim() && { negative_prompt: negativePrompt.trim() }),
            ...(useRandomSeed ? {} : { seed: parseInt(seed) || Math.floor(Math.random() * 1000000) }),
            ...(style.trim() && { art_style: style.trim() }),
            ...(currentPlace.trim() && { place: currentPlace.trim() })
          };
          
          response = await fetch(url, {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              modelId: customModelId,
              prompt: enhancedPrompt,
              options
            })
          });
        } else {
          // Standard GET request for other models
          response = await fetch(url, {
            signal: controller.signal,
            headers: {
              'Accept': 'image/*'
            }
          });
        }
        
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        if (response.ok) break;
        
        lastError = new Error(`API Error: ${response.status} - ${response.statusText || 'Unknown error'}`);
        
        // Apply exponential backoff with jitter for all non-OK responses
        if (attempt < 3) {
          const baseDelay = Math.pow(2, attempt) * 1000; // Exponential: 2s, 4s
          const jitter = Math.random() * 1000; // Add up to 1s jitter
          await new Promise(resolve => setTimeout(resolve, baseDelay + jitter));
        }
      } catch (error) {
        // Ensure timeout is cleared in case of any error
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        if (error instanceof Error) {
          if (error.name === 'AbortError' || error.message.includes('aborted')) {
            lastError = new Error(`Request timeout for image ${imageIndex + 1} - please try again`);
          } else if (error.message === 'Failed to fetch') {
            lastError = new Error('Network error - please check your connection');
          } else {
            lastError = error;
          }
        } else {
          lastError = new Error('Unknown error occurred');
        }
        
        // For timeouts, still retry if we have attempts left
        if (attempt < 3) {
          const baseDelay = Math.pow(2, attempt) * 1000;
          const jitter = Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, baseDelay + jitter));
        }
      }
    }
    
    if (!response || !response.ok) {
      throw lastError || new Error(`Image generation service is currently unavailable for image ${imageIndex + 1}`);
    }
    
    let blob: Blob;
    
    // Custom models return JSON, other models return image blob directly
    if (isCustomModelRequest) {
      // Check for non-OK responses before parsing
      if (!response.ok) {
        let errorMsg = 'Unknown error';
        try {
          const errorJson = await response.json();
          errorMsg = errorJson.details || errorJson.error || JSON.stringify(errorJson);
        } catch (parseError) {
          // If JSON parsing fails, use status text
          errorMsg = response.statusText || 'Server error';
        }
        throw new Error(`Custom model error (${response.status}): ${errorMsg}`);
      }
      
      const jsonResponse = await response.json();
      
      // The custom model endpoint returns { success: true, data: {...} }
      // But also support direct responses for different API formats
      if (!jsonResponse.success && !jsonResponse.data && !jsonResponse.generatedImage && !jsonResponse.image && !jsonResponse.url) {
        const errorMsg = jsonResponse.error || jsonResponse.details || 'Invalid response from custom model';
        throw new Error(errorMsg);
      }
      
      // Try different possible response formats
      const imageData = 
        jsonResponse.data?.imageData || 
        jsonResponse.data?.image || 
        jsonResponse.data?.url ||
        jsonResponse.data?.generatedImage ||
        jsonResponse.generatedImage ||
        jsonResponse.image ||
        jsonResponse.url ||
        (typeof jsonResponse.data === 'string' ? jsonResponse.data : null);
      
      if (!imageData) {
        throw new Error('No image data found in custom model response');
      }
      
      // If it's a URL, fetch the image with timeout
      if (typeof imageData === 'string' && (imageData.startsWith('http://') || imageData.startsWith('https://'))) {
        const imgController = new AbortController();
        const imgTimeoutId = setTimeout(() => imgController.abort(), 30000); // 30s timeout for image fetch
        
        try {
          const imgResponse = await fetch(imageData, { signal: imgController.signal });
          clearTimeout(imgTimeoutId);
          
          if (!imgResponse.ok) {
            throw new Error(`Failed to fetch image from URL: ${imgResponse.status}`);
          }
          
          blob = await imgResponse.blob();
        } catch (fetchError) {
          clearTimeout(imgTimeoutId);
          throw new Error(`Failed to fetch image from custom model URL: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
        }
      } 
      // If it's base64 data
      else if (typeof imageData === 'string' && (imageData.startsWith('data:image/') || imageData.startsWith('/9j/') || imageData.startsWith('iVBOR'))) {
        // Convert base64 to blob with proper MIME type detection
        let mimeType = 'image/png'; // default
        let base64Data = imageData;
        
        if (imageData.startsWith('data:')) {
          // Extract MIME type from data URL
          const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            mimeType = matches[1];
            base64Data = matches[2];
          } else {
            base64Data = imageData.split(',')[1];
          }
        } else {
          // Detect MIME from base64 signature
          if (imageData.startsWith('/9j/')) {
            mimeType = 'image/jpeg';
          } else if (imageData.startsWith('iVBOR')) {
            mimeType = 'image/png';
          }
        }
        
        try {
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          blob = new Blob([bytes], { type: mimeType });
        } catch (decodeError) {
          throw new Error(`Failed to decode base64 image data: ${decodeError instanceof Error ? decodeError.message : 'Unknown error'}`);
        }
      } else {
        throw new Error('Unsupported image format from custom model');
      }
    } else {
      // Standard models return blob directly
      blob = await response.blob();
    }
    
    if (blob.size === 0) {
      throw new Error(`Empty response from image generation service for image ${imageIndex + 1}`);
    }
    
    const imgUrl = URL.createObjectURL(blob);
    
    // Track the created URL for cleanup
    createdUrlsRef.current.push(imgUrl);
    
    // Generate unique ID with image index to avoid collisions
    const newImage: GeneratedImage = {
      id: `${Date.now()}-${imageIndex}-${Math.random().toString(36).substr(2, 9)}`,
      url: imgUrl,
      prompt: promptToUse,
      negativePrompt: negativePrompt.trim() || undefined,
      model: getModelDisplayName(selectedModel),
      timestamp: new Date(),
      width: width,
      height: height,
    };
    
    // Save to gallery if sharing is enabled
    if (shareToGallery) {
      // Don't await this to avoid blocking the UI
      saveToGallery(newImage, blob).catch(console.error);
    }
    
    return newImage;
  };

  const generateImage = async (customPrompt?: string) => {
    // Use custom prompt or fall back to state prompt
    const promptToUse = customPrompt || prompt;
    
    // Atomic check to prevent concurrent generations
    if (isGeneratingRef.current) {
      toast({
        title: "Generation in progress",
        description: "Please wait for the current generation to complete.",
        variant: "destructive",
      });
      return;
    }

    if (!promptToUse.trim()) {
      toast({
        title: "Enter a prompt",
        description: "Please describe what you'd like to create.",
        variant: "destructive",
      });
      return;
    }

    // Set ref atomically before state
    isGeneratingRef.current = true;
    setIsGenerating(true);
    
    try {
      // Generate all images with slight staggering to reduce API load
      const imagePromises = Array.from({ length: numberOfImages }, (_, i) => {
        // Add a small delay before starting each request to prevent overwhelming the API
        const startDelay = i * 1000; // 0s, 1s, 2s, 3s staggered starts
        
        return new Promise<GeneratedImage | null>(resolve => {
          setTimeout(async () => {
            try {
              const newImage = await generateSingleImage(promptToUse, i);
              // Add each image to the display as it's generated
              setGeneratedImages(prev => [newImage, ...prev]);
              
              // Show progress toast for multiple images
              if (numberOfImages > 1) {
                toast({
                  title: `Image ${i + 1} of ${numberOfImages} generated!`,
                  description: `Generated image ${i + 1} successfully.`,
                });
              }
              
              resolve(newImage);
            } catch (error) {
              // If one image fails, show error but continue with other images
              console.error(`Image ${i + 1} generation failed:`, error);
              toast({
                title: `Image ${i + 1} failed`,
                description: `Could not generate image ${i + 1} of ${numberOfImages}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: "destructive",
              });
              resolve(null);
            }
          }, startDelay);
        });
      });
      
      // Wait for all images to complete (or fail)
      const results = await Promise.all(imagePromises);
      const generatedImagesArray = results.filter((img): img is GeneratedImage => img !== null);
      
      // Final success toast
      if (generatedImagesArray.length > 0) {
        if (numberOfImages === 1) {
          toast({
            title: "Image generated successfully!",
            description: "Your AI-generated image is ready.",
          });
        } else {
          toast({
            title: `Generated ${generatedImagesArray.length} images!`,
            description: `Successfully created ${generatedImagesArray.length} of ${numberOfImages} requested images.`,
          });
        }
      } else {
        throw new Error('No images were generated successfully');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.warn('Image generation failed:', errorMessage);
      
      let userFriendlyMessage = 'Please try again in a moment.';
      
      if (errorMessage.includes('Network error')) {
        userFriendlyMessage = 'Please check your internet connection and try again.';
      } else if (errorMessage.includes('timeout')) {
        userFriendlyMessage = 'The request took too long. Please try again.';
      } else if (errorMessage.includes('unavailable')) {
        userFriendlyMessage = 'The image generation service is temporarily unavailable.';
      }
      
      toast({
        title: "Generation failed",
        description: userFriendlyMessage,
        variant: "destructive",
      });
    } finally {
      isGeneratingRef.current = false;
      setIsGenerating(false);
    }
  };

  const clearInput = () => {
    setPrompt('');
  };

  const downloadImage = (imageUrl: string, prompt: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-${prompt.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started",
      description: "Your image is being downloaded.",
    });
  };

  const regenerateImage = (image: GeneratedImage) => {
    if (isGeneratingRef.current) {
      toast({
        title: "Generation in progress",
        description: "Please wait for the current generation to complete.",
        variant: "destructive",
      });
      return;
    }
    
    // Set both prompt and negative prompt from the stored image
    setPrompt(image.prompt);
    if (image.negativePrompt) {
      setNegativePrompt(image.negativePrompt);
    } else {
      setNegativePrompt('');
    }
    
    generateImage(image.prompt);
  };

  const saveImage = async (image: GeneratedImage) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save images to your favorites.",
        variant: "destructive",
      });
      return;
    }

    // Check if image is already saved - prevent duplicate saves
    if (savedImages.has(image.id)) {
      toast({
        title: "Already saved",
        description: "This image is already in your favorites.",
        variant: "destructive",
      });
      return;
    }

    // Atomic check to prevent duplicate saves in progress
    if (savingRef.current.has(image.id)) {
      toast({
        title: "Save in progress",
        description: "This image is already being saved to your favorites.",
        variant: "destructive",
      });
      return;
    }

    // Mark as being saved atomically
    savingRef.current.add(image.id);
    setSavingImages(prev => {
      const newSet = new Set(prev);
      newSet.add(image.id);
      return newSet;
    });

    try {
      // Convert blob URL back to blob to get the base64 data URL
      const response = await fetch(image.url);
      const blob = await response.blob();
      const base64Data = await blobToBase64(blob);
      
      // Ensure it's a proper data URL
      if (!base64Data.startsWith('data:image/')) {
        throw new Error('Invalid image data format');
      }
      
      await apiRequest('POST', '/api/saved-images', {
        userId: user.uid,
        prompt: image.prompt,
        negativePrompt: image.negativePrompt,
        model: image.model,
        width: image.width,
        height: image.height,
        imageData: base64Data,
        artStyle: style,
        originalImageId: null // This is a generated image, not from community gallery
      });
      
      // Mark image as saved permanently
      setSavedImages(prev => {
        const newSet = new Set(prev);
        newSet.add(image.id);
        return newSet;
      });
      
      toast({
        title: "Image saved",
        description: "Image has been saved to your favorites!",
      });
    } catch (error) {
      console.error('Failed to save image:', error);
      toast({
        title: "Save failed",
        description: "Could not save image to favorites. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Ensure cleanup happens immediately and reliably
      savingRef.current.delete(image.id);
      setSavingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(image.id);
        return newSet;
      });
    }
  };

  const editImage = async (image: GeneratedImage) => {
    try {
      // Convert the image URL to a File object for editing
      const response = await fetch(image.url);
      const blob = await response.blob();
      const file = new File([blob], `generated-image-${image.id}.png`, { type: 'image/png' });
      
      // Convert the file to base64 for storage
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        
        // Store the image data temporarily in localStorage
        const imageForEdit = {
          file: {
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64Data
          },
          originalPrompt: image.prompt,
          originalModel: image.model
        };
        
        localStorage.setItem('imageToEdit', JSON.stringify(imageForEdit));
        
        // Navigate to image-to-image page
        setLocation('/image-to-image');
        
        toast({
          title: "Redirecting to editor",
          description: "Opening image in the image-to-image editor...",
        });
      };
      
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Failed to prepare image for editing:', error);
      toast({
        title: "Edit failed",
        description: "Could not prepare the image for editing. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteImage = (imageId: string) => {
    let imageToDelete: GeneratedImage | undefined;
    
    setGeneratedImages(prev => {
      imageToDelete = prev.find(img => img.id === imageId);
      return prev.filter(img => img.id !== imageId);
    });
    
    if (imageToDelete) {
      // Defer URL cleanup to avoid potential broken image flash
      setTimeout(() => {
        URL.revokeObjectURL(imageToDelete!.url);
        // Remove from our tracking array
        createdUrlsRef.current = createdUrlsRef.current.filter(url => url !== imageToDelete!.url);
      }, 0);
      
      toast({
        title: "Image deleted",
        description: "The generated image has been removed.",
      });
    }
  };

  const copyPrompt = () => {
    if (prompt.trim()) {
      navigator.clipboard.writeText(prompt);
      toast({
        title: "Copied to clipboard",
        description: "Your prompt has been copied to clipboard.",
      });
    }
  };

  const enhancePrompt = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Enter a prompt first",
        description: "Please enter a basic prompt to enhance.",
        variant: "destructive",
      });
      return;
    }

    setIsEnhancing(true);
    
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to enhance prompt');
      }

      const data = await response.json();
      setPrompt(data.enhancedPrompt);
      
      toast({
        title: "Prompt enhanced!",
        description: "Your prompt has been improved with AI suggestions.",
      });
      
    } catch (error) {
      console.warn('Prompt enhancement failed:', error);
      toast({
        title: "Enhancement failed",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background p-4 relative">
      
      {/* Settings Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-card/95 backdrop-blur border-r border-border/50 z-50 transform transition-transform duration-300 ${settingsOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Settings</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettingsOpen(false)}
              data-testid="button-close-settings"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="model-select">Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger id="model-select" data-testid="select-model">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flux-schnell">Flux-Schnell</SelectItem>
                  <SelectItem value="flux-real">Flux-Real</SelectItem>
                  <SelectItem value="flux">Flux (fast)</SelectItem>
                  <SelectItem value="turbo">Turbo</SelectItem>
                  <SelectItem value="image-4">Image-4</SelectItem>
                  <SelectItem value="image-4-ultra">Image-4 Ultra</SelectItem>
                  {customModels.length > 0 && (
                    <>
                      <SelectItem value="divider" disabled>---Custom Models---</SelectItem>
                      {customModels.map(model => (
                        <SelectItem key={model.id} value={`custom-${model.id}`}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!user?.uid) {
                    toast({
                      title: "Sign in required",
                      description: "Please sign in to add custom models.",
                      variant: "destructive",
                    });
                    return;
                  }
                  setShowCustomModelDialog(true);
                }}
                className="w-full mt-2 text-xs"
                data-testid="button-add-custom-model"
                title={!user?.uid ? "Sign in required to add custom models" : "Add a custom model"}
              >
                <Zap className="w-3 h-3 mr-1" />
                Add Custom Model
              </Button>
            </div>

            {/* Manage Custom Models */}
            {customModels.length > 0 && (
              <div className="space-y-2">
                <Label>Your Custom Models</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {customModels.map(model => (
                    <div key={model.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{model.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{model.apiUrl}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCustomModel(model.id)}
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        data-testid={`button-delete-model-${model.id}`}
                        title="Delete model"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <Label htmlFor="ratio-select">Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger id="ratio-select" data-testid="select-ratio">
                  <SelectValue placeholder="Select ratio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">Square (1:1)</SelectItem>
                  <SelectItem value="16:9">Widescreen (16:9)</SelectItem>
                  <SelectItem value="4:3">Landscape (4:3)</SelectItem>
                  <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              
              {aspectRatio === 'custom' && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label htmlFor="custom-width" className="text-xs">Width</Label>
                    <Input
                      id="custom-width"
                      type="number"
                      placeholder="1024"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      min="256"
                      max="2048"
                      className="text-sm"
                      data-testid="input-custom-width"
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom-height" className="text-xs">Height</Label>
                    <Input
                      id="custom-height"
                      type="number"
                      placeholder="1024"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      min="256"
                      max="2048"
                      className="text-sm"
                      data-testid="input-custom-height"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Place */}
            <div className="space-y-2">
              <Label htmlFor="place-select">Place/Location</Label>
              <Popover open={placeDropdownOpen} onOpenChange={setPlaceDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={placeDropdownOpen}
                    className="w-full justify-between"
                    data-testid="select-place"
                  >
                    {isCustomPlace && customPlace
                      ? `Custom: ${customPlace}`
                      : place
                      ? place.charAt(0).toUpperCase() + place.slice(1)
                      : "Select place..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search places..." />
                    <CommandEmpty>No place found.</CommandEmpty>
                    <CommandList className="max-h-60">
                      <CommandGroup>
                        <CommandItem
                          key="custom"
                          value="custom"
                          onSelect={() => {
                            setIsCustomPlace(true);
                            setPlace('');
                            setPlaceDropdownOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              isCustomPlace ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          Custom Place
                        </CommandItem>
                        {places.map((placeOption) => (
                          <CommandItem
                            key={placeOption}
                            value={placeOption}
                            onSelect={(currentValue) => {
                              setPlace(currentValue === place ? "" : currentValue);
                              setIsCustomPlace(false);
                              setCustomPlace('');
                              setPlaceDropdownOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                place === placeOption && !isCustomPlace ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            {placeOption.charAt(0).toUpperCase() + placeOption.slice(1)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {isCustomPlace && (
                <Input
                  placeholder="Enter your custom place..."
                  value={customPlace}
                  onChange={(e) => setCustomPlace(e.target.value)}
                  data-testid="input-custom-place"
                  className="mt-2"
                />
              )}
              <p className="text-xs text-muted-foreground">
                Choose a location or setting for your image, or select "Custom Place" to enter your own
              </p>
            </div>

            {/* Style */}
            <div className="space-y-2">
              <Label htmlFor="style-select">Style</Label>
              <Popover open={styleDropdownOpen} onOpenChange={setStyleDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={styleDropdownOpen}
                    className="w-full justify-between"
                    data-testid="select-style"
                  >
                    {style
                      ? style.charAt(0).toUpperCase() + style.slice(1)
                      : "Select style..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search art styles..." />
                    <CommandEmpty>No art style found.</CommandEmpty>
                    <CommandList className="max-h-60">
                      <CommandGroup>
                        {allArtStyles.map((artStyle, index) => (
                          <CommandItem
                            key={`${artStyle}-${index}`}
                            value={artStyle}
                            onSelect={(currentValue) => {
                              setStyle(currentValue === style ? "" : currentValue);
                              setStyleDropdownOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                style === artStyle ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            {artStyle.charAt(0).toUpperCase() + artStyle.slice(1)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Choose from predefined or custom art styles
              </p>
            </div>

            {/* Custom Art Style Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Custom Art Style</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomStyleInput(!showCustomStyleInput)}
                  data-testid="button-toggle-custom-style"
                  className="text-xs"
                >
                  {showCustomStyleInput ? "Cancel" : "Create New"}
                </Button>
              </div>

              {showCustomStyleInput && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter custom art style name (e.g., Discpretion for better learning art style)"
                      value={newCustomStyle}
                      onChange={(e) => setNewCustomStyle(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomArtStyle()}
                      className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      data-testid="input-custom-style"
                    />
                    <Button
                      onClick={addCustomArtStyle}
                      size="sm"
                      disabled={!newCustomStyle.trim()}
                      data-testid="button-add-custom-style"
                    >
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Create your own art style name to help with learning and organization
                  </p>
                </div>
              )}

              {customArtStyles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Your Custom Styles:</Label>
                  <div className="flex flex-wrap gap-1">
                    {customArtStyles.map((customStyle) => (
                      <div
                        key={customStyle}
                        className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-xs"
                      >
                        <span 
                          className="cursor-pointer hover:text-primary"
                          onClick={() => setStyle(customStyle)}
                          data-testid={`custom-style-${customStyle}`}
                        >
                          {customStyle.charAt(0).toUpperCase() + customStyle.slice(1)}
                        </span>
                        <button
                          onClick={() => removeCustomArtStyle(customStyle)}
                          className="text-muted-foreground hover:text-destructive ml-1"
                          data-testid={`remove-custom-style-${customStyle}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Negative Prompt */}
            <div className="space-y-2">
              <Label htmlFor="negative-prompt">Negative Prompt</Label>
              <Textarea
                id="negative-prompt"
                placeholder="Enter what you don't want in the image (e.g., blurry, low quality, text)"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                className="min-h-[80px] resize-none"
                data-testid="textarea-negative-prompt"
              />
              <p className="text-xs text-muted-foreground">
                Describe elements you want to avoid in the generated image
              </p>
            </div>

            {/* Number of Images */}
            <div className="space-y-2">
              <Label htmlFor="images-select">Number of Images</Label>
              <Select 
                value={isCustomNumber ? "custom" : numberOfImages.toString()} 
                onValueChange={(value) => {
                  if (value === "custom") {
                    setIsCustomNumber(true);
                    setNumberOfImages(parseInt(customNumberOfImages) || 1);
                  } else {
                    setIsCustomNumber(false);
                    setNumberOfImages(parseInt(value));
                  }
                }}
              >
                <SelectTrigger id="images-select" data-testid="select-images">
                  <SelectValue placeholder="Select number" />
                </SelectTrigger>
                <SelectContent className="max-h-48 overflow-y-auto">
                  <SelectItem value="1">1 Image</SelectItem>
                  <SelectItem value="2">2 Images</SelectItem>
                  <SelectItem value="3">3 Images</SelectItem>
                  <SelectItem value="4">4 Images</SelectItem>
                  <SelectItem value="8">8 Images</SelectItem>
                  <SelectItem value="10">10 Images</SelectItem>
                  <SelectItem value="12">12 Images</SelectItem>
                  <SelectItem value="14">14 Images</SelectItem>
                  <SelectItem value="18">18 Images</SelectItem>
                  <SelectItem value="20">20 Images</SelectItem>
                  <SelectItem value="100">100 Images</SelectItem>
                  <SelectItem value="200">200 Images</SelectItem>
                  <SelectItem value="300">300 Images</SelectItem>
                  <SelectItem value="400">400 Images</SelectItem>
                  <SelectItem value="500">500 Images</SelectItem>
                  <SelectItem value="600">600 Images</SelectItem>
                  <SelectItem value="700">700 Images</SelectItem>
                  <SelectItem value="800">800 Images</SelectItem>
                  <SelectItem value="900">900 Images</SelectItem>
                  <SelectItem value="1000">1000 Images</SelectItem>
                  <SelectItem value="1100">1100 Images</SelectItem>
                  <SelectItem value="1200">1200 Images</SelectItem>
                  <SelectItem value="1300">1300 Images</SelectItem>
                  <SelectItem value="1400">1400 Images</SelectItem>
                  <SelectItem value="1500">1500 Images</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              
              {isCustomNumber && (
                <div className="mt-2">
                  <Input
                    type="number"
                    placeholder="Enter custom number (1-2000)"
                    value={customNumberOfImages}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCustomNumberOfImages(value);
                      const numValue = parseInt(value);
                      if (!isNaN(numValue) && numValue > 0) {
                        setNumberOfImages(Math.min(Math.max(numValue, 1), 2000));
                      }
                    }}
                    min="1"
                    max="2000"
                    className="text-sm"
                    data-testid="input-custom-number"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter any number between 1 and 2000 images
                  </p>
                </div>
              )}
            </div>

            {/* Share to Community */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="share-to-gallery"
                  checked={shareToGallery}
                  onCheckedChange={setShareToGallery}
                  data-testid="switch-share-gallery"
                />
                <Label htmlFor="share-to-gallery">Share to Community Gallery</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                When enabled, your generated images will be visible to all users in the community gallery.
              </p>
            </div>

            {/* Seed */}
            <div className="space-y-3">
              <Label>Seed</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={useRandomSeed}
                  onCheckedChange={setUseRandomSeed}
                  id="random-seed-toggle"
                  data-testid="switch-random-seed"
                />
                <Label htmlFor="random-seed-toggle" className="text-sm">
                  Random seed
                </Label>
              </div>
              
              {!useRandomSeed && (
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Enter seed number"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    className="flex-1"
                    min="0"
                    max="999999999"
                    data-testid="input-seed"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSeed(Math.floor(Math.random() * 1000000).toString())}
                    data-testid="button-generate-seed"
                    title="Generate random seed"
                  >
                    <Shuffle className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                {useRandomSeed ? 'A random seed will be used for each generation' : 'Use the same seed to reproduce similar results'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {settingsOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setSettingsOpen(false)}
        />
      )}

      <div className="max-w-4xl mx-auto">
        
        {/* Top Section */}
        <div className="mb-8">
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-fit grid-cols-2 bg-muted/50">
              <TabsTrigger 
                value="image" 
                className="data-[state=active]:bg-[#8a3dff] data-[state=active]:text-white"
                data-testid="tab-image"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Image
              </TabsTrigger>
              <TabsTrigger 
                value="video" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                data-testid="tab-video"
              >
                <Video className="w-4 h-4 mr-2" />
                Video
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="image" className="mt-8">
              {/* Input Section */}
              <Card className="bg-card/50 backdrop-blur border-border/50 mb-8">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="relative">
                      <Textarea
                        placeholder="Describe the piece you want to create..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-[120px] bg-background/50 border-border/50 focus:border-primary/50 resize-none text-lg pr-12"
                        disabled={isGenerating}
                        data-testid="input-prompt"
                      />
                      
                      {/* Mini Enhance Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={enhancePrompt}
                        disabled={isEnhancing || !prompt.trim()}
                        className="absolute right-2 top-2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        data-testid="button-enhance-mini"
                        title="Enhance prompt with AI"
                      >
                        {isEnhancing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSettingsOpen(true)}
                          className="text-muted-foreground hover:text-foreground"
                          data-testid="button-settings"
                          title="Open settings"
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Settings
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={copyPrompt}
                          disabled={!prompt.trim()}
                          className="text-muted-foreground hover:text-foreground"
                          data-testid="button-copy"
                          title="Copy prompt to clipboard"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => generateImage()}
                          disabled={isGenerating || !prompt.trim()}
                          className="bg-[#8a3dff] hover:bg-[#7c36e6] text-white px-6"
                          data-testid="button-generate"
                        >
                          {isGenerating ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          {isGenerating ? 'Generating...' : 'Generate'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Generated Images Section */}
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="p-6">
                  {generatedImages.length === 0 && !isGenerating && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="relative mb-6">
                        <div className="w-24 h-24 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#8a3dff] rounded-full flex items-center justify-center">
                          <Send className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">
                        Click the Generate button to start creating
                      </h3>
                    </div>
                  )}

                  {isGenerating && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-24 h-24 bg-primary/10 rounded-lg mb-6 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Creating your image...</h3>
                      <p className="text-muted-foreground">This may take a few moments</p>
                    </div>
                  )}

                  {generatedImages.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold">Generated Images</h3>
                        <span className="text-sm text-muted-foreground">
                          {generatedImages.length} image{generatedImages.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {generatedImages.map((image) => (
                          <div key={image.id} className="group" data-testid={`image-${image.id}`}>
                            <div 
                              className="relative overflow-hidden rounded-lg bg-muted/50 mb-3"
                              style={{ aspectRatio: `${image.width} / ${image.height}` }}
                            >
                              <img
                                src={image.url}
                                alt={`Generated: ${image.prompt}`}
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              
                              {/* Delete Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteImage(image.id);
                                }}
                                className="absolute top-2 right-2 h-8 w-8 p-0 bg-red-500/80 hover:bg-red-600 text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                                data-testid={`button-delete-${image.id}`}
                                title="Delete image"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                              
                              <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="flex flex-col gap-2">
                                  <p className="text-white text-xs font-medium line-clamp-1 mb-1">
                                    {image.prompt}
                                  </p>
                                  <div className="flex gap-2 flex-wrap">
                                    {/* Download Button */}
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        downloadImage(image.url, image.prompt);
                                      }}
                                      className="h-7 px-2 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                                      data-testid={`button-download-${image.id}`}
                                      title="Download image"
                                    >
                                      <Download className="w-3 h-3 mr-1" />
                                      Download
                                    </Button>
                                    
                                    {/* Regenerate Button */}
                                    <Button
                                      variant="secondary" 
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        regenerateImage(image);
                                      }}
                                      className="h-7 px-2 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                                      data-testid={`button-regenerate-${image.id}`}
                                      title="Regenerate image"
                                    >
                                      <RefreshCw className="w-3 h-3 mr-1" />
                                      Regenerate
                                    </Button>
                                    
                                    {/* Save Button */}
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        saveImage(image);
                                      }}
                                      disabled={savingImages.has(image.id) || savedImages.has(image.id)}
                                      className="h-7 px-2 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm disabled:opacity-50"
                                      data-testid={`button-save-${image.id}`}
                                      title={
                                        savingImages.has(image.id) 
                                          ? "Saving to favorites..." 
                                          : savedImages.has(image.id) 
                                            ? "Already saved to favorites" 
                                            : "Save to favorites"
                                      }
                                    >
                                      {savingImages.has(image.id) ? (
                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                      ) : savedImages.has(image.id) ? (
                                        <Check className="w-3 h-3 mr-1" />
                                      ) : (
                                        <Save className="w-3 h-3 mr-1" />
                                      )}
                                      {savingImages.has(image.id) 
                                        ? 'Saving...' 
                                        : savedImages.has(image.id) 
                                          ? 'Saved' 
                                          : 'Save'}
                                    </Button>
                                    
                                    {/* Edit Button */}
                                    <Button
                                      variant="secondary"
                                      size="sm" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        editImage(image);
                                      }}
                                      className="h-7 px-2 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                                      data-testid={`button-edit-${image.id}`}
                                      title="Edit image in image-to-image editor"
                                    >
                                      <Edit className="w-3 h-3 mr-1" />
                                      Edit
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-2 text-xs text-muted-foreground">
                              Generated: {image.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="video" className="mt-8">
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-24 h-24 bg-muted/50 rounded-lg mb-6 flex items-center justify-center">
                      <Video className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      Video generation coming soon
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Stay tuned for AI video generation features
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Custom Art Style Information Popup */}
      <Dialog open={showStyleInfoPopup} onOpenChange={setShowStyleInfoPopup}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Define Your Art Style</DialogTitle>
            <DialogDescription>
              Help us understand "{currentStyleBeingDefined}" by providing additional details that will enhance your art style.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="style-description">Description</Label>
              <Textarea
                id="style-description"
                placeholder="Describe what makes this art style unique..."
                value={styleDescription}
                onChange={(e) => setStyleDescription(e.target.value)}
                className="min-h-[60px] resize-none"
                data-testid="textarea-style-description"
              />
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <Label htmlFor="style-keywords">Keywords</Label>
              <Input
                id="style-keywords"
                placeholder="e.g., vibrant, detailed, learning-focused, educational"
                value={styleKeywords}
                onChange={(e) => setStyleKeywords(e.target.value)}
                data-testid="input-style-keywords"
              />
            </div>

            {/* Inspiration */}
            <div className="space-y-2">
              <Label htmlFor="style-inspiration">Inspiration</Label>
              <Input
                id="style-inspiration"
                placeholder="What inspired this style? Artists, movements, concepts..."
                value={styleInspiration}
                onChange={(e) => setStyleInspiration(e.target.value)}
                data-testid="input-style-inspiration"
              />
            </div>

            {/* Characteristics */}
            <div className="space-y-2">
              <Label htmlFor="style-characteristics">Key Characteristics</Label>
              <Textarea
                id="style-characteristics"
                placeholder="Colors, techniques, mood, or specific elements..."
                value={styleCharacteristics}
                onChange={(e) => setStyleCharacteristics(e.target.value)}
                className="min-h-[60px] resize-none"
                data-testid="textarea-style-characteristics"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowStyleInfoPopup(false);
                  setCurrentStyleBeingDefined('');
                  setStyleDescription('');
                  setStyleKeywords('');
                  setStyleInspiration('');
                  setStyleCharacteristics('');
                }}
                className="flex-1"
                data-testid="button-cancel-style-info"
              >
                Cancel
              </Button>
              <Button
                onClick={saveCustomArtStyleWithInfo}
                className="flex-1"
                data-testid="button-save-style-info"
              >
                Create Style
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Model Dialog */}
      <Dialog open={showCustomModelDialog} onOpenChange={setShowCustomModelDialog}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Custom Model</DialogTitle>
            <DialogDescription>
              Add a Hugging Face model or your own custom API endpoint.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4 flex-1 min-h-0 overflow-y-auto pr-2">
            {/* Model Type Selector */}
            <div className="space-y-2">
              <Label htmlFor="model-type">Model Type *</Label>
              <Select value={customModelType} onValueChange={(value: 'huggingface') => setCustomModelType(value)}>
                <SelectTrigger id="model-type" data-testid="select-model-type">
                  <SelectValue placeholder="Select model type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="huggingface">Hugging Face Model</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Use models from Hugging Face Inference API
              </p>
            </div>

            {/* Model Name */}
            <div className="space-y-2">
              <Label htmlFor="model-name">Model Name *</Label>
              <Input
                id="model-name"
                placeholder="e.g., FLUX.1 Schnell"
                value={customModelName}
                onChange={(e) => setCustomModelName(e.target.value)}
                data-testid="input-model-name"
              />
            </div>

            {/* Model ID / API URL */}
            <div className="space-y-2">
              <Label htmlFor="model-url">
                Model ID *
              </Label>
              <Input
                id="model-url"
                placeholder="black-forest-labs/FLUX.1-schnell"
                value={customModelUrl}
                onChange={(e) => setCustomModelUrl(e.target.value)}
                data-testid="input-model-url"
              />
              <p className="text-xs text-muted-foreground">
                The Hugging Face model identifier (e.g., black-forest-labs/FLUX.1-dev)
              </p>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="model-api-key">
                API Key (Optional)
              </Label>
              <Input
                id="model-api-key"
                type="password"
                placeholder="hf_..."
                value={customModelApiKey}
                onChange={(e) => setCustomModelApiKey(e.target.value)}
                data-testid="input-model-api-key"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Hugging Face API token for higher rate limits
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCustomModelDialog(false);
                  setCustomModelType('huggingface');
                  setCustomModelName('');
                  setCustomModelUrl('');
                  setCustomModelApiKey('');
                }}
                className="flex-1"
                data-testid="button-cancel-custom-model"
              >
                Cancel
              </Button>
              <Button
                onClick={saveCustomModel}
                disabled={isSavingCustomModel}
                className="flex-1"
                data-testid="button-save-custom-model"
              >
                {isSavingCustomModel ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Add Model'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TextToImageGenerator;