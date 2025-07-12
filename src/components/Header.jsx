import React, { useEffect, useRef, useState } from "react";
import { Search, Bell, Menu } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import ProfileImage from "../assets/pngtree-male-avatar-vector-icon-png-image_691612.jpg";

const Header = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const { userData } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  // Debounce للبحث
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (searchTerm.trim()) {
        setDebouncedSearchTerm(searchTerm);
        setShowResults(true);
      } else {
        setDebouncedSearchTerm("");
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm]);

  // جلب البوستات
  const fetchPosts = async (query) => {
    if (!query) return { data: [] };

    const token = localStorage.getItem("token") || "";
    const response = await axios.get(
      `https://graduation.amiralsayed.me/api/users/search?q=${encodeURIComponent(
        query
      )}&limit=10`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to search users");
    }

    return response.data;
  };

  const {
    data: searchResults,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["searchUsers", debouncedSearchTerm],
    queryFn: () => fetchPosts(debouncedSearchTerm),
    enabled: debouncedSearchTerm.length > 0,
    staleTime: 1000 * 60,
    keepPreviousData: true,
  });

  // إغلاق النتائج عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-citio-blue">
              <h1 className="text-3xl font-bold">Citio</h1>
            </Link>
            {/* Hamburger Menu للموبايل */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-citio-gray hover:text-citio-blue p-2 cursor-pointer"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation Links - تظهر في الديسكتوب وتتحول لمنيو في الموبايل */}
          <nav
            className={`${
              isMenuOpen ? "block" : "hidden"
            } md:flex md:items-center space-x-6 absolute md:static top-14 left-0 w-full bg-white md:w-auto md:bg-transparent p-4 md:p-0 shadow-md md:shadow-none z-40`}
          >
            <Link
              to="/"
              className={`pb-2 px-1 font-medium hover:text-citio-blue/80 transition-colors ${
                currentPath === "/"
                  ? "text-citio-blue border-b-2 border-citio-blue"
                  : ""
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Feed
            </Link>
            <Link
              to="/city"
              className={`hover:text-citio-blue/80 pb-2 px-1 font-medium transition-colors ${
                currentPath === "/city"
                  ? "text-citio-blue border-b-2 border-citio-blue"
                  : ""
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              City
            </Link>
            <Link
              to="/my-posts"
              className={`hover:text-citio-blue/80 pb-2 px-1 font-medium transition-colors ${
                currentPath === "/my-posts"
                  ? "text-citio-blue border-b-2 border-citio-blue"
                  : ""
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              My Posts
            </Link>
            <Link
              to="/profile"
              className={`hover:text-citio-blue/80 pb-2 px-1 font-medium transition-colors ${
                currentPath === "/profile"
                  ? "text-citio-blue border-b-2 border-citio-blue"
                  : ""
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Profile
            </Link>
            {userData?.role !== "user" && (
              <Link
                to="/role"
                className={`hover:text-citio-blue/80 pb-2 px-1 font-medium transition-colors ${
                  currentPath === "/role"
                    ? "text-citio-blue border-b-2 border-citio-blue"
                    : ""
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Roles
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            <div className="relative" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-citio-gray" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() =>
                  searchTerm.trim().length > 0 && setShowResults(true)
                }
                className="bg-background-card rounded-full border border-gray-300 py-2 pl-10 pr-4 w-full sm:w-48 md:w-64 focus:outline-none focus:ring-2 focus:ring-citio-blue focus:bg-white transition-colors"
              />
              {showResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                  {isLoading ? (
                    <div className="p-2 text-citio-secondary">Searching...</div>
                  ) : error ? (
                    <div className="p-2 text-red-500">
                      Error: {error.message}
                    </div>
                  ) : searchResults?.data?.length > 0 ? (
                    searchResults.data.map((user) => (
                      <Link
                        to={`/user/${user.centralUsrId}`}
                        key={user._id}
                        className="flex items-center p-2 hover:bg-citio-bg transition-colors"
                        onClick={() => setShowResults(false)}
                      >
                        <img
                          src={
                            user.avatarUrl
                              ? `https://graduation.amiralsayed.me${user.avatarUrl}`
                              : ProfileImage
                          }
                          alt={user.localUserName}
                          className="w-10 h-10 rounded-full object-cover mr-2"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = ProfileImage;
                          }}
                        />
                        <div>
                          <p className="text-citio-dark font-medium">
                            {user.localUserName.slice(0, 15)}
                          </p>
                          <p className="text-citio-secondary text-sm">
                            {user.userName.slice(0, 20)}
                          </p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="p-2 text-citio-secondary">
                      No posts found
                    </div>
                  )}
                </div>
              )}
            </div>
            <Link to="/profile">
              <img
                loading="lazy"
                src={
                  userData?.avatarUrl
                    ? `https://graduation.amiralsayed.me${userData.avatarUrl}`
                    : ProfileImage
                }
                alt="Profile"
                className="w-8 h-8 rounded-full border-2 border-gray-200 hover:border-citio-blue transition-colors cursor-pointer sm:w-7 sm:h-7"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = ProfileImage;
                }}
              />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
