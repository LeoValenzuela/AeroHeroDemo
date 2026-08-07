# AeroHero Fashion Recommendation System Demo

This is a functional demo of a fashion e-commerce recommendation system. Users can search for a general style, and the system recommends individual products and complete outfits based on a mock product catalog using natural language.

## Features

- **Style-Based Search:** Instead of searching for specific items, users can describe a style (e.g., "minimalist streetwear," "summer beach outfit").
- **Outfit Recommendations:** The system bundles individual products into complete outfits.
- **Individual Product Recommendations:** The system also suggests individual products that match the desired style.
- **Bundle Discounts:** Outfits are offered at a discounted price to encourage users to buy the complete look.
- **Promoted Products:** Certain products can be marked as "Trending" and are more likely to be recommended.

## Tech Stack

- **Frontend:** React
- **Backend:** Node.js with Express
- **Data:** Static JSON file

## Getting Started

### Prerequisites

- Node.js and npm installed on your machine.

### Installation and Running the Demo

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/AeroHeroDemo.git
    cd AeroHeroDemo
    ```

2.  **Install client dependencies:**

    ```bash
    npm install --prefix client
    ```

3.  **Install server dependencies:**

    ```bash
    npm install --prefix server
    ```

4.  **Run the application:**
    From the `server` directory, run the `dev` script:

    ```bash
    npm run dev --prefix server
    ```

    This will start both the React development server for the frontend (on port 3000) and the Node.js backend server (on port 3001).

5.  **Open the application:**
    Open your browser and navigate to `http://localhost:3000` to view the application.

## How to Use

If you want to add more products: add products.json file then run "npm run vectorize" in the server directory now your new products will be added to the search

1.  Enter a style query in the search bar (e.g., "streetwear", "business casual for women").
2.  Press Enter.
3.  The application will display a list of recommended outfits and individual products based on your query.
