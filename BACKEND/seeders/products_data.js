// Programmatic product seed with realistic portions, modifiers and images.
// This generates exactly 200 products.

const baseProducts = [
  {
    category_path: ["Electronics", "Mobiles", "Smartphones"],
    display_name: "Apple iPhone 15 Pro Max",
    name: "apple-iphone-15-pro-max",
    description:
      "The ultimate iPhone with a titanium frame, A17 Pro chip, advanced triple‑camera system and all‑day battery life.",
    short_description: "Titanium design. A17 Pro. Pro camera system.",
    base_price: 1199.0,
    image_url:
      "https://images.pexels.com/photos/18809376/pexels-photo-18809376.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      {
        value: "256GB",
        priceDelta: 0,
        stock: 40,
        description: "High‑speed NVMe storage for photos, apps and 4K video.",
      },
      {
        value: "512GB",
        priceDelta: 180,
        stock: 28,
        description: "Recommended for creators shooting ProRes and RAW.",
      },
      {
        value: "1TB",
        priceDelta: 380,
        stock: 12,
        description: "Maximum storage for power users and filmmakers.",
      },
    ],
    modifiers: [
      {
        name: "Color",
        additional_price: 0,
        stock: 50,
        values: ["Natural Titanium", "Blue Titanium", "White Titanium", "Black Titanium"],
      },
      {
        name: "AppleCare+",
        additional_price: 199,
        stock: 999,
        values: ["2 Years Coverage"],
      },
    ],
  },
  {
    category_path: ["Electronics", "Mobiles", "Smartphones"],
    display_name: "Samsung Galaxy S24 Ultra",
    name: "samsung-galaxy-s24-ultra",
    description:
      "Flagship Galaxy smartphone with S Pen, 200MP camera, Galaxy AI features and adaptive 120Hz AMOLED display.",
    short_description: "Galaxy AI. 200MP camera. Built‑in S Pen.",
    base_price: 1249.99,
    image_url:
      "https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      {
        value: "256GB",
        priceDelta: 0,
        stock: 55,
        description: "Ample storage for everyday power users.",
      },
      {
        value: "512GB",
        priceDelta: 150,
        stock: 35,
        description: "Ideal for photography enthusiasts and gamers.",
      },
      {
        value: "1TB",
        priceDelta: 350,
        stock: 18,
        description: "Extreme storage for creators and pros.",
      },
    ],
    modifiers: [
      {
        name: "Color",
        additional_price: 0,
        stock: 70,
        values: ["Titanium Gray", "Titanium Black", "Titanium Violet", "Titanium Yellow"],
      },
      {
        name: "Samsung Care+",
        additional_price: 179,
        stock: 999,
        values: ["2 Years Protection"],
      },
    ],
  },
  {
    category_path: ["Electronics", "Computers", "Laptops"],
    display_name: "Apple MacBook Pro 14\" (M3 Pro)",
    name: "apple-macbook-pro-14-m3-pro",
    description:
      "Powerful 14‑inch MacBook Pro with M3 Pro chip, Liquid Retina XDR display and exceptional battery life for pros on the go.",
    short_description: "M3 Pro. Liquid Retina XDR. All‑day battery.",
    base_price: 1999.0,
    image_url:
      "https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      {
        value: "16GB RAM / 512GB SSD",
        priceDelta: 0,
        stock: 30,
        description: "Perfect balance of performance and storage.",
      },
      {
        value: "32GB RAM / 1TB SSD",
        priceDelta: 400,
        stock: 18,
        description: "For heavy multitasking and large projects.",
      },
      {
        value: "36GB RAM / 2TB SSD",
        priceDelta: 800,
        stock: 10,
        description: "Ideal for 3D, video and software professionals.",
      },
    ],
    modifiers: [
      {
        name: "Keyboard Layout",
        additional_price: 0,
        stock: 200,
        values: ["US English", "UK English", "German", "French"],
      },
      {
        name: "AppleCare+",
        additional_price: 279,
        stock: 999,
        values: ["3 Years Coverage"],
      },
    ],
  },
  {
    category_path: ["Electronics", "Computers", "Laptops"],
    display_name: "Dell XPS 15 OLED",
    name: "dell-xps-15-oled",
    description:
      "Premium 15‑inch Windows laptop with 3.5K OLED display, Intel Core processor and RTX graphics for creators and professionals.",
    short_description: "3.5K OLED. Creator‑class performance.",
    base_price: 1899.99,
    image_url:
      "https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      {
        value: "i7 / 16GB / 512GB SSD",
        priceDelta: 0,
        stock: 26,
        description: "Fast performance for productivity and light creation.",
      },
      {
        value: "i7 / 32GB / 1TB SSD",
        priceDelta: 300,
        stock: 16,
        description: "Smooth performance for 4K editing and multitasking.",
      },
      {
        value: "i9 / 64GB / 2TB SSD",
        priceDelta: 800,
        stock: 8,
        description: "Top‑tier configuration for demanding workflows.",
      },
    ],
    modifiers: [
      {
        name: "Graphics",
        additional_price: 0,
        stock: 50,
        values: ["RTX 4050", "RTX 4060"],
      },
      {
        name: "Warranty Upgrade",
        additional_price: 149,
        stock: 999,
        values: ["3 Years Premium Support"],
      },
    ],
  },
  {
    category_path: ["Electronics", "Audio", "Headphones"],
    display_name: "Sony WH‑1000XM5 Wireless",
    name: "sony-wh-1000xm5",
    description:
      "Industry‑leading noise‑canceling wireless over‑ear headphones with rich, detailed sound and up to 30 hours of battery life.",
    short_description: "Flagship ANC with premium sound.",
    base_price: 399.99,
    image_url:
      "https://images.pexels.com/photos/3394664/pexels-photo-3394664.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      {
        value: "Standard Edition",
        priceDelta: 0,
        stock: 60,
        description: "Includes carrying case and USB‑C cable.",
      },
    ],
    modifiers: [
      {
        name: "Color",
        additional_price: 0,
        stock: 80,
        values: ["Black", "Silver", "Midnight Blue"],
      },
      {
        name: "Protection Plan",
        additional_price: 49,
        stock: 999,
        values: ["2 Years Accident Protection"],
      },
    ],
  },
  {
    category_path: ["Electronics", "Audio", "Earbuds"],
    display_name: "Apple AirPods Pro (2nd Gen)",
    name: "apple-airpods-pro-2",
    description:
      "In‑ear true wireless earbuds with active noise cancellation, Adaptive Audio, personalized spatial audio and MagSafe charging case.",
    short_description: "Next‑level active noise cancellation.",
    base_price: 249.0,
    image_url:
      "https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      {
        value: "Lightning Case",
        priceDelta: 0,
        stock: 80,
        description: "Charging case with Lightning connector.",
      },
      {
        value: "USB‑C Case",
        priceDelta: 10,
        stock: 90,
        description: "Latest USB‑C charging case.",
      },
    ],
    modifiers: [
      {
        name: "AppleCare+",
        additional_price: 39,
        stock: 999,
        values: ["2 Years Coverage"],
      },
    ],
  },
  {
    category_path: ["Electronics", "Wearables", "Smartwatches"],
    display_name: "Apple Watch Series 9",
    name: "apple-watch-series-9",
    description:
      "Advanced smartwatch with S9 SiP, brighter display, health and fitness tracking, and seamless integration with iPhone.",
    short_description: "Powerful. Bright. Connected.",
    base_price: 399.0,
    image_url:
      "https://images.pexels.com/photos/2773940/pexels-photo-2773940.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      {
        value: "41mm GPS",
        priceDelta: 0,
        stock: 45,
        description: "Compact case size with GPS connectivity.",
      },
      {
        value: "45mm GPS",
        priceDelta: 30,
        stock: 38,
        description: "Larger display and battery.",
      },
      {
        value: "45mm GPS + Cellular",
        priceDelta: 130,
        stock: 25,
        description: "Stay connected even without your iPhone.",
      },
    ],
    modifiers: [
      {
        name: "Case Finish",
        additional_price: 0,
        stock: 80,
        values: ["Midnight Aluminum", "Starlight Aluminum", "Product Red", "Silver Stainless"],
      },
      {
        name: "Band",
        additional_price: 29,
        stock: 200,
        values: ["Sport Band", "Sport Loop", "Milanese Loop"],
      },
    ],
  },
  {
    category_path: ["Electronics", "Computers", "Tablets"],
    display_name: "Apple iPad Air 11\" (M2)",
    name: "apple-ipad-air-11-m2",
    description:
      "Thin and light iPad powered by the M2 chip with support for Apple Pencil Pro and a stunning 11‑inch Liquid Retina display.",
    short_description: "M2 power in a thin design.",
    base_price: 599.0,
    image_url:
      "https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      {
        value: "64GB Wi‑Fi",
        priceDelta: 0,
        stock: 70,
        description: "Great for streaming, browsing and light work.",
      },
      {
        value: "256GB Wi‑Fi",
        priceDelta: 150,
        stock: 50,
        description: "More space for apps and offline files.",
      },
      {
        value: "256GB Wi‑Fi + Cellular",
        priceDelta: 300,
        stock: 32,
        description: "Always‑connected tablet for work and travel.",
      },
    ],
    modifiers: [
      {
        name: "Color",
        additional_price: 0,
        stock: 100,
        values: ["Blue", "Purple", "Starlight", "Space Gray"],
      },
      {
        name: "Apple Pencil",
        additional_price: 129,
        stock: 150,
        values: ["Apple Pencil Pro"],
      },
    ],
  },
  {
    category_path: ["Electronics", "Computers", "Monitors"],
    display_name: "LG UltraFine 27\" 4K Monitor",
    name: "lg-ultrafine-27-4k",
    description:
      "27‑inch IPS 4K monitor with accurate color reproduction, USB‑C connectivity and adjustable ergonomic stand.",
    short_description: "Sharp 4K panel for creators.",
    base_price: 449.99,
    image_url:
      "https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      {
        value: "Standard Stand",
        priceDelta: 0,
        stock: 40,
        description: "Height and tilt adjustable stand.",
      },
      {
        value: "Ergo Arm",
        priceDelta: 80,
        stock: 25,
        description: "Flexible C‑clamp monitor arm.",
      },
    ],
    modifiers: [
      {
        name: "Cable",
        additional_price: 19,
        stock: 200,
        values: ["USB‑C Cable", "DisplayPort Cable"],
      },
    ],
  },
  {
    category_path: ["Electronics", "Computers", "Keyboards"],
    display_name: "Keychron K8 Pro Mechanical Keyboard",
    name: "keychron-k8-pro",
    description:
      "Wireless mechanical keyboard with hot‑swappable switches, RGB backlight, and Mac/Windows keycap sets.",
    short_description: "Compact TKL with wireless and hot‑swap.",
    base_price: 129.0,
    image_url:
      "https://images.pexels.com/photos/1591060/pexels-photo-1591060.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      {
        value: "RGB / Hot‑swap",
        priceDelta: 0,
        stock: 50,
        description: "Fully customizable RGB with hot‑swappable switches.",
      },
    ],
    modifiers: [
      {
        name: "Switch Type",
        additional_price: 0,
        stock: 80,
        values: ["Red Linear", "Brown Tactile", "Blue Clicky"],
      },
      {
        name: "Keycaps",
        additional_price: 25,
        stock: 120,
        values: ["OEM ABS", "PBT Keycap Set"],
      },
    ],
  },
  {
    category_path: ["Electronics", "Computers", "Mice"],
    display_name: "Logitech MX Master 3S",
    name: "logitech-mx-master-3s",
    description:
      "Ergonomic wireless mouse with MagSpeed scrolling, multi‑device pairing and silent buttons for productivity.",
    short_description: "Ergonomic productivity powerhouse.",
    base_price: 99.99,
    image_url:
      "https://images.pexels.com/photos/5082553/pexels-photo-5082553.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      {
        value: "Standard Edition",
        priceDelta: 0,
        stock: 70,
        description: "Includes Logi Bolt receiver and USB‑C cable.",
      },
    ],
    modifiers: [
      {
        name: "Color",
        additional_price: 0,
        stock: 100,
        values: ["Graphite", "Pale Gray", "Black"],
      },
    ],
  },
  {
    category_path: ["Electronics", "Gaming", "Gaming Consoles"],
    display_name: "Sony PlayStation 5 Slim",
    name: "sony-playstation-5-slim",
    description:
      "Next‑gen gaming console with ray tracing, ultra‑fast SSD storage and immersive DualSense controller.",
    short_description: "4K gaming with ultra‑fast load times.",
    base_price: 499.99,
    image_url:
      "https://images.pexels.com/photos/4523032/pexels-photo-4523032.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      {
        value: "Disc Edition",
        priceDelta: 0,
        stock: 45,
        description: "Supports physical discs and digital games.",
      },
      {
        value: "Digital Edition",
        priceDelta: -50,
        stock: 40,
        description: "Digital‑only console without disc drive.",
      },
    ],
    modifiers: [
      {
        name: "Bundle",
        additional_price: 70,
        stock: 60,
        values: ["Extra DualSense Controller", "PS Plus 12‑Month"],
      },
    ],
  },
  {
    category_path: ["Electronics", "Gaming", "Gaming Consoles"],
    display_name: "Microsoft Xbox Series X",
    name: "microsoft-xbox-series-x",
    description:
      "Powerful gaming console with 12 teraflops of processing power, fast SSD and support for 4K 120 FPS gaming.",
    short_description: "4K powerhouse for Xbox and Game Pass.",
    base_price: 499.99,
    image_url:
      "https://images.pexels.com/photos/845266/pexels-photo-845266.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      {
        value: "1TB SSD",
        priceDelta: 0,
        stock: 50,
        description: "Standard 1TB internal SSD.",
      },
    ],
    modifiers: [
      {
        name: "Bundle",
        additional_price: 60,
        stock: 70,
        values: ["Game Pass Ultimate 6‑Month", "Extra Controller"],
      },
    ],
  },
  {
    category_path: ["Home and Kitchen Appliances", "Home Appliances", "Smart Home"],
    display_name: "Amazon Echo (4th Gen)",
    name: "amazon-echo-4th-gen",
    description:
      "Smart speaker with Alexa voice assistant, premium sound and built‑in smart home hub.",
    short_description: "Smart speaker for home automation.",
    base_price: 99.99,
    image_url:
      "https://images.pexels.com/photos/7164086/pexels-photo-7164086.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      {
        value: "Standard",
        priceDelta: 0,
        stock: 80,
        description: "Includes power adapter and quick start guide.",
      },
    ],
    modifiers: [
      {
        name: "Color",
        additional_price: 0,
        stock: 100,
        values: ["Charcoal", "Glacier White", "Twilight Blue"],
      },
    ],
  },
  {
    category_path: ["Home and Kitchen Appliances", "Home Appliances", "Smart Home"],
    display_name: "Google Nest Hub (2nd Gen)",
    name: "google-nest-hub-2nd-gen",
    description:
      "Smart display with Google Assistant, 7‑inch touchscreen and sleep tracking features for the bedroom.",
    short_description: "Control your smart home with a glance.",
    base_price: 99.99,
    image_url:
      "https://images.pexels.com/photos/4108584/pexels-photo-4108584.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      {
        value: "Standard",
        priceDelta: 0,
        stock: 70,
        description: "Includes power adapter and quick start guide.",
      },
    ],
    modifiers: [
      {
        name: "Color",
        additional_price: 0,
        stock: 90,
        values: ["Chalk", "Charcoal", "Sand", "Mist"],
      },
    ],
  },
  {
    category_path: ["Electronics", "Cameras", "Mirrorless Cameras"],
    display_name: "Canon EOS R6 Mark II",
    name: "canon-eos-r6-mark-ii",
    description:
      "Full‑frame mirrorless camera with fast autofocus, 4K60 video and excellent low‑light performance.",
    short_description: "Versatile hybrid camera for photo and video.",
    base_price: 2499.0,
    image_url:
      "https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      {
        value: "Body Only",
        priceDelta: 0,
        stock: 20,
        description: "Ideal for photographers upgrading from another Canon body.",
      },
      {
        value: "With RF 24‑105mm Lens",
        priceDelta: 600,
        stock: 16,
        description: "Versatile zoom lens kit for everyday shooting.",
      },
    ],
    modifiers: [
      {
        name: "Memory Card",
        additional_price: 59,
        stock: 150,
        values: ["128GB UHS‑II SDXC", "256GB UHS‑II SDXC"],
      },
      {
        name: "Extended Warranty",
        additional_price: 189,
        stock: 999,
        values: ["3 Years Protection"],
      },
    ],
  },
  {
    category_path: ["Electronics", "Cameras", "Vlogging Cameras"],
    display_name: "Sony ZV‑E10 Vlogging Camera",
    name: "sony-zv-e10",
    description:
      "Compact interchangeable‑lens camera designed for content creators with fast autofocus and excellent video quality.",
    short_description: "Made for vlogging and streaming.",
    base_price: 799.99,
    image_url:
      "https://images.pexels.com/photos/712898/pexels-photo-712898.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      {
        value: "Body Only",
        priceDelta: 0,
        stock: 30,
        description: "Use with your existing Sony E‑mount lenses.",
      },
      {
        value: "With 16‑50mm Lens",
        priceDelta: 200,
        stock: 24,
        description: "Lightweight zoom lens kit for run‑and‑gun shooting.",
      },
    ],
    modifiers: [
      {
        name: "Microphone Kit",
        additional_price: 129,
        stock: 80,
        values: ["Shotgun Mic", "Wireless Lavalier"],
      },
    ],
  },
  {
    category_path: ["Electronics", "Accessories", "Power Banks"],
    display_name: "Anker PowerCore 20K Power Bank",
    name: "anker-powercore-20k",
    description:
      "High‑capacity 20,000 mAh portable charger with fast charging and multiple USB‑A/USB‑C outputs.",
    short_description: "Reliable fast‑charging on the go.",
    base_price: 59.99,
    image_url:
      "https://images.pexels.com/photos/4042802/pexels-photo-4042802.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      {
        value: "20,000 mAh",
        priceDelta: 0,
        stock: 120,
        description: "Enough capacity to charge most phones multiple times.",
      },
    ],
    modifiers: [
      {
        name: "Cable Bundle",
        additional_price: 19,
        stock: 150,
        values: ["USB‑C + Lightning", "USB‑C + USB‑C"],
      },
    ],
  },
  {
    category_path: ["Electronics", "Accessories", "Storage"],
    display_name: "Samsung T9 Portable SSD",
    name: "samsung-t9-ssd",
    description:
      "Portable NVMe SSD with USB‑C, blazing fast read/write speeds and compact, rugged design.",
    short_description: "High‑speed portable storage.",
    base_price: 129.99,
    image_url:
      "https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      {
        value: "1TB",
        priceDelta: 0,
        stock: 65,
        description: "Fast external storage for everyday use.",
      },
      {
        value: "2TB",
        priceDelta: 70,
        stock: 45,
        description: "Twice the capacity for creators and pros.",
      },
      {
        value: "4TB",
        priceDelta: 210,
        stock: 24,
        description: "Massive storage for 4K/8K video projects.",
      },
    ],
    modifiers: [
      {
        name: "Color",
        additional_price: 0,
        stock: 100,
        values: ["Black", "Blue", "Beige"],
      },
    ],
  },
  {
    category_path: ["Home and Kitchen Appliances", "Kitchen Appliances", "Air Fryers"],
    display_name: "Philips Digital Air Fryer XL",
    name: "philips-air-fryer-xl",
    description:
      "Crispy results with little to no oil. Large basket capacity with digital presets for fries, chicken and snacks.",
    short_description: "Crispy meals with less oil.",
    base_price: 179.99,
    image_url:
      "https://images.pexels.com/photos/4110267/pexels-photo-4110267.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      { value: "4.1L", priceDelta: 0, stock: 55, description: "Great for couples and small families." },
      { value: "6.2L", priceDelta: 40, stock: 35, description: "Bigger capacity for meal prep and families." },
    ],
    modifiers: [
      { name: "Color", additional_price: 0, stock: 120, values: ["Black", "White"] },
      { name: "Warranty Upgrade", additional_price: 29, stock: 999, values: ["2 Years Extended"] },
    ],
  },
  {
    category_path: ["Home and Kitchen Appliances", "Kitchen Appliances", "Microwave Ovens"],
    display_name: "Samsung 28L Convection Microwave",
    name: "samsung-28l-convection-microwave",
    description:
      "Convection microwave with grill and pre‑set cooking modes. Even heating for baking, roasting and reheating.",
    short_description: "Convection + grill for everyday cooking.",
    base_price: 219.99,
    image_url:
      "https://images.pexels.com/photos/5825576/pexels-photo-5825576.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      { value: "28L", priceDelta: 0, stock: 40, description: "Ideal capacity for daily home cooking." },
      { value: "32L", priceDelta: 35, stock: 28, description: "More space for large dishes and trays." },
    ],
    modifiers: [
      { name: "Finish", additional_price: 0, stock: 120, values: ["Black", "Silver"] },
      { name: "Installation", additional_price: 15, stock: 999, values: ["Countertop Setup"] },
    ],
  },
  {
    category_path: ["Home and Kitchen Appliances", "Home Appliances", "Vacuum Cleaners"],
    display_name: "Dyson V11 Cordless Vacuum",
    name: "dyson-v11-cordless-vacuum",
    description:
      "Powerful cordless vacuum with intelligent suction, multiple attachments and HEPA filtration for deep cleaning.",
    short_description: "Cordless power for deep cleaning.",
    base_price: 499.99,
    image_url:
      "https://images.pexels.com/photos/4239007/pexels-photo-4239007.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      { value: "Standard", priceDelta: 0, stock: 35, description: "Includes multi‑surface and crevice tools." },
      { value: "Animal Kit", priceDelta: 70, stock: 22, description: "Extra tools for pet hair and upholstery." },
    ],
    modifiers: [
      { name: "Color", additional_price: 0, stock: 80, values: ["Nickel/Blue", "Nickel/Purple"] },
      { name: "Warranty Upgrade", additional_price: 49, stock: 999, values: ["3 Years Extended"] },
    ],
  },
  {
    category_path: ["Fashion", "Men", "T-Shirts"],
    display_name: "Premium Cotton Crew Neck T‑Shirt",
    name: "premium-cotton-crew-neck-tshirt",
    description:
      "Soft, breathable 100% cotton crew neck t‑shirt with durable stitching and a comfortable regular fit.",
    short_description: "Everyday essential cotton tee.",
    base_price: 19.99,
    image_url:
      "https://images.pexels.com/photos/428340/pexels-photo-428340.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      { value: "Single Pack", priceDelta: 0, stock: 200, description: "One premium tee." },
      { value: "3‑Pack", priceDelta: 25, stock: 120, description: "Value pack for everyday rotation." },
    ],
    modifiers: [
      { name: "Size", additional_price: 0, stock: 500, values: ["S", "M", "L", "XL", "XXL"] },
      { name: "Color", additional_price: 0, stock: 500, values: ["Black", "White", "Navy", "Gray"] },
    ],
  },
  {
    category_path: ["Fashion", "Women", "Dresses"],
    display_name: "Floral Summer Midi Dress",
    name: "floral-summer-midi-dress",
    description:
      "Lightweight midi dress with floral print, adjustable waist and breathable fabric for warm weather.",
    short_description: "Easy, breezy summer style.",
    base_price: 39.99,
    image_url:
      "https://images.pexels.com/photos/1488463/pexels-photo-1488463.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      { value: "Regular Fit", priceDelta: 0, stock: 140, description: "Classic fit with midi length." },
      { value: "Petite Fit", priceDelta: 0, stock: 80, description: "Adjusted length for petite sizes." },
    ],
    modifiers: [
      { name: "Size", additional_price: 0, stock: 400, values: ["XS", "S", "M", "L", "XL"] },
      { name: "Color", additional_price: 0, stock: 200, values: ["Blue Floral", "Red Floral", "Yellow Floral"] },
    ],
  },
  {
    category_path: ["Beauty & Personal Care", "Skincare", "Moisturizers"],
    display_name: "Hydrating Hyaluronic Acid Moisturizer",
    name: "hyaluronic-acid-moisturizer",
    description:
      "Daily lightweight moisturizer with hyaluronic acid for long‑lasting hydration and smoother skin texture.",
    short_description: "Lightweight daily hydration.",
    base_price: 24.99,
    image_url:
      "https://images.pexels.com/photos/6621462/pexels-photo-6621462.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      { value: "50ml", priceDelta: 0, stock: 180, description: "Travel‑friendly size for daily use." },
      { value: "100ml", priceDelta: 12, stock: 120, description: "Better value for long‑term use." },
    ],
    modifiers: [
      { name: "Skin Type", additional_price: 0, stock: 999, values: ["Normal", "Dry", "Oily", "Combination"] },
    ],
  },
  {
    category_path: ["Sports & Outdoors", "Fitness", "Yoga Mats"],
    display_name: "Non‑Slip Yoga Mat 6mm",
    name: "non-slip-yoga-mat-6mm",
    description:
      "High‑grip, non‑slip yoga mat with 6mm cushioning for comfort during yoga, pilates and home workouts.",
    short_description: "Grip + comfort for daily practice.",
    base_price: 29.99,
    image_url:
      "https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      { value: "Standard (183×61cm)", priceDelta: 0, stock: 160, description: "Fits most users comfortably." },
      { value: "Extra Long (200×68cm)", priceDelta: 10, stock: 90, description: "More space for taller users." },
    ],
    modifiers: [
      { name: "Color", additional_price: 0, stock: 300, values: ["Black", "Purple", "Teal", "Pink"] },
      { name: "Carry Strap", additional_price: 6, stock: 500, values: ["Yes"] },
    ],
  },
  {
    category_path: ["Books & Stationery", "Books", "Business"],
    display_name: "The Startup Playbook (Paperback)",
    name: "the-startup-playbook-paperback",
    description:
      "Practical guidance on building products, finding customers and growing sustainably with actionable frameworks.",
    short_description: "Actionable startup frameworks.",
    base_price: 14.99,
    image_url:
      "https://images.pexels.com/photos/159866/books-book-pages-read-literature-159866.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      { value: "Paperback", priceDelta: 0, stock: 220, description: "Affordable and easy to carry." },
      { value: "Hardcover", priceDelta: 10, stock: 90, description: "Premium binding for long‑term reading." },
    ],
    modifiers: [
      { name: "Gift Wrap", additional_price: 3, stock: 999, values: ["Yes"] },
    ],
  },
  {
    category_path: ["Toys & Games", "Kids", "Building Blocks"],
    display_name: "Creative Building Blocks Set (500 pcs)",
    name: "creative-building-blocks-500",
    description:
      "Colorful building blocks set to inspire creativity and motor skills. Includes storage box and idea booklet.",
    short_description: "500‑piece creative block set.",
    base_price: 34.99,
    image_url:
      "https://images.pexels.com/photos/2079249/pexels-photo-2079249.jpeg?auto=compress&cs=tinysrgb&w=1200",
    portions: [
      { value: "500 Pieces", priceDelta: 0, stock: 110, description: "Includes storage box and booklet." },
      { value: "800 Pieces", priceDelta: 15, stock: 70, description: "More pieces for bigger builds." },
    ],
    modifiers: [
      { name: "Age Group", additional_price: 0, stock: 999, values: ["3+", "6+", "8+"] },
    ],
  },
];

