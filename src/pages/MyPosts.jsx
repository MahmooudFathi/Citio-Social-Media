import React from "react";
import Header from "../components/Header";
import PostSide from "../components/PostSide";
import { useParams } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

function Feed() {
  const { userId } = useParams();
  const { user, userData } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["userProfile", userId || "me"],
    queryFn: async () => {
      const endpoint = userId
        ? `https://graduation.amiralsayed.me/api/users/${userId}`
        : `https://graduation.amiralsayed.me/api/users/me`;

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      return response.data;
    },
    enabled: !!user?.token, // بس نطلب البيانات لو userId موجود
  });

  if (isLoading) return <p>Loading profile...</p>;
  if (error) return <p>Error loading profile</p>;
  const userProfile = userId ? data : userData;

  return (
    <div className="min-h-screen bg-gray-50 font-family-sans">
      <Header />
      <main className="md:max-w-3xl mx-auto px-4 py-6">
        <PostSide userId={userProfile.centralUsrId} />
      </main>
    </div>
  );
}

export default Feed;
