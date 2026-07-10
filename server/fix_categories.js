const fs = require('fs').promises;
const path = require('path');

const masterProductsPath = path.join(__dirname, '..', 'client', 'src', 'aero-master-products.json');

const topKeywords = ['shirt', 'tee', 'tank', 'top', 'cami', 'polo', 'henley', 'hoodie', 'sweatshirt', 't-shirt'];
const bottomKeywords = ['jeans', 'pants', 'shorts', 'skirt', 'jeggings', 'jogger', 'sweatpants', 'legging'];

async function fixCategories() {
  try {
    const data = await fs.readFile(masterProductsPath, 'utf8');
    const products = JSON.parse(data);

    let updatedCount = 0;

    const updatedProducts = products.map(product => {
      if (product.category === 'clearance-girls-obsolete' || product.category === 'guys' || product.category === 'girls') {
        const name = product.name.toLowerCase();
        const type = product.type.toLowerCase();

        let isTop = false;
        let isBottom = false;

        for (const keyword of topKeywords) {
          if (name.includes(keyword) || type.includes(keyword)) {
            isTop = true;
            break;
          }
        }

        if (!isTop) {
          for (const keyword of bottomKeywords) {
            if (name.includes(keyword) || type.includes(keyword)) {
              isBottom = true;
              break;
            }
          }
        }

        if (isTop) {
          product.category = `${product.category}-tops`;
          updatedCount++;
        } else if (isBottom) {
          product.category = `${product.category}-bottoms`;
          updatedCount++;
        }
      }
      return product;
    });

    await fs.writeFile(masterProductsPath, JSON.stringify(updatedProducts, null, 2));
    console.log(`Successfully updated ${updatedCount} product categories in aero-master-products.json`);

  } catch (error) {
    console.error('Error fixing product categories:', error);
  }
}

fixCategories();
