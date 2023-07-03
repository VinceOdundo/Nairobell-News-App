import React, { useContext, useState } from "react";
import moment from "moment";
import "moment/locale/en-gb";
import { NewsContext } from "../../contexts/NewsContext";
import Loading from "./Loading";

const NewsPage = () => {
  const { newsItems, isLoading } = useContext(NewsContext);

  // Define default selected tab
  const [selectedTab, setSelectedTab] = useState("kenya");

  const itemsPerPage = 12;
  const [currentItemsCount, setCurrentItemsCount] = useState(itemsPerPage);

  const handleLoadMore = () => {
    setCurrentItemsCount(currentItemsCount + itemsPerPage);
  };

  const endIndex = currentItemsCount;

  // Function to filter news items by category and slice according to current items count
  const getNewsByCategory = (category) => {
    return newsItems
      .filter((item) => item.category.toLowerCase() === category)
      .slice(0, endIndex);
  };

  const renderNewsItems = (category) => {
    const news = getNewsByCategory(category);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
        {news.map((item) => (
          <div
            key={item.postUrl}
            className="rounded-lg overflow-hidden shadow-lg bg-gray-800 hover:shadow-xl transition-all duration-300"
          >
            <a href={item.postUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-full h-48 object-cover object-center"
              />
            </a>
            <div className="p-4">
              <h2 className="text-xl font-bold mb-2 text-white">
                {item.title}
              </h2>
              <div className="flex justify-between items-center mt-2">
                <p className="text-gray-400 text-md font-bold mb-4">
                  {moment(item.date).fromNow()}
                </p>
                <a
                  href={item.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-blue-500 text-blue-500 py-2 px-4 rounded-md hover:bg-blue-500 hover:text-white transition-all duration-200"
                >
                  Read More
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleTabClick = (category) => {
    setSelectedTab(category);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col items-center mb-7">
        <h1 className="text-5xl font-bold mb-2 text-gray-900">
          <span className="text-blue-600">Today</span> in Africa
        </h1>
        <div className="w-40 h-1 bg-blue-600 mb-8"></div>
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <div className="p-8">
          <ul className="grid grid-flow-col text-center text-gray-500 p-1">
            <li onClick={() => handleTabClick("kenya")}>
              <a href="#kenya" className="flex justify-center py-4">
                Local
              </a>
            </li>
            <li onClick={() => handleTabClick("top")}>
              <a href="#top" className="flex justify-center py-4">
                Top Stories
              </a>
            </li>
            <li onClick={() => handleTabClick("politics")}>
              <a href="#politics" className="flex justify-center py-4">
                Politics
              </a>
            </li>
            <li onClick={() => handleTabClick("business")}>
              <a href="#business" className="flex justify-center py-4">
                Business
              </a>
            </li>
            <li onClick={() => handleTabClick("sports")}>
              <a href="#sports" className="flex justify-center py-4">
                Sports
              </a>
            </li>
            <li onClick={() => handleTabClick("health")}>
              <a href="#health" className="flex justify-center py-4">
                Health & Lifestyle
              </a>
            </li>
          </ul>

          <div className="bg-white shadow border border-gray-100 p-8 text-gray-700 rounded-lg -mt-2">
            {renderNewsItems(selectedTab)}
          </div>

          <div className="flex justify-center mt-8">
            <button
              onClick={handleLoadMore}
              className="border border-blue-500 text-blue-500 py-2 px-4 rounded-md hover:bg-blue-500 hover:text-white transition-all duration-200"
            >
              Load More
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsPage;
