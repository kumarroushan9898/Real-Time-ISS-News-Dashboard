import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, Search, ArrowUpDown } from 'lucide-react';
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
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function fetchRSS(rss) {
  return axios.get(`${RSS2JSON}?rss_url=${encodeURIComponent(rss)}`);
}

function parseItems(items, feedTitle, key) {
  return items.slice(0, 5).map(item => ({
    title:       item.title || 'No Title',
    source:      feedTitle || 'BBC News',
    author:      item.author || feedTitle || 'BBC News',
    date:        item.pubDate || new Date().toISOString(),
    image:       item.thumbnail || item.enclosure?.link || '',
    description: (item.description || '').replace(/<[^>]*>/g, '').slice(0, 200) || 'No description.',
    url:         item.link || '#',
    category:    key,
  }));
}

export default function News({ onNewsLoaded }) {
  // Per-category state
  const [catData, setCatData] = useState({ general: [], science: [], technology: [] });
  const [catLoading, setCatLoading] = useState({ general: true, science: true, technology: true });
  const [catError, setCatError] = useState({ general: null, science: null, technology: null });

  const [activeTab, setActiveTab] = useState('general');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'source'

  const fetchCategory = async (cat, force = false) => {
    const cacheKey = `news_cat_${cat.key}`;
    const cachedTime = localStorage.getItem(`${cacheKey}_time`);
    const cachedData = localStorage.getItem(cacheKey);

    if (!force && cachedData && cachedTime && Date.now() - parseInt(cachedTime) < CACHE_TTL) {
      setCatData(prev => ({ ...prev, [cat.key]: JSON.parse(cachedData) }));
      setCatLoading(prev => ({ ...prev, [cat.key]: false }));
      return;
    }

    setCatLoading(prev => ({ ...prev, [cat.key]: true }));
    setCatError(prev => ({ ...prev, [cat.key]: null }));

    try {
      const res = await fetchRSS(cat.rss);
      const items = parseItems(res.data.items || [], res.data.feed?.title, cat.key);
      setCatData(prev => ({ ...prev, [cat.key]: items }));
      localStorage.setItem(cacheKey, JSON.stringify(items));
      localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
    } catch (err) {
      setCatError(prev => ({ ...prev, [cat.key]: 'Failed to load. ' + err.message }));
    } finally {
      setCatLoading(prev => ({ ...prev, [cat.key]: false }));
    }
  };

  useEffect(() => {
    CATEGORIES.forEach(cat => fetchCategory(cat));
  }, []);

  // Notify parent with all loaded headlines for chatbot context
  useEffect(() => {
    const allArticles = Object.values(catData).flat();
    if (allArticles.length > 0 && onNewsLoaded) {
      onNewsLoaded(allArticles);
    }
  }, [catData]);

  const allArticles = Object.values(catData).flat();

  // Articles for the active tab
  const activeArticles = catData[activeTab] || [];
  const filtered = activeArticles
    .filter(a => {
      const q = search.toLowerCase();
      return a.title?.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'source') return (a.source || '').localeCompare(b.source || '');
      return 0;
    });

  // Doughnut chart data
  const categoryCounts = CATEGORIES.map(c => catData[c.key]?.length || 0);
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
      if (elements.length > 0) setActiveTab(CATEGORIES[elements[0].index].key);
    },
    plugins: {
      legend: {
        position: 'right',
        labels: { color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151', font: { size: 11 } },
      },
    },
  };

  const catColors = { general: 'bg-pink-500', science: 'bg-blue-500', technology: 'bg-yellow-500' };

  return (
    <div className="flex flex-col">
      {/* Header row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-3">
        <h2 className="text-xl font-bold flex items-center gap-2">📰 Latest News
          <span className="text-xs font-normal text-gray-500 dark:text-gray-400">({allArticles.length} articles loaded)</span>
        </h2>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          {/* Sort */}
          <div className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm cursor-pointer select-none"
            onClick={() => setSortBy(s => s === 'date' ? 'source' : 'date')}
            title="Toggle sort"
          >
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700 dark:text-gray-300 text-xs font-medium">
              {sortBy === 'date' ? 'Date' : 'Source'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Doughnut chart + tabs */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Chart */}
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold mb-1 text-center">Distribution</h3>
            <p className="text-xs text-gray-500 text-center mb-2">Click a slice to switch tab</p>
            <div className="h-[160px]">
              {allArticles.length > 0
                ? <Doughnut data={chartData} options={chartOptions} />
                : <div className="flex items-center justify-center h-full text-sm text-gray-400">Loading…</div>}
            </div>
          </div>

          {/* Category tabs / buttons — each has its own refresh */}
          <div className="flex flex-col gap-2">
            {CATEGORIES.map(cat => (
              <div key={cat.key}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition
                  ${activeTab === cat.key
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                onClick={() => setActiveTab(cat.key)}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${catColors[cat.key]}`}></span>
                  <span className="text-sm font-medium">{cat.label}</span>
                  <span className="text-xs text-gray-400">({catData[cat.key]?.length || 0})</span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); fetchCategory(cat, true); }}
                  title={`Refresh ${cat.label}`}
                  className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${catLoading[cat.key] ? 'animate-spin' : ''}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Article grid */}
        <div className="lg:col-span-3">
          {catLoading[activeTab] ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="h-32 bg-gray-300 dark:bg-gray-600 w-full"></div>
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : catError[activeTab] ? (
            <div className="text-center py-10 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
              <p className="font-medium mb-2">⚠️ {catError[activeTab]}</p>
              <button
                onClick={() => fetchCategory(CATEGORIES.find(c => c.key === activeTab), true)}
                className="mt-2 px-4 py-2 bg-red-100 dark:bg-red-800 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition text-sm"
              >Retry</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.slice(0, 5).map((article, i) => (
                <article key={i} className="flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow group">
                  {/* Image */}
                  {article.image ? (
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className={`w-full h-36 flex items-center justify-center text-5xl
                      ${activeTab === 'science' ? 'bg-gradient-to-br from-blue-400 to-cyan-600' :
                        activeTab === 'technology' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                        'bg-gradient-to-br from-pink-400 to-red-500'}`}>
                      {activeTab === 'science' ? '🔬' : activeTab === 'technology' ? '💻' : '📰'}
                    </div>
                  )}

                  <div className="p-3 flex flex-col flex-1">
                    {/* Category badge + Date */}
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[10px] uppercase font-bold text-white px-2 py-0.5 rounded-full ${catColors[article.category]}`}>
                        {article.category}
                      </span>
                      <span className="text-[11px] text-gray-400">{new Date(article.date).toLocaleDateString()}</span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-sm mb-1 line-clamp-2 leading-snug">{article.title}</h3>

                    {/* Description */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2 flex-1">{article.description}</p>

                    {/* Footer: Source/Author + Read More */}
                    <div className="flex justify-between items-center mt-auto border-t border-gray-100 dark:border-gray-700 pt-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 truncate max-w-[120px]">{article.source}</span>
                        <span className="text-[10px] text-gray-400 truncate max-w-[120px]">by {article.author}</span>
                      </div>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold px-3 py-1 bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-600 transition whitespace-nowrap"
                      >
                        Read More →
                      </a>
                    </div>
                  </div>
                </article>
              ))}
              {filtered.length === 0 && (
                <p className="col-span-full text-center py-10 text-gray-400">No articles match your search.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
