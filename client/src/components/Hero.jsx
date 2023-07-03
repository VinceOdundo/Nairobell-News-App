import React from "react";
import people from "../assets/people.png";

function Hero() {
  return (
    <div
      className="flex flex-col justify-center items-center py-10 px-4"
      id="home"
    >
      <div className="flex flex-col justify-center items-center">
        <h1 className="text-center font-bold text-5xl md:text-6xl lg:text-7xl leading-tight">
          Your ultimate African news aggregator,
          <span className="text-blue-600"> powered by AI.</span>
        </h1>
        <div className="flex mt-8 mb-4">
          <input
            type="email"
            placeholder="Your Email Address"
            aria-label="Email Address"
            className="flex-grow py-3 px-4 text-lg text-gray-800 border-2 border-blue-500 hover:border-gray-800 rounded-l-lg"
          />
          <button
            type="button"
            aria-label="Get Started"
            className="w-2/3 py-3 px-4 text-lg text-white bg-gray-800 border-2 border-gray-800 hover:bg-blue-500 hover:border-blue-500 rounded-r-lg"
          >
            Get Started
          </button>
        </div>

        <div className="flex items-center mt-8">
          <img src={people} alt="People icon" className="w-44 h-9" />
          <p className="ml-4 text-gray-800 text-center">
            1,635 people are online
          </p>
        </div>
      </div>
    </div>
  );
}

export default Hero;
