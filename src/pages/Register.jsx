import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [inputs, setInputs] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
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
      !inputs.lastName
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
        <div className="flex-1 p-12 flex flex-col gap-12 justify-center">
          <h1 className="text-gray-700 font-bold">Register</h1>
          <form className="flex flex-col gap-8">
            <div className="flex">
              <input
                type="text"
                placeholder="First Name"
                name="firstName"
                onChange={handleChange}
                className="w-1/2 h-1/2 flex-1 border-none border-b border-gray-300 py-4 px-2"
              />
              <input
                type="text"
                placeholder="Last Name"
                name="lastName"
                onChange={handleChange}
                className="w-1/2 h-1/2 flex-1 border-none border-b border-gray-300 py-2 px-2"
              />
            </div>
            <input
              type="text"
              placeholder="Username"
              name="username"
              onChange={handleChange}
              className="border-none h-1/2 border-b border-gray-300 py-2 px-2"
            />
            <input
              type="email"
              placeholder="Email"
              name="email"
              onChange={handleChange}
              className="border-none h-1/2 border-b border-gray-300 py-2 px-2"
            />
            <input
              type="password"
              placeholder="Password"
              name="password"
              onChange={handleChange}
              className="border-none h-1/2 border-b border-gray-300 py-2 px-2"
            />

            {err && (
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
        <div className="flex-1 bg-gradient-to-r from-purple-900 to-purple-700 p-12 flex flex-col gap-8 text-white">
          <h1 className="text-5xl font-bold">Join Nairobell.</h1>
          <p>
            Leverage on AI to find and read the stories that match your
            interests and preferences. Register now and start reading.🌍
          </p>
          <span className="text-sm">Do you have an account?</span>
          <Link to="/login">
            <button className="w-1/2 py-2 border-none bg-white text-purple-800 font-bold hover:bg-purple-100">
              Login
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};
export default Register;
