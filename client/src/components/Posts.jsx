import Post from "./post";
import { useQuery } from "@tanstack/react-query";
import { makeRequest } from "../axios";
import { useState, useEffect } from "react"; // import useState and useEffect hooks
import {
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
} from "@material-tailwind/react"; // import tabs components

const Posts = () => {
  // define categories array
  const categories = [
    {
      label: "Politics",
      value: "politics",
      desc: "Posts about politics and current affairs.",
    },

    {
      label: "Entertainment",
      value: "entertainment",
      desc: "Posts about movies, music, games, and celebrities.",
    },
    {
      label: "Technology",
      value: "technology",
      desc: "Posts about gadgets, software, innovation, and science.",
    },
    {
      label: "Business",
      value: "business",
      desc: "Posts about finance, economy, entrepreneurship, and marketing.",
    },
    {
      label: "Health",
      value: "health",
      desc: "Posts about wellness, fitness, nutrition, and medicine.",
    },
    {
      label: "Sports",
      value: "sports",
      desc: "Posts about athletics, games, competitions, and teams.",
    },
  ];

  // initialize state for selected category
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

  // initialize state for number of posts to show
  const [numOfPosts, setNumOfPosts] = useState(12); // add state for number of posts

  // fetch posts of selected category with react query
  const { isLoading, error, data } = useQuery(
    ["posts", selectedCategory.value], // provide a unique key for each category
    () =>
      makeRequest
        .get("/posts?category=" + selectedCategory.value)
        .then((res) => res.data)
  );

  // reset numOfPosts to 12 when selectedCategory changes
  useEffect(() => {
    setNumOfPosts(12);
  }, [selectedCategory]);

  const handleLoadMore = () => {
    setNumOfPosts((prevNumOfPosts) => prevNumOfPosts + 12);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col posts-center mb-7">
        <h1 className="text-5xl font-bold mb-2 text-gray-900">
          <span className="text-blue-600">Today</span> in Africa
        </h1>
        <div className="w-40 h-1 bg-blue-600 mb-8"></div>
      </div>
      <Tabs id="custom-animation" value={selectedCategory.value}>
        <TabsHeader>
          {categories.map(({ label, value }) => (
            <Tab
              key={value}
              value={value}
              onClick={() =>
                setSelectedCategory(categories.find((c) => c.value === value))
              }
            >
              {label}
            </Tab>
          ))}
        </TabsHeader>
        <TabsBody
          animate={{
            initial: { y: 250 },
            mount: { y: 0 },
            unmount: { y: 250 },
          }}
        >
          {categories.map(({ value, desc }) => (
            <TabPanel key={value} value={value}>
              {desc}
              {error ? (
                "Something went wrong!"
              ) : isLoading ? (
                "loading"
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {data.slice(0, numOfPosts).map((post) => (
                    <Post post={post} key={post.id} />
                  ))}
                </div>
              )}
              {numOfPosts < (data && data.length) && (
                <div className="flex justify-center mt-8">
                  <button
                    className="border border-blue-500 text-blue-500 py-2 px-4 rounded-md hover:bg-blue-500 hover:text-white transition-all duration-200"
                    onClick={handleLoadMore}
                  >
                    Load more
                  </button>
                </div>
              )}
            </TabPanel>
          ))}
        </TabsBody>
      </Tabs>
    </div>
  );
};

export default Posts;
