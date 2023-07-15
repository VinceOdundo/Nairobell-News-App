import { db } from "../connect.js";
import axios from "axios";
import cheerio from "cheerio";
import NodeCache from "node-cache";
import Post from "../models/post.js";

const rssCache = new NodeCache();
const categories = [
  "politics",
  "business",
  "sports",
  "health",
  "entertainment",
  "technology",
];

function getCategoryFromUrl(categoryUrl) {
  for (let category of categories) {
    if (categoryUrl.toLowerCase().includes(category)) {
      return category.charAt(0).toUpperCase() + category.slice(1);
    }
  }
  return null;
}

async function generateNews(postModel) {
  const urls = [
    "https://rss.punchng.com/v1/category/latest_news",
    "https://www.standardmedia.co.ke/rss/kenya.php",
    "https://mg.co.za/section/africa/?feed=fullfeed",
    "https://www.the-star.co.ke/rss/",
    "https://nation.africa/kenya/rss.xml",
    "https://www.monitor.co.ug/rss.xml",
    "https://www.theguardian.com/world/africa/rss",
    "http://feeds.bbci.co.uk/news/world/africa/rss.xml#",
    "https://www.dailynewsegypt.com/feed/",
    "https://sudantribune.com/feed/",
    "https://venturebeat.com/feed/",
    "https://jubaecho.com/feed/",
    "https://taifaleo.nation.co.ke/feed",
    "https://guardian.ng/feed/",
    "https://newsghana.com.gh/feed",
  ];

  let newsItems = [];

  const rssPromises = urls.map(async (url) => {
    try {
      let response;
      const cachedResponse = rssCache.get(url);
      if (cachedResponse) {
        response = { data: cachedResponse };
      } else {
        response = await axios.get(url, { timeout: 10000 });
        rssCache.set(url, response.data, 3600); // Cache the response for one hour
      }
      const $ = cheerio.load(response.data, { xmlMode: true });
      $("item").each((i, item) => {
        const url = $(item).find("link").text();
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
          getCategoryFromUrl(url) || $(item).find("category").first().text();

        // Validate the data before adding it to the array
        if (url && title && thumbnail && date && category) {
          newsItems.push({ url, title, thumbnail, date, category });
        }
      });
    } catch (err) {
      console.log(`Error fetching RSS feed from ${url}: ${err.message}`);
    }
  });

  await Promise.allSettled(rssPromises);

  return newsItems;
}

export const getPosts = (req, res) => {
  const q = `SELECT * FROM post ORDER BY date DESC`;

  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
};

export const addPost = async (req, res) => {
  try {
    const newsItems = await generateNews(Post);

    for (let newsItem of newsItems) {
      const q = `SELECT * FROM post WHERE url = ?`;
      db.query(q, [newsItem.url], (err, data) => {
        if (err) throw err;
        if (data.length === 0) {
          // No post with this URL exists in the database
          // Create a new post
          const q = `INSERT INTO post (url, title, thumbnail, date, category) VALUES (?, ?, ?, ?, ?)`;
          db.query(
            q,
            [
              newsItem.url,
              newsItem.title,
              newsItem.thumbnail,
              newsItem.date,
              newsItem.category,
            ],
            (err, data) => {
              if (err) throw err;
            }
          );
        }
      });
    }

    if (res) {
      return res.status(200).json("Posts have been created from RSS feeds.");
    }
  } catch (err) {
    console.log(`Error adding posts: ${err.message}`);
    if (res) {
      return res.status(500).json(err);
    }
  }
};

addPost();

// Call the addPost function every 30 minutes
setInterval(addPost, 30 * 60 * 1000);
