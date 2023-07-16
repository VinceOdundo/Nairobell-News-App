import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { NewsContext } from "../contexts/NewsContext";
import Logo from "../assets/logo.svg";
import Cookies from "js-cookie";
import { useContext, useState } from "react";

const languages = [
  { code: "en", name: "English" },
  { code: "sw", name: "Swahili" },
  { code: "fr", name: "French" },
  { code: "af", name: "Afrikaans" },
  { code: "ar", name: "Arabic" },
  { code: "ha", name: "Hausa" },
  { code: "ig", name: "Igbo" },
  { code: "om", name: "Oromo" },
  { code: "st", name: "Sesotho" },
  { code: "so", name: "Somali" },
  { code: "xh", name: "Xhosa" },
  { code: "yo", name: "Yoruba" },
  { code: "zu", name: "Zulu" },
  // add more languages as needed
];

function Navbar() {
  const { setSearchQuery, searchQuery, articles, setArticles } =
    useContext(NewsContext);

  const [language, setLanguage] = useState("en");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const history = useNavigate();

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
  };

  const handleTranslate = async () => {
    try {
      const currentIndex = articles.findIndex(
        (article) => article.id === currentArticleId
      );
      const originalContent = articles[currentIndex].original;
      if (articles[currentIndex][language]) {
        setArticles([
          ...articles.slice(0, currentIndex),
          {
            ...articles[currentIndex],
            content: articles[currentIndex][language],
          },
          ...articles.slice(currentIndex + 1),
        ]);
      } else {
        const response = await axios.post(
          "https://translation.googleapis.com/language/translate/v2",
          {
            q: originalContent,
            target: language,
            key: "AIzaSyDsyyoGe1RN71YkNmeU32aso_a-bSdFuPA",
          }
        );
        const translatedContent =
          response.data.data.translations[0].translatedText;
        // Add the translated content to the current article object with the language code as the key
        setArticles([
          ...articles.slice(0, currentIndex),
          {
            ...articles[currentIndex],
            content: translatedContent,
            [language]: translatedContent,
          },
          ...articles.slice(currentIndex + 1),
        ]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const handleLogOut = () => {
    Cookies.remove("authToken"); // Use cookies to remove the authToken
    setIsLoggedIn(false);
    history.push("/");
  };

  return (
    <nav className="flex items-center justify-between flex-wrap bg-white py-4 lg:px-12 shadow border-solid border-t-2 border-blue-700">
      <div className="flex justify-between lg:w-auto w-full lg:border-b-0 pl-6 pr-2 border-solid border-b-2 border-gray-300 pb-5 lg:pb-0">
        <div className="flex items-center flex-shrink-0 text-gray-800 mr-16">
          <img src={Logo} alt="Logo" className="w-96 h-32" />
        </div>
        {/* <div className="block lg:hidden">
          // Code for the mobile menu button
        </div> */}
      </div>

      <div className="menu w-full lg:block flex-grow lg:flex lg:items-center lg:w-auto lg:px-3 px-8">
        <form
          className="relative mx-auto text-gray-600 lg:block hidden"
          onSubmit={handleFormSubmit}
        >
          <input
            className="border-2 border-gray-300 bg-white h-10 pl-2 pr-8 rounded-lg text-sm focus:outline-none"
            type="search"
            name="search"
            placeholder="Search"
            value={searchQuery}
            onChange={handleSearch}
          />
          <button type="submit" className="absolute right-0 top-0 mt-3 mr-2">
            <svg
              className="text-gray-600 h-4 w-4 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path
                className="heroicon-ui"
                d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15zm8.31-1.06l-4.82-4.83a5.5 5.5 0 1 0-.97.96l4.83 4.82a.75.75 0 0 0 .97-.97z"
              />
            </svg>
          </button>
        </form>
        <div className="flex">
          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-2 font-medium hidden md:flex">
                <img
                  src={user.profilePicture}
                  alt={user.username}
                  className="w-10 h-10 rounded-full border-2 border-white" // adjust the width, height and border as needed
                />
                <span>{user.name}</span>
              </div>
              <button
                onClick={handleLogOut}
                className="block text-md px-4 ml-2 py-2 rounded text-white border-2 border-blue-700 bg-blue-700 font-bold hover:text-blue-700 hover:border-2 hover:border-blue-700 hover:bg-white lg:mt-0"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="block text-md px-4 py-2 rounded text-blue-700 ml-2 font-bold hover:text-white mt-4 hover:bg-blue-700 lg:mt-0"
              >
                Members
              </Link>

              <select
                value={language}
                onChange={handleLanguageChange}
                className="block text-md px-4 py-2 rounded text-blue-700 ml-2 font-bold hover:text-white mt-4 hover:bg-blue-700 lg:mt-0"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleTranslate}
                className="block text-md px-4 ml-2 py-2 rounded text-white border-2 border-blue-700 bg-blue-700 font-bold hover:text-blue-700 hover:border-2 hover:border-blue-700 hover:bg-white lg:mt-0"
              >
                Translate
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
