export function parseItemsFromText(text) {
  console.log("🧾 Starting to parse receipt text...");
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

  // sample food database with expiry for ocr fallback
  const knownExpiryDays = {
    milk: 7, bread: 4, cheese: 14, yogurt: 10, apples: 21, bananas: 5,
    lettuce: 5, tomatoes: 6, carrots: 30, onions: 30, potatoes: 60, eggs: 21,
    chicken: 3, beef: 5, fish: 2, butter: 60, cereal: 180, rice: 365,
    pasta: 365, canned_tuna: 1095, peanut_butter: 180, jam: 180,
    orange_juice: 7, frozen_pizza: 90, frozen_vegetables: 180,
    garlic: 90, broccoli: 7, sauce: 365, oil: 365, salt: 1095, sesame: 365, 
    avocado: 5, peppers: 14, onion: 30, potato: 60, banana: 5, apple: 21, tomato: 6, carrot: 30, egg: 21
  };

  const stopWords = ["total", "subtotal", "tax", "change", "cash", "visa", "mastercard", "amex"];
  let items = [];

  for (const line of lines) {
    const lower = line.toLowerCase().trim();
    
    console.log(`🔍 Processing line: "${line}"`);
    
    // Skip receipt footer and UI elements
    if (stopWords.some(word => lower.includes(word))) {
      console.log(`⏭️ Skipping footer word: ${line}`);
      continue;
    }
    if (lower.includes('current shelf') || lower.includes('extracted text') || 
        lower.includes('skip day') || lower.includes('walmart') || lower.includes('save money')) {
      console.log(`⏭️ Skipping UI/header: ${line}`);
      continue;
    }
    
    // Skip non-food lines
    if (lower.includes('mgr:') || lower.includes('st#') || lower.match(/^\d{3}-\d{3}-\d{4}/) ||
        lower.includes('mobile al')) {
      console.log(`⏭️ Skipping store info: ${line}`);
      continue;
    }

    // Extract item name - handle various receipt formats
    let itemName = '';
    
    // Pattern 1: "ITEM_NAME 001234567890 F 5.48 I"
    let match = line.match(/^([A-Z][A-Z\s]+?)\s+\d{10,}/i);
    if (match) {
      itemName = match[1].toLowerCase().trim();
    }
    
    // Pattern 2: Weight items "2.52 lb @ something"
    if (!itemName) {
      match = line.match(/^\d+\.\d+\s+lb.*?([A-Z\s]{3,})/i);
      if (match) {
        itemName = match[1].toLowerCase().trim();
      }
    }
    
    // Pattern 3: Simple name at start
    if (!itemName) {
      match = line.match(/^([A-Z][A-Z\s]{2,})/);
      if (match) {
        itemName = match[0].toLowerCase().trim();
      }
    }

    if (itemName) {
      // Clean up the name
      itemName = itemName.replace(/\s+/g, ' ').trim();
      console.log(`🔤 Extracted name: "${itemName}"`);
      
      // Check for matches
      let expiryDays = null;
      let matchedKey = null;
      
      // 1. Try OCR error correction first
      let correctedName = itemName;
      for (const [corrupt, correct] of Object.entries(ocrCorrections)) {
        if (itemName.includes(corrupt)) {
          correctedName = correct;
          console.log(`🔧 OCR correction: "${itemName}" → "${correct}"`);
          break;
        }
      }
      
      // 2. Try exact compound name mapping (with corrected name)
      if (nameMapping[correctedName]) {
        matchedKey = nameMapping[correctedName];
        expiryDays = knownExpiryDays[matchedKey];
        console.log(`🗂️ Compound mapping: "${correctedName}" → "${matchedKey}"`);
      }
      
      // 3. Try direct lookup
      if (!expiryDays && knownExpiryDays[correctedName]) {
        matchedKey = correctedName;
        expiryDays = knownExpiryDays[correctedName];
        console.log(`📝 Direct match: "${correctedName}"`);
      }
      
      // 4. Try each word in the name
      if (!expiryDays) {
        const words = correctedName.split(' ');
        for (const word of words) {
          if (knownExpiryDays[word]) {
            matchedKey = word;
            expiryDays = knownExpiryDays[word];
            console.log(`🔤 Word match: "${word}" from "${correctedName}"`);
            break;
          }
        }
      }
      
      // 5. Try substring matching
      if (!expiryDays) {
        for (const [key, days] of Object.entries(knownExpiryDays)) {
          if (correctedName.includes(key) || key.includes(correctedName)) {
            matchedKey = key;
            expiryDays = days;
            console.log(`🎯 Substring match: "${correctedName}" contains "${key}"`);
            break;
          }
        }
      }

      if (expiryDays) {
        // Extract quantity (default to 1)
        let quantity = 1;
        const qtyMatch = line.match(/(\d+(?:\.\d+)?)\s*lb/i);
        if (qtyMatch) {
          quantity = Math.ceil(parseFloat(qtyMatch[1]));
        }

        items.push({
          name: itemName,
          quantity,
          timeElapsed: 0,
          expiresAt: expiryDays
        });
        
        console.log(`✅ ADDED: "${itemName}" → ${matchedKey} (expires in ${expiryDays} days)`);
      } else {
        console.log(`❌ No match found for: "${itemName}"`);
      }
    }
  }

  console.log(`🧾 Total items found: ${items.length}`);
  return items;
}
