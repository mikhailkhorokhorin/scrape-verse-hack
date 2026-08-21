const products = [
  ['01', 'Ceramic pour-over dripper', '18.00', '4.4'],
  ['02', 'Gooseneck kettle, 0.9L', '54.50', '4.8'],
  ['03', 'Burr grinder, hand crank', '72.00', '4.1'],
  ['04', 'Paper filters, 100 pack', '6.25', '4.6'],
  ['05', 'Double-wall glass, 250ml', '12.90', '3.9'],
  ['06', 'Scale with timer', '39.00', '4.5'],
  ['07', 'Storage tin, 500g', '15.75', '4.2'],
  ['08', 'Milk pitcher, 600ml', '22.40', '4.0'],
  ['09', 'Espresso tamper, 58mm', '31.00', '4.7'],
  ['10', 'Cleaning brush set', '9.80', '3.7'],
  ['11', 'Insulated carafe, 1L', '48.00', '4.3'],
  ['12', 'Cupping spoon, steel', '11.20', '4.9']
];

const variants = {
  healthy: {
    file: 'index.html',
    label: 'Healthy',
    param: 'healthy',
    tagline: 'Baseline markup. Every field extracts cleanly.',
    status: 'All selectors resolve. This is the contract the collector was built against.',
    effect: 'no damage',
    card(p) {
      const [id, title, price, rating] = p;
      return [
        `        <li class="product-card">`,
        `          <img class="product-image" src="img/${id}.svg" alt="${title}" width="240" height="180">`,
        `          <h2 class="product-title">${title}</h2>`,
        `          <p class="product-price">£${price}</p>`,
        `          <p class="product-rating">${rating} out of 5</p>`,
        `          <p class="product-stock">In stock</p>`,
        `        </li>`
      ].join('\n');
    }
  },
  renamed: {
    file: 'broken-renamed.html',
    label: 'Renamed',
    param: 'renamed',
    tagline: 'A redesign shipped. Class names moved. Selectors miss.',
    status: 'price and image selectors match nothing; rating moved into a data attribute.',
    effect: 'fields go DEAD',
    card(p) {
      const [id, title, price, rating] = p;
      return [
        `        <li class="product-card" data-rating="${rating}">`,
        `          <img class="thumb" src="img/${id}.svg" alt="${title}" width="240" height="180">`,
        `          <h2 class="product-title">${title}</h2>`,
        `          <p class="price-tag">£${price}</p>`,
        `          <p class="product-stock">In stock</p>`,
        `        </li>`
      ].join('\n');
    }
  },
  drifted: {
    file: 'broken-drifted.html',
    label: 'Drifted',
    param: 'drifted',
    tagline: 'Markup untouched. The values behind it rotted.',
    status: 'Every selector still resolves. Price is an em dash, rating is the string "undefined", image is a placeholder.',
    effect: 'fields stay full and LIE',
    card(p) {
      const [id, title] = p;
      return [
        `        <li class="product-card">`,
        `          <img class="product-image" src="placeholder.svg" alt="${title}" width="240" height="180">`,
        `          <h2 class="product-title">${title}</h2>`,
        `          <p class="product-price">—</p>`,
        `          <p class="product-rating">undefined</p>`,
        `          <p class="product-stock">In stock</p>`,
        `        </li>`
      ].join('\n');
    }
  }
};

module.exports = { products, variants };
