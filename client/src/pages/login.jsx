import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/authContext";
import { makeRequest } from "../axios";

const Login = () => {
  const [inputs, setInputs] = useState({
    email: "", // change username to email
    password: "",
  });
  const [err, setErr] = useState(null);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();

    // validate inputs before sending
    if (!inputs.email || !inputs.password) {
      setErr("Please fill in all the fields");
      return;
    }

    try {
      // use async/await with try/catch
      const response = await makeRequest.post("auth/login", inputs);

      // handle success case
      await login(response.data);
      navigate("/");
    } catch (err) {
      // handle error case
      setErr(err.response.data);
    }
  };

  console.log(err);

  return (
    <div className="h-screen bg-purple-300 flex items-center justify-center">
      <div className="w-1/2 flex bg-white rounded-lg overflow-hidden">
        <div className="flex-1 bg-gradient-to-r from-purple-900 to-purple-700 p-12 flex flex-col gap-8 text-white">
          <h1 className="text-5xl font-bold">Karibu Nairobell.</h1>
          <p>
            Discover new and important stories from Africa now. Log in and find
            out what’s happening.🌍
          </p>
          <span className="text-sm">Don't you have an account?</span>
          <Link to="/register">
            <button className="w-1/2 py-2 border-none bg-white text-purple-800 font-bold hover:bg-purple-100">
              Register
            </button>
          </Link>
        </div>
        <div className="flex-1 p-12 flex flex-col gap-12 justify-center">
          <h1 className="text-gray-700 font-bold">Login</h1>
          <form className="flex flex-col gap-8">
            <input
              type="email"
              placeholder="Email" // change placeholder to Email
              name="email" // change name to email
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
            {err && (
              // display error message in a styled component
              <div className="text-red-500">{err}</div>
            )}
            <button
              onClick={handleLogin}
              className="w-1/2 py-2 border-none bg-purple-400 text-white font-bold hover:bg-purple-500"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
