import React, { useState } from "react";
import people from "../assets/people.png";
import { useNavigate } from "react-router-dom"; // import useNavigate hook
import axios from "axios";

function Hero() {
  const [email, setEmail] = useState(""); // create a state variable for email
  const [error, setError] = useState(""); // create a state variable for error
  const history = useNavigate(); // create a history object

  const handleEmailChange = (e) => {
    // create a function to handle email input change
    setEmail(e.target.value); // update the email state with the input value
    setError(""); // reset the error state
  };

  const validateEmail = (email) => {
    // create a function to validate email format
    // use a regular expression to test the email input
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return regex.test(email);
  };

  const checkEmailExists = async (email) => {
    // create a function to check if the email is already registered on the user table
    try {
      // send a GET request to the server with the email as a query parameter
      const response = await axios.get(
        `http://localhost:8800/api/user?email=${email}`
      );
      // if the response data is not empty, it means the email exists
      if (response.data.length > 0) {
        // return true to indicate the email exists
        return true;
      } else {
        // return false to indicate the email does not exist
        return false;
      }
    } catch (error) {
      // if there is an error, log it and return false
      console.log(error);
      return false;
    }
  };

  const handleButtonClick = async () => {
    // create a function to handle button click
    if (validateEmail(email)) {
      // if the email is valid, proceed with the logic
      // check if the email exists on the user table
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        // if the email exists, show an error message
        setError("This email is already registered");
      } else {
        // if the email does not exist, proceed with the logic
        alert(`You entered ${email}`); // show an alert with the email value
        // you can also do other things like sending requests, etc.
        history.push("/register", { email }); // navigate to /register page and pass the email value as a state prop
      }
    } else {
      // if the email is invalid, show an error message
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
            value={email} // add value prop for email input
            onChange={handleEmailChange} // add onChange prop for email input
          />
          <button
            type="button"
            aria-label="Get Started"
            className="w-2/3 py-3 px-4 text-lg text-white bg-gray-800 border-2 border-gray-800 hover:bg-blue-500 hover:border-blue-500 rounded-r-lg"
            onClick={handleButtonClick} // add onClick prop for button
          >
            Get Started
          </button>
        </div>
        {/* Display the error message if any */}
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
