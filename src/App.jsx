import React, { useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { isTokenExpired } from "./checkTokenExpiration";
import toast from "react-hot-toast";
import { useAuth } from "./Context/AuthContext";
import Feed from "./pages/Feed";
import Login from "./pages/Login";
import City from "./pages/City";
import MyPosts from "./pages/MyPosts";
import Roles from "./pages/Roles";
import ProfilePage from "./pages/Profile";

function App() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const token = userData?.token || localStorage.getItem("token");
  const isAuthenticated = token && !isTokenExpired();
  useEffect(() => {
    const interval = setInterval(() => {
      if (isTokenExpired()) {
        localStorage.removeItem("token");
        localStorage.removeItem("loginTime");
        toast.info("Session expired. Please log in again.");
        navigate("/login");
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [navigate]);
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={isAuthenticated ? <Feed /> : <Navigate to="/login" />}
        />
        <Route
          path="/city"
          element={isAuthenticated ? <City /> : <Navigate to="/login" />}
        />
        <Route
          path="/my-posts"
          element={isAuthenticated ? <MyPosts /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/user/:userId"
          element={isAuthenticated ? <MyPosts /> : <Navigate to="/login" />}
        />
        <Route
          path="/role"
          element={
            isAuthenticated && userData?.role !== "user" ? (
              <Roles />
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
}

export default App;
