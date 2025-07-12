import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../Context/AuthContext";
import Logo from "../assets/citio_1.ico";
import { Eye, EyeOff } from "lucide-react";

const loginUser = async ({ email, password }) => {
  const response = await axios.post(
    "https://graduation.amiralsayed.me/api/auth/login",
    { email, password },
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data;
};

const registerUser = async ({ fullName, phoneNumber, email, password }) => {
  const response = await axios.post(
    "https://cms-central-ffb6acaub5afeecj.uaenorth-01.azurewebsites.net/api/Auth/register",
    { fullName, phoneNumber, email, password },
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data;
};

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [confirmPass, setConfirmPass] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [inputs, setInputs] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmpass: "",
  });
  const navigate = useNavigate();
  const { login } = useAuth();

  const mutation = useMutation({
    mutationFn: isSignUp ? registerUser : loginUser,
    retry: false,
    onSuccess: (data) => {
      if (isSignUp) {
        setIsSignUp(false);
        resetForm();
      } else {
        const token = data.token || data.registrationToken;
        const userId = data.user?.id || data.newUser?.id;
        if (!token || !userId) throw new Error("Invalid response");
        login(token, userId);
        resetForm();
        navigate("/");
      }
    },
    onError: (error) => {
      console.error(`${isSignUp ? "Sign Up" : "Login"} failed:`, error);
    },
  });

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignUp) {
      if (inputs.password !== inputs.confirmpass) {
        setConfirmPass(false);
        return;
      }
      mutation.mutate(inputs);
    } else {
      const { email, password } = inputs;
      mutation.mutate({ email, password });
    }
    setConfirmPass(true);
  };

  const resetForm = () => {
    setInputs({
      fullName: "",
      phoneNumber: "",
      email: "",
      password: "",
      confirmpass: "",
    });
    setConfirmPass(true);
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen font-family-sans bg-background-card flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
        <div className="flex justify-center mb-9">
          <img src={Logo} alt="Citio Logo" className="h-20" />
        </div>
        <h2 className="text-4xl font-bold text-gray-800 mb-6 text-center pb-2">
          {isSignUp ? "Sign Up" : "Welcome Back"}
        </h2>
        <h4 className="text-2xl text-citio-gray mb-8 text-center pb-2">
          {isSignUp ? "Sign up to your Citio account" : "Sign in to your Citio account"}
        </h4>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-600 mb-2"
            >
              Email
            </label>
            <input
              required
              type="email"
              id="email"
              name="email"
              value={inputs.email}
              onChange={handleChange}
              className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-citio-blue hover:border-citio-blue/50 placeholder:text-gray-500"
              placeholder="you@example.com"
              disabled={mutation.isLoading}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-600 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={inputs.password}
                onChange={handleChange}
                className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-citio-blue hover:border-citio-blue/50 placeholder:text-gray-500 pr-12"
                placeholder="Enter your password"
                disabled={mutation.isLoading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-citio-blue"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <span
            className={`text-sm text-red-600 ${confirmPass ? "hidden" : ""}`}
          >
            * Confirm password does not match
          </span>
          {/* {!isSignUp && (
            <div className="text-right">
              <a
                href="#"
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
              >
                Forgot Password?
              </a>
            </div>
          )} */}
          <button
            type="submit"
            className="w-full bg-blue-900 cursor-pointer text-white py-3 rounded-xl hover:bg-blue-800 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={
              mutation.isLoading ||
              (isSignUp && inputs.password !== inputs.confirmpass) ||
              !inputs.email ||
              !inputs.password ||
              (isSignUp && (!inputs.fullName || !inputs.phoneNumber))
            }
          >
            {mutation.isLoading ? "Loading..." : isSignUp ? "Sign Up" : "Login"}
          </button>
          {mutation.isError && (
            <p className="text-sm text-red-600 text-center cursor-pointer">
              ❌{" "}
              {mutation.error?.response?.data?.message ||
                mutation.error?.message ||
                `${isSignUp ? "Sign Up" : "Login"} failed. Please try again.`}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
