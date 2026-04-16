export const RESTAURANT_CATEGORIES = [
  "All",
  "Grill",
  "Fast Food",
  "Seafood",
  "Pizza",
  "Healthy",
];

export const RESTAURANTS = [
  {
    id: "r1",
    name: "Flame House Grill",
    image:
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&auto=format&fit=crop",
    description:
      "Charcoal grilled classics, premium burgers, and signature sauces.",
    category: "Grill",
    rating: 4.8,
    deliveryTime: 28,
    location: "Downtown",
    isOpen: true,
    promotion: "15% off on burgers",
  },
  {
    id: "r2",
    name: "Sea Breeze Kitchen",
    image:
      "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1200&auto=format&fit=crop",
    description:
      "Fresh seafood bowls, grilled salmon, and ocean-inspired meals.",
    category: "Seafood",
    rating: 4.6,
    deliveryTime: 34,
    location: "Marina District",
    isOpen: true,
    promotion: "Free drink on orders above $25",
  },
  {
    id: "r3",
    name: "Urban Slice",
    image:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&auto=format&fit=crop",
    description: "Wood-fired pizza, fresh pasta, and artisan desserts.",
    category: "Pizza",
    rating: 4.7,
    deliveryTime: 24,
    location: "Old Town",
    isOpen: true,
    promotion: "Buy 1 Get 1 on medium pizzas",
  },
  {
    id: "r4",
    name: "Quick Bites Express",
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&auto=format&fit=crop",
    description:
      "Fast food favorites, crispy chicken, wraps, and loaded fries.",
    category: "Fast Food",
    rating: 4.4,
    deliveryTime: 18,
    location: "City Center",
    isOpen: true,
    promotion: "Combo deals from $9.99",
  },
  {
    id: "r5",
    name: "Green Fork",
    image:
      "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1200&auto=format&fit=crop",
    description: "Healthy bowls, smoothies, and high-protein clean meals.",
    category: "Healthy",
    rating: 4.9,
    deliveryTime: 26,
    location: "North Park",
    isOpen: false,
    promotion: "20% off protein bowls",
  },
];

export const MARKETPLACE_PRODUCTS = [
  {
    id: "r1-p1",
    restaurantId: "r1",
    name: "Smoked Double Burger",
    description:
      "Two patties, smoked cheddar, caramelized onions, and house sauce.",
    price: 14.99,
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop",
    category: "Burgers",
  },
  {
    id: "r1-p2",
    restaurantId: "r1",
    name: "BBQ Beast Burger",
    description: "Beef patty, bacon jam, crispy onions, and smoky BBQ glaze.",
    price: 13.5,
    image:
      "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=800&auto=format&fit=crop",
    category: "Burgers",
  },
  {
    id: "r1-p3",
    restaurantId: "r1",
    name: "Charred Wings",
    description: "Eight flame-charred wings with sweet chili dip.",
    price: 10.75,
    image:
      "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=800&auto=format&fit=crop",
    category: "Starters",
  },
  {
    id: "r1-p4",
    restaurantId: "r1",
    name: "Iced Peach Tea",
    description: "Fresh brewed tea with peach infusion and lemon.",
    price: 3.99,
    image:
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&auto=format&fit=crop",
    category: "Drinks",
  },

  {
    id: "r2-p1",
    restaurantId: "r2",
    name: "Garlic Butter Salmon",
    description: "Pan-seared salmon served with lemon herb rice.",
    price: 18.95,
    image:
      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop",
    category: "Seafood",
  },
  {
    id: "r2-p2",
    restaurantId: "r2",
    name: "Crispy Calamari",
    description: "Golden fried calamari with tartar aioli.",
    price: 12.25,
    image:
      "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&auto=format&fit=crop",
    category: "Starters",
  },
  {
    id: "r2-p3",
    restaurantId: "r2",
    name: "Tuna Poke Bowl",
    description: "Ahi tuna, avocado, edamame, and sesame soy glaze.",
    price: 15.25,
    image:
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop",
    category: "Bowls",
  },
  {
    id: "r2-p4",
    restaurantId: "r2",
    name: "Sparkling Citrus",
    description: "House citrus soda with mint and orange slices.",
    price: 4.5,
    image:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop",
    category: "Drinks",
  },

  {
    id: "r3-p1",
    restaurantId: "r3",
    name: "Truffle Mushroom Pizza",
    description: "Truffle cream, mozzarella, mushrooms, and fresh basil.",
    price: 16.99,
    image:
      "https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?w=800&auto=format&fit=crop",
    category: "Pizza",
  },
  {
    id: "r3-p2",
    restaurantId: "r3",
    name: "Pepperoni Inferno",
    description: "Pepperoni, spicy honey drizzle, and fire-roasted peppers.",
    price: 15.75,
    image:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop",
    category: "Pizza",
  },
  {
    id: "r3-p3",
    restaurantId: "r3",
    name: "Creamy Alfredo Pasta",
    description: "Fettuccine pasta in parmesan alfredo sauce.",
    price: 13.99,
    image:
      "https://images.unsplash.com/photo-1645112411341-6c4fd023402c?w=800&auto=format&fit=crop",
    category: "Pasta",
  },
  {
    id: "r3-p4",
    restaurantId: "r3",
    name: "Italian Soda",
    description: "Refreshing sparkling soda with berry syrup.",
    price: 4.25,
    image:
      "https://images.unsplash.com/photo-1578712595423-836b5977ffb3?w=800&auto=format&fit=crop",
    category: "Drinks",
  },

  {
    id: "r4-p1",
    restaurantId: "r4",
    name: "Loaded Chicken Wrap",
    description: "Crispy chicken, lettuce, pickles, and chipotle mayo.",
    price: 9.99,
    image:
      "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&auto=format&fit=crop",
    category: "Wraps",
  },
  {
    id: "r4-p2",
    restaurantId: "r4",
    name: "Crispy Fries Box",
    description: "Seasoned fries with cheese and jalapeno sauce.",
    price: 6.5,
    image:
      "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=800&auto=format&fit=crop",
    category: "Sides",
  },
  {
    id: "r4-p3",
    restaurantId: "r4",
    name: "Mega Chicken Burger",
    description: "Fried chicken breast, slaw, and tangy ranch.",
    price: 11.5,
    image:
      "https://images.unsplash.com/photo-1606755962773-d324e9a13086?w=800&auto=format&fit=crop",
    category: "Burgers",
  },
  {
    id: "r4-p4",
    restaurantId: "r4",
    name: "Cola Float",
    description: "Classic cola with vanilla ice cream scoop.",
    price: 3.75,
    image:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop",
    category: "Drinks",
  },

  {
    id: "r5-p1",
    restaurantId: "r5",
    name: "Protein Power Bowl",
    description: "Grilled chicken, quinoa, greens, avocado, and tahini.",
    price: 14.25,
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop",
    category: "Bowls",
  },
  {
    id: "r5-p2",
    restaurantId: "r5",
    name: "Vegan Energy Salad",
    description: "Kale, chickpeas, beetroot, seeds, and citrus dressing.",
    price: 12.5,
    image:
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop",
    category: "Salads",
  },
  {
    id: "r5-p3",
    restaurantId: "r5",
    name: "Mango Green Smoothie",
    description: "Spinach, mango, banana, and coconut milk blend.",
    price: 6.25,
    image:
      "https://images.unsplash.com/photo-1553531889-56cc480ac5cb?w=800&auto=format&fit=crop",
    category: "Drinks",
  },
];
