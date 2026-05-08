# AstroDash - Real-Time ISS & News Dashboard 🚀📰

AstroDash is a modern, interactive web dashboard built with React and Vite. It provides real-time tracking of the International Space Station (ISS), the latest global news, and an integrated AI chatbot to answer your questions.

## ✨ Features

### 1. ISS Live Tracker 🌍
*   **Real-Time Positioning:** Automatically fetches the ISS coordinates every 15 seconds using the Open-Notify API.
*   **Interactive Map:** Visualizes the ISS's current location and its trajectory (last 30 positions) using `Leaflet.js`.
*   **Live Metrics:** Calculates real-time speed (km/h) using the Haversine formula and displays the nearest geographical location via Nominatim reverse geocoding.
*   **Speed Trend Chart:** An interactive Line chart (`Chart.js`) showing the ISS's recent speed variations over time.
*   **Astronauts Tracker:** Displays the number and names of humans currently aboard the ISS.

### 2. News Dashboard 📰
*   **Multi-Category Feed:** Pulls the latest news articles for General, Science, and Technology topics.
*   **Reliable Source:** Uses Google News RSS feeds converted via `rss2json.com`, ensuring completely free access with no CORS issues or API keys required.
*   **Interactive Visuals:** Features a Doughnut chart showing the distribution of loaded articles by category. Click a slice to filter the feed!
*   **Smart Caching:** News data is cached in `localStorage` for 15 minutes to optimize performance and reduce network calls.
*   **Search & Filter:** Easily search through headlines or filter by specific topics.

### 3. Dashboard AI Chatbot 🤖
*   **Context-Aware Assistant:** A floating chat interface that acts like an integrated AI assistant.
*   **Powered by Llama 3.2:** Integrates with the Hugging Face Inference API (`router.huggingface.co/v1`) using the `meta-llama/Llama-3.2-1B-Instruct:novita` model.
*   **Session Memory:** Maintains conversation history dynamically during your session.

### 4. Modern UI/UX 🎨
*   **Responsive Design:** Fully optimized for mobile, tablet, and desktop viewing.
*   **Dark Mode Support:** Seamlessly switch between Light and Dark themes (preference saved securely).
*   **Tailwind CSS:** Styled entirely using utility classes for a clean, premium, and highly customizable look.
*   **Loading States:** Skeleton loaders provide visual feedback during data fetching.

## 🛠️ Technology Stack

*   **Frontend:** React (Vite)
*   **Styling:** Tailwind CSS
*   **Maps:** Leaflet.js (`react-leaflet`)
*   **Charts:** Chart.js (`react-chartjs-2`)
*   **AI Integration:** OpenAI SDK (connected to Hugging Face router)
*   **Icons:** Lucide React
*   **HTTP Client:** Axios

## 🚀 Getting Started

### Prerequisites
*   Node.js installed on your machine.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/kumarroushan9898/Real-Time-ISS-News-Dashboard.git
    cd Real-Time-ISS-News-Dashboard
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the root directory and add your Hugging Face token for the AI chatbot:
    ```env
    VITE_AI_TOKEN=your_huggingface_api_token_here
    # Note: VITE_NEWS_API_KEY is no longer required as news is fetched via RSS
    ```

4.  **Start the development server:**
    ```bash
    npm run dev
    ```

5.  **Build for production:**
    ```bash
    npm run build
    ```

## 📦 Deployment (Vercel)

This project is optimized for deployment on Vercel.

1.  Push your code to a public GitHub repository.
2.  Log in to [Vercel](https://vercel.com/) and click **New Project**.
3.  Import your repository.
4.  In the project configuration, add your Environment Variables (`VITE_AI_TOKEN`).
5.  Click **Deploy**.

Alternatively, using Vercel CLI:
```bash
npm i -g vercel
vercel login
vercel --prod
```
