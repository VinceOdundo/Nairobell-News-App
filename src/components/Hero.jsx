import React, { useState } from "react";
import people from "../assets/people.png";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Hero() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const history = useNavigate();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setError("");
  };

  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return regex.test(email);
  };

  const checkEmailExists = async (email) => {
    try {
      const response = await axios.get(
        `http://localhost:8800/api/user?email=${email}`
      );
      if (response.data.length > 0) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const handleButtonClick = async () => {
    if (validateEmail(email)) {
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        setError("This email is already registered");
      } else {
        alert(`You entered ${email}`); // show an alert with the email value
        history.push("/register", { email });
      }
    } else {
      setError("Please enter a valid email address");
    }
  };

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
            value={email}
            onChange={handleEmailChange}
          />
          <button
            type="button"
            aria-label="Get Started"
            className="w-2/3 py-3 px-4 text-lg text-white bg-gray-800 border-2 border-gray-800 hover:bg-blue-500 hover:border-blue-500 rounded-r-lg"
            onClick={handleButtonClick}
          >
            Get Started
          </button>
        </div>
        {error && <p className="text-red-600">{error}</p>}
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
