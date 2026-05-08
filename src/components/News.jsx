import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, Search } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

// BBC News RSS via rss2json.com — free, no API key, no CORS issues
const CATEGORIES = [
  { key: 'general',    label: 'General',    rss: 'https://feeds.bbci.co.uk/news/rss.xml' },
  { key: 'science',   label: 'Science',    rss: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml' },
  { key: 'technology',label: 'Technology', rss: 'https://feeds.bbci.co.uk/news/technology/rss.xml' },
];

const RSS2JSON = 'https://api.rss2json.com/v1/api.json';

export default function News() {
  const [allNews, setAllNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState('');

  const fetchNews = async (force = false) => {
    setLoading(true);
    setError(null);

    const cacheKey = 'all_news_data_v2';
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(`${cacheKey}_time`);

    if (!force && cachedData && cachedTime) {
      if (Date.now() - parseInt(cachedTime) < 15 * 60 * 1000) {
        setAllNews(JSON.parse(cachedData));
        setLoading(false);
        return;
      }
    }

    try {
      const fetchCategory = async ({ key, rss }) => {
        const url = `${RSS2JSON}?rss_url=${encodeURIComponent(rss)}`;
        const res = await axios.get(url);
        const items = res.data.items || [];
        return items.slice(0, 5).map(item => ({
          title:       item.title,
          source:      item.author || res.data.feed?.title || 'Google News',
          author:      item.author || 'Google News',
          date:        item.pubDate || new Date().toISOString(),
          image:       item.enclosure?.link || item.thumbnail || res.data.feed?.image || '',
          description: item.description?.replace(/<[^>]*>/g, '').slice(0, 180) || 'No description.',
          url:         item.link,
          category:    key,
        }));
      };

      const results = await Promise.all(CATEGORIES.map(c => fetchCategory(c)));
      const combined = results.flat();

      setAllNews(combined);
      localStorage.setItem(cacheKey, JSON.stringify(combined));
      localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
    } catch (err) {
      console.error(err);
      setError('Failed to load news. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNews(); }, []);

  const filteredNews = allNews.filter(n => {
    const q = search.toLowerCase();
    const matchesSearch = n.title?.toLowerCase().includes(q) || n.description?.toLowerCase().includes(q);
    const matchesCat = selectedCategory ? n.category === selectedCategory : true;
    return matchesSearch && matchesCat;
  });

  const categoryCounts = CATEGORIES.map(c => allNews.filter(n => n.category === c.key).length);

  const chartData = {
    labels: CATEGORIES.map(c => c.label),
    datasets: [{
      data: categoryCounts,
      backgroundColor: ['rgba(255,99,132,0.8)', 'rgba(54,162,235,0.8)', 'rgba(255,206,86,0.8)'],
      borderColor:     ['rgba(255,99,132,1)',   'rgba(54,162,235,1)',   'rgba(255,206,86,1)'],
      borderWidth: 1,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (_, elements) => {
      if (elements.length > 0) {
        const cat = CATEGORIES[elements[0].index].key;
        setSelectedCategory(prev => prev === cat ? null : cat);
      }
    },
    plugins: {
      legend: {
        position: 'right',
        labels: { color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151' },
      },
    },
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold">📰 Latest News</h2>
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search news..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button
            onClick={() => fetchNews(true)}
            className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 transition"
            title="Refresh News"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition ${!selectedCategory ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
        >All</button>
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => setSelectedCategory(prev => prev === c.key ? null : c.key)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${selectedCategory === c.key ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
          >{c.label}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doughnut Chart */}
        <div className="lg:col-span-1 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold mb-1 text-center">News Distribution</h3>
          <p className="text-xs text-gray-500 text-center mb-3">Click a slice to filter</p>
          <div className="h-[200px]">
            {allNews.length > 0
              ? <Doughnut data={chartData} options={chartOptions} />
              : <div className="flex items-center justify-center h-full text-sm text-gray-400">No data yet</div>
            }
          </div>
          {selectedCategory && (
            <div className="mt-3 text-center">
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-xs px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >✕ Clear: {CATEGORIES.find(c => c.key === selectedCategory)?.label}</button>
            </div>
          )}
        </div>

        {/* Articles */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse flex flex-col rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="h-28 bg-gray-300 dark:bg-gray-600 w-full"></div>
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-10 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
              <p className="font-medium mb-2">⚠️ {error}</p>
              <button onClick={() => fetchNews(true)} className="mt-2 px-4 py-2 bg-red-100 dark:bg-red-800 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition text-sm">
                Retry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[520px] overflow-y-auto pr-1">
              {filteredNews.slice(0, 10).map((article, i) => (
                <div key={i} className="flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition group">
                  {article.image ? (
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => e.target.style.display = 'none'}
                    />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl">📰</div>
                  )}
                  <div className="p-3 flex flex-col flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[10px] uppercase font-bold text-white px-2 py-0.5 rounded ${
                        article.category === 'science' ? 'bg-blue-500' : article.category === 'technology' ? 'bg-yellow-500' : 'bg-pink-500'
                      }`}>{article.category}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(article.date).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-bold text-sm mb-1 line-clamp-2 leading-snug">{article.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2 flex-1">{article.description}</p>
                    <div className="flex justify-between items-center mt-auto border-t border-gray-100 dark:border-gray-700 pt-2">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[100px]" title={article.source}>{article.source}</span>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold px-2 py-1 bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-gray-600 transition"
                      >Read More →</a>
                    </div>
                  </div>
                </div>
              ))}
              {filteredNews.length === 0 && (
                <p className="col-span-full text-center py-8 text-gray-500">No articles found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
