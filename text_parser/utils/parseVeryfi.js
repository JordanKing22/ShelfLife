// Parse items from Veryfi API response (structured data)
export function parseItemsFromVeryfi(veryfiData) {
  console.log("🧾 Starting to parse Veryfi receipt data...");
  
  if (!veryfiData || !veryfiData.line_items) {
    console.log("❌ No line items found in Veryfi data");
    return [];
  }

  // Expanded food database with better coverage (NO DUPLICATES)
  const knownExpiryDays = {
    // Dairy & Eggs
    milk: 7, almond_milk: 7, oat_milk: 10, soy_milk: 7, coconut_milk: 7,
    cheese: 14, cheddar: 21, mozzarella: 14, parmesan: 30, swiss: 21,
    yogurt: 10, greek_yogurt: 10, butter: 60, cream: 7, sour_cream: 7,
    eggs: 21, egg: 21,
    
    // Fruits
    apples: 21, apple: 21, bananas: 5, banana: 5, oranges: 14, orange: 14,
    grapes: 7, grape: 7, strawberries: 3, strawberry: 3, blueberries: 7, blueberry: 7,
    raspberries: 2, raspberry: 2, blackberries: 3, blackberry: 3,
    pineapple: 5, mango: 5, avocado: 5, avocados: 5,
    lemons: 21, lemon: 21, limes: 21, lime: 21, grapefruit: 14,
    pears: 14, pear: 14, peaches: 5, peach: 5, plums: 7, plum: 7,
    cherries: 7, cherry_fresh: 7, kiwi: 7, watermelon: 7, cantaloupe: 7, honeydew: 7,
    
    // Vegetables (FRESH - priority over frozen)
    lettuce: 5, spinach: 5, kale: 5, arugula: 3, mixed_greens: 5, greens: 5,
    tomatoes: 6, tomato: 6, roma_tomato: 6, cherry_tomatoes: 10, grape_tomatoes: 7,
    carrots: 30, carrot: 30, celery: 14, cucumber: 7, cucumbers: 7,
    onions: 30, onion: 30, green_onions: 30, red_onions: 30, yellow_onions: 30, white_onions: 30,
    potatoes: 60, potato: 60, sweet_potatoes: 30, russet_potatoes: 60, red_potatoes: 60,
    garlic: 90, ginger: 21, shallots: 30, shallot: 30,
    broccoli: 7, broc: 7, crowns: 7, cauliflower: 7, brussels: 7, sprouts: 7,
    peppers: 14, pepper: 14, bell_peppers: 14, jalapeno: 7, poblano: 7, serrano: 7,
    zucchini: 7, squash: 14, eggplant: 7, mushrooms: 7, mushroom: 7,
    asparagus: 3, artichoke: 7, corn_fresh: 3, peas_fresh: 5, beans_fresh: 5, green_beans: 5,
    cabbage: 14, bok_choy: 7, radish: 14, turnip: 21, beets: 21, beet: 21,
    
    // Meat & Seafood
    chicken: 3, breast: 3, thigh: 3, wings: 3, drumstick: 3, whole_chicken: 3,
    beef: 5, ground_beef: 5, steak: 5, roast: 5, chuck: 5, sirloin: 5,
    pork: 5, bacon: 7, ham: 7, sausage: 7, ribs: 3, chops: 3,
    turkey: 3, lamb: 3, veal: 3, duck: 3,
    fish: 2, salmon: 2, tuna_fresh: 2, cod: 2, tilapia: 2, mahi: 2, halibut: 2,
    shrimp: 2, crab: 2, lobster: 2, scallops: 2, mussels: 2, clams: 2,
    
    // Pantry Staples
    bread: 4, white_bread: 4, wheat_bread: 4, whole_grain: 4, sourdough: 4, rye: 4, bagels: 4, bagel: 4,
    tortillas: 7, tortilla: 7, pita: 7, naan: 7, crackers: 180, cracker: 180,
    cereal: 180, oats: 365, oatmeal: 365, granola: 180, muesli: 180,
    rice: 365, brown_rice: 365, wild_rice: 365, jasmine: 365, basmati: 365, arborio: 365,
    pasta: 365, spaghetti: 365, penne: 365, fusilli: 365, rigatoni: 365, linguine: 365,
    quinoa: 365, barley: 365, bulgur: 365, couscous: 365, farro: 365,
    flour: 365, sugar: 365, brown_sugar: 365, powdered_sugar: 365, honey: 1095, maple_syrup: 365, syrup: 365,
    salt: 1095, black_pepper: 1095, spices: 1095, herbs: 365, vanilla: 1095, extract: 1095,
    
    // Oils & Condiments
    oil: 365, olive_oil: 365, vegetable_oil: 365, canola_oil: 365, coconut_oil: 365, sesame_oil: 365, avocado_oil: 365,
    vinegar: 1095, balsamic: 1095, apple_cider: 1095, white_vinegar: 1095, red_wine_vinegar: 1095, wine_vinegar: 1095,
    sauce: 365, soy_sauce: 365, hot_sauce: 365, barbecue: 365, worcestershire: 1095, fish_sauce: 365,
    ketchup: 365, mustard: 365, mayo: 60, mayonnaise: 60, ranch: 60, italian_dressing: 60,
    peanut_butter: 180, almond_butter: 180, jam: 180, jelly: 180, preserves: 180,
    
    // Canned & Jarred
    canned: 365, canned_tomatoes: 365, canned_beans: 365, canned_corn: 365, canned_peas: 365, canned_carrots: 365,
    tuna_canned: 1095, salmon_canned: 1095, chicken_canned: 1095, beef_canned: 1095, soup: 730, broth: 730, stock: 730,
    pickles: 365, olives: 365, capers: 365, sundried: 365, artichokes_jarred: 365,
    
    // Frozen (clearly marked as frozen)
    frozen: 180, frozen_vegetables: 180, frozen_fruits: 180, frozen_berries: 180, frozen_pizza: 90, frozen_waffles: 90,
    ice_cream: 90, frozen_yogurt: 90, frozen_peas: 180, frozen_corn: 180, frozen_broccoli: 180, frozen_spinach: 180,
    
    // Beverages
    juice: 7, orange_juice: 7, apple_juice: 7, cranberry_juice: 14, grape_juice: 7, pomegranate: 7,
    coffee: 365, tea: 365, soda: 180, water: 365, sparkling_water: 365, coconut_water: 14,
    beer: 90, wine: 365, champagne: 365,
    
    // Snacks & Sweets  
    chips: 60, pretzels: 180, popcorn: 180, nuts: 180, almonds: 180,
    walnuts: 180, pecans: 180, cashews: 180, pistachios: 180, peanuts: 180,
    chocolate: 365, candy: 365, cookies: 30, cake: 7, pie: 7, muffins: 7, donuts: 3,
    
    // Baking
    baking_powder: 365, baking_soda: 365, yeast: 365, cornstarch: 365, cocoa: 365,
    
    // Fresh Herbs
    basil: 7, cilantro: 7, parsley: 7, mint: 7, rosemary: 14, thyme: 14, oregano: 14, sage: 14,
    
    // International/Specialty
    tofu: 7, tempeh: 7, seitan: 7, kimchi: 14, miso: 365, tahini: 365, hummus: 7,
    curry_paste: 365, garam_masala: 365, cumin: 365, turmeric: 365,
    
    // Items from common receipts
    tarts: 180, best: 21, organic: 7, fresh: 7, natural: 7, free_range: 7, grass_fed: 7,
    
    // Generic categories
    produce: 7, meat: 5, dairy: 7, bakery: 4, deli: 3, seafood: 2
  };

  // Special mappings for compound names and brand variations
  const nameMapping = {
    'green onions': 'green_onions',
    'broc crowns': 'broccoli', 
    'broccoli crowns': 'broccoli',
    'sweet tarts': 'tarts',
    'avocado oil': 'avocado_oil',
    'sesame oil': 'sesame_oil',
    'soy sauce': 'soy_sauce',
    'egg best': 'eggs',
    'organic milk': 'milk',
    'ground beef': 'ground_beef',
    'chicken breast': 'breast',
    'bell pepper': 'bell_peppers',
    'red bell pepper': 'red_peppers',
    'green bell pepper': 'peppers',
    'roma tomato': 'roma_tomato',
    'organic bananas': 'bananas',
    'fresh strawberries': 'strawberries',
    'ice cream': 'ice_cream',
    'peanut butter': 'peanut_butter',
    'almond butter': 'almond_butter',
    'olive oil': 'olive_oil',
    'coconut oil': 'coconut_oil',
    'apple juice': 'apple_juice',
    'orange juice': 'orange_juice',
    'greek yogurt': 'greek_yogurt',
    'whole milk': 'milk',
    'skim milk': 'milk',
    '2% milk': 'milk',
    'brown rice': 'brown_rice',
    'white rice': 'rice',
    'whole wheat bread': 'wheat_bread',
    'sourdough bread': 'sourdough',
    'cherry tomatoes': 'cherry_tomatoes',
    'grape tomatoes': 'grape_tomatoes',
    'sweet potatoes': 'sweet_potatoes',
    'red potatoes': 'red_potatoes',
    'russet potatoes': 'russet_potatoes',
    'baby carrots': 'carrots',
    'mini carrots': 'carrots',
    'mixed greens': 'mixed_greens',
    'spring mix': 'mixed_greens',
    'romaine lettuce': 'lettuce',
    'iceberg lettuce': 'lettuce',
    'baby spinach': 'spinach',
    'frozen vegetables': 'frozen_vegetables',
    'frozen berries': 'frozen_berries',
    'canned tomatoes': 'canned_tomatoes',
    'diced tomatoes': 'canned_tomatoes',
    'crushed tomatoes': 'canned_tomatoes',
    'tomato sauce': 'sauce',
    'pasta sauce': 'sauce',
    'marinara sauce': 'sauce'
  };

  let items = [];

  for (const lineItem of veryfiData.line_items) {
    console.log(`🔍 Processing Veryfi line item:`, lineItem);
    
    const itemName = (lineItem.description || lineItem.name || '').toLowerCase().trim();
    const quantity = lineItem.quantity || 1;
    const price = lineItem.total || lineItem.price || 0;
    
    if (!itemName || itemName.length < 2) {
      console.log(`⏭️ Skipping empty/short item name: "${itemName}"`);
      continue;
    }

    console.log(`🔤 Processing item: "${itemName}" (qty: ${quantity}, price: $${price})`);
    
    // Check for matches
    let expiryDays = null;
    let matchedKey = null;
    
    // 1. Try exact compound name mapping
    if (nameMapping[itemName]) {
      matchedKey = nameMapping[itemName];
      expiryDays = knownExpiryDays[matchedKey];
      console.log(`🗂️ Compound mapping: "${itemName}" → "${matchedKey}"`);
    }
    
    // 2. Try direct lookup
    if (!expiryDays && knownExpiryDays[itemName]) {
      matchedKey = itemName;
      expiryDays = knownExpiryDays[itemName];
      console.log(`📝 Direct match: "${itemName}"`);
    }
    
    // 3. Try each word in the name
    if (!expiryDays) {
      const words = itemName.split(/[\s,-]+/); // Split on space, comma, dash
      for (const word of words) {
        const cleanWord = word.replace(/[^a-z]/g, '').trim();
        if (cleanWord.length >= 3 && knownExpiryDays[cleanWord]) {
          matchedKey = cleanWord;
          expiryDays = knownExpiryDays[cleanWord];
          console.log(`🔤 Word match: "${cleanWord}" from "${itemName}"`);
          break;
        }
      }
    }
    
    // 4. Try substring matching
    if (!expiryDays) {
      for (const [key, days] of Object.entries(knownExpiryDays)) {
        if (key.length >= 4 && (itemName.includes(key) || key.includes(itemName))) {
          matchedKey = key;
          expiryDays = days;
          console.log(`🎯 Substring match: "${itemName}" contains "${key}"`);
          break;
        }
      }
    }

    if (expiryDays) {
      items.push({
        name: itemName,
        quantity: Math.round(quantity),
        timeElapsed: 0,
        expiresAt: expiryDays
      });
      
      console.log(`✅ ADDED: "${itemName}" → ${matchedKey} (expires in ${expiryDays} days, qty: ${quantity})`);
    } else {
      console.log(`❌ No match found for: "${itemName}"`);
    }
  }

  console.log(`🧾 Total items found: ${items.length} out of ${veryfiData.line_items.length} line items`);
  return items;
} 