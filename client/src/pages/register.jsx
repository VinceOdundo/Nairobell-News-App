import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [inputs, setInputs] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "", // change name to firstName
    lastName: "", // add lastName
  });
  const [err, setErr] = useState(null);
  const history = useNavigate();

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleClick = async (e) => {
    e.preventDefault();

    // validate inputs before sending
    if (
      !inputs.username ||
      !inputs.email ||
      !inputs.password ||
      !inputs.firstName ||
      !inputs.lastName // add lastName validation
    ) {
      setErr("Please fill in all the fields");
      return;
    }
    try {
      // use async/await with try/catch
      const response = await axios.post(
        "http://localhost:8800/api/auth/register",
        inputs
      );
      // handle success case
      alert("Registration successful");
      history.push("/login");
    } catch (err) {
      if (err.response.data.includes("username")) {
        setErr(
          `The username ${inputs.username} is already taken. Please choose another one.`
        );
      } else if (err.response.data.includes("email")) {
        setErr(
          `The email ${inputs.email} is already registered. Do you want to <Link to="/login">log in</Link> instead?`
        );
      } else {
        // set the default error message for other issues
        setErr(err.response.data);
      }
    }
  };

  console.log(err);

  return (
    <div className="h-screen bg-purple-300 flex items-center justify-center">
      <div className="w-1/2 flex bg-white rounded-lg overflow-hidden">
        <div className="flex-1 bg-gradient-to-r from-purple-900 to-purple-700 p-12 flex flex-col gap-8 text-white">
          <h1 className="text-9xl font-bold">Lama Social.</h1>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero cum,
            alias totam numquam ipsa exercitationem dignissimos, error nam,
            consequatur.
          </p>
          <span className="text-sm">Do you have an account?</span>
          <Link to="/login">
            <button className="w-1/2 py-2 border-none bg-white text-purple-800 font-bold hover:bg-purple-100">
              Login
            </button>
          </Link>
        </div>
        <div className="flex-1 p-12 flex flex-col gap-12 justify-center">
          <h1 className="text-gray-700">Register</h1>
          <form className="flex flex-col gap-8">
            <input
              type="text"
              placeholder="Username"
              name="username"
              onChange={handleChange}
              className="border-none border-b border-gray-300 py-4 px-2"
            />
            <input
              type="email"
              placeholder="Email"
              name="email"
              onChange={handleChange}
              className="border-none border-b border-gray-300 py-4 px-2"
            />
            <input
              type="password"
              placeholder="Password"
              name="password"
              onChange={handleChange}
              className="border-none border-b border-gray-300 py-4 px-2"
            />
            <input
              type="text"
              placeholder="First Name"
              name="firstName" // change name to firstName
              onChange={handleChange}
              className="border-none border-b border-gray-300 py-4 px-2"
            />
            <input
              type="text"
              placeholder="Last Name"
              name="lastName" // add lastName input
              onChange={handleChange}
              className="border-none border-b border-gray-300 py-4 px-2"
            />
            {err && (
              // display error message in a styled component with a link if needed
              <div
                className="text-red-500"
                dangerouslySetInnerHTML={{ __html: err }}
              ></div>
            )}
            <button
              onClick={handleClick}
              className="w-1/2 py-2 border-none bg-purple-400 text-white font-bold hover:bg-purple-500"
            >
              Register
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default Register;
