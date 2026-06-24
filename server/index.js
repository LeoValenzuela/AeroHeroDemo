const express = require('express');
const cors = require('cors');
const products = require('./products.json');

const app = express();
app.use(cors());
const port = 3001;

// A simple mapping of keywords to style tags
const styleTagMapping = {
    "minimalist": ["minimalist", "basics"],
    "streetwear": ["streetwear", "edgy", "sporty", "urban"],
    "summer": ["summer", "beach", "bohemian"],
    "beach": ["summer", "beach", "bohemian"],
    "business": ["business casual", "formal", "elegant"],
    "casual": ["casual", "basics"],
    "women": ["feminine"],
};

app.get('/api/recommendations', (req, res) => {
    const query = req.query.q.toLowerCase();
    const queryTags = Object.keys(styleTagMapping)
        .filter(keyword => query.includes(keyword))
        .flatMap(keyword => styleTagMapping[keyword]);

    const uniqueQueryTags = [...new Set(queryTags)];

    if (uniqueQueryTags.length === 0) {
        return res.json({ outfits: [], individual_products: [] });
    }

    // Score products based on tag matches and promotion
    const scoredProducts = products.map(product => {
        const matchScore = product.style_tags.reduce((score, tag) => {
            return score + (uniqueQueryTags.includes(tag) ? 1 : 0);
        }, 0);

        const promotionBoost = product.promotion_flag ? 0.5 : 0;
        const finalScore = matchScore + promotionBoost;

        return { ...product, score: finalScore };
    }).filter(product => product.score > 0)
      .sort((a, b) => b.score - a.score);

    // Create outfits
    const outfits = [];
    const usedProductIds = new Set();

    const tops = scoredProducts.filter(p => p.category === 'top');
    const bottoms = scoredProducts.filter(p => p.category === 'bottom');
    const shoes = scoredProducts.filter(p => p.category === 'shoes');
    const accessories = scoredProducts.filter(p => p.category === 'accessory');

    for (let i = 0; i < 3; i++) { // Generate up to 3 outfits
        const top = tops[i % tops.length];
        const bottom = bottoms[i % bottoms.length];
        const shoe = shoes[i % shoes.length];
        const accessory = accessories[i % accessories.length];

        if (top && bottom && shoe) {
            const outfit = {
                items: [top, bottom, shoe],
                original_price: top.price + bottom.price + shoe.price,
                discounted_price: (top.price + bottom.price + shoe.price) * 0.85, // 15% discount
            };

            if (accessory) {
                outfit.items.push(accessory);
                outfit.original_price += accessory.price;
                outfit.discounted_price = outfit.original_price * 0.8; // 20% discount with accessory
            }
            
            // Ensure products in an outfit are unique
            const outfitProductIds = new Set(outfit.items.map(item => item.id));
            if (outfitProductIds.size === outfit.items.length) {
                outfits.push(outfit);
                outfit.items.forEach(item => usedProductIds.add(item.id));
            }
        }
    }

    // Recommend individual products that are not in outfits
    const individualProducts = scoredProducts.filter(p => !usedProductIds.has(p.id));

    res.json({ outfits, individual_products: individualProducts });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});