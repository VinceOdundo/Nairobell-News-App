const axios = require("axios");
const cheerio = require("cheerio");
const NodeCache = require("node-cache");

const rssCache = new NodeCache();
const categories = [
  "topstories",
  "politics",
  "business",
  "sports",
  "health",
  "entertainment",
  "Kenya",
];

function getCategoryFromUrl(url) {
  for (let category of categories) {
    if (url.toLowerCase().includes(category)) {
      return category.charAt(0).toUpperCase() + category.slice(1);
    }
  }
  return null;
}

async function generateNews(NewsItem) {
  // An array of URLs for websites that provide RSS feeds
  const urls = [
    "https://rss.punchng.com/v1/category/latest_news",
    "https://www.standardmedia.co.ke/rss/kenya.php",
    "https://mg.co.za/section/africa/?feed=fullfeed",
    "https://www.the-star.co.ke/rss/",
    "https://nation.africa/kenya/rss.xml",
    "https://www.monitor.co.ug/rss.xml",
    "https://www.theguardian.com/world/africa/rss",
    "http://feeds.bbci.co.uk/news/world/africa/rss.xml#",
    "https://www.thecitizen.co.tz/tanzania/rss.xml",
    "https://www.dailynewsegypt.com/feed/",
    "https://sudantribune.com/feed/",
    "https://venturebeat.com/feed/",
    "https://jubaecho.com/feed/",
    "https://cityreviewss.com/feed/",
    "https://taifaleo.nation.co.ke/feed",
    "https://www.vanguardngr.com/feed/",
    "https://guardian.ng/feed/",
    "https://newsghana.com.gh/feed",
    "https://3news.com/feed/",
  ];

  // An empty array to store the news items
  let newsItems = [];

  // Create an array of promises that fetch the RSS feeds
  const rssPromises = urls.map(async (url) => {
    let response;
    const cachedResponse = rssCache.get(url);
    if (cachedResponse) {
      response = { data: cachedResponse };
    } else {
      response = await axios.get(url, { timeout: 5000 });
      rssCache.set(url, response.data);
    }
    const $ = cheerio.load(response.data, { xmlMode: true });
    $("item").each((i, item) => {
      // Extract the required fields from the RSS item
      const postUrl = $(item).find("link").text();
      const title = $(item).find("title").text();
      const thumbnail =
        $(item).find("media\\:content, content").attr("url") ||
        $(item).find("enclosure").attr("url") ||
        $(item).find("image").attr("url") ||
        $(item).find("og:image").attr("content") ||
        $(item).find("twitter:image").attr("content") ||
        "https://via.placeholder.com/150"; // Default thumbnail

      const date = $(item).find("pubDate").text();
      const category =
        getCategoryFromUrl(postUrl) || $(item).find("category").first().text();

      // Add the news item to the array
      newsItems.push({ postUrl, title, thumbnail, date, category });
    });
  });

  // Wait for all the RSS feeds to be fetched and then return the news items
  await Promise.allSettled(rssPromises);

  return newsItems;
}

module.exports = generateNews;