export const products = (() => {
  const products = [];
  const targetCount = 200;

  // Spread base products evenly and create realistic variants
  let variantIndex = 1;

  while (products.length < targetCount) {
    for (const base of baseProducts) {
      if (products.length >= targetCount) break;

      const suffix = variantIndex === 1 ? "" : `-${variantIndex}`;

      const name = `${base.name}${suffix}`;
      const display_name =
        variantIndex === 1 ? base.display_name : `${base.display_name} Variant ${variantIndex}`;

      // Slightly vary the base price (+/- up to 10%)
      const variationFactor = 1 + ((variantIndex % 5) - 2) * 0.02; // from -4% to +4%
      const price = Math.round(base.base_price * variationFactor * 100) / 100;

      // Clone portions with adjusted prices and varied stock
      const portions = base.portions.map((p, idx) => {
        const portionPrice = price + p.priceDelta;
        const stockVariation = ((variantIndex + idx) % 4) * 5; // 0,5,10,15
        return {
          value: p.value,
          price: Math.round(portionPrice * 100) / 100,
          stock: Math.max(5, (p.stock ?? 20) - stockVariation),
          description: p.description,
        };
      });

      // Modifiers copied as‑is; stock slightly varied
      const modifiers = base.modifiers.map((m, idx) => ({
        name: m.name,
        values: [...m.values],
        stock: (m.stock ?? 50) - ((variantIndex + idx) % 3) * 5,
        additional_price: m.additional_price ?? 0,
      }));

      products.push({
        category_path: [...base.category_path],
        main_category: base.category_path[0],
        sub_category: base.category_path[1],
        leaf_category: base.category_path[2],
        display_name,
        name,
        description: base.description,
        short_description: base.short_description,
        price,
        image_url: base.image_url,
        portions,
        modifiers,
      });
    }
    variantIndex += 1;
  }

  return products;
})();

