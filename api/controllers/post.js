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

      // Add the news item to the array
      newsItems.push({ url, title, thumbnail, date, category });
    });
  });

  // Wait for all the RSS feeds to be fetched and then return the news items
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
  // Call the generateNews function and get the array of news items
  const newsItems = await generateNews(Post);

  // Loop through the news items and save them to the database
  for (let newsItem of newsItems) {
    // Create a new instance of the Post model with the news item fields
    const newPost = new Post({
      url: newsItem.url,
      title: newsItem.title,
      thumbnail: newsItem.thumbnail,
      date: newsItem.date,
      category: newsItem.category,
    });

    // Save the new post to the database
    await newPost.save();
  }

  // Respond with a success message
  return res.status(200).json("Posts have been created from RSS feeds.");
};

// Export the addPost function here
export default addPost;
