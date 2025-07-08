import React, { useEffect, useState } from "react";
import {
  Edit,
  Share,
  Bookmark,
  Users,
  Calendar,
  StickyNote,
} from "lucide-react";
import Header from "../components/Header"; // استدعاء مكون الهيدر الموجود
import Post from "../components/Post"; // استدعاء مكون البوستات
import ProfileEditModal from "../components/ProfileEditModal"; // استدعاء مكون تعديل الملف الشخصي
import { useAuth } from "../Context/AuthContext";
import axios from "axios";

function formatUsername(username) {
  if (!username) return "";
  let formattedUsername = username
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
  return formattedUsername.replace(/\d+$/, "");
}
// دالة لتنسيق التاريخ
const formatDate = (dateString) => {
  if (!dateString) return "";
  return dateString.split("T")[0]; // تقطيع عند T وأخذ الجزء الأول (التاريخ فقط)
};

const fetchUser = async (userId) => {
  try {
    const res = await axios.get(
      `https://graduation.amiralsayed.me/api/users/${userId}`,
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    return res.data;
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return { name: "Unknown", avatarUrl: null }; // بيانات افتراضية لو فشل
  }
};
const ProfilePage = () => {
  const token = localStorage.getItem("token");
  const [selectedTab, setSelectedTab] = useState("My Posts");
  const [postsData, setPostsData] = useState({
    myPosts: [],
    sharedPosts: [],
    savedPosts: [],
  });
  const { userData } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false); // حالة المودال
  const userId = userData?.centralUsrId;
  const profileData = {
    name: formatUsername(userData?.localUserName),
    email: userData?.email,
    bio: userData?.bio,
    friends: userData?.friends.length ?? 0,
    joinDate: formatDate(userData?.createdAt),
    avatar: `https://graduation.amiralsayed.me${userData?.avatarUrl}`,
    coverImage: `https://graduation.amiralsayed.me${userData?.coverImageUrl}`,
    stats: {
      postsCreated: userData?.posts.length ?? 0,
      sharedPosts: userData?.sharedPosts.length ?? 0,
      savedPosts: userData?.savedPosts.length ?? 0,
    },
  };

  const tabs = ["My Posts", "Shared Posts", "Saved Posts"];

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // جلب My Posts مع معالجة الأخطاء
        const myPostsPromises = (userData?.posts || []).map(async (postId) => {
          try {
            const res = await axios.get(
              `https://graduation.amiralsayed.me/api/posts/${postId}`,
              {
                headers: {
                  Authorization: `Bearer ${
                    token || localStorage.getItem("token")
                  }`,
                },
              }
            );
            const authorId = res.data.data.author;
            const userData = await fetchUser(authorId);
            return { ...res.data.data, user: userData };
          } catch (error) {
            console.error(`Error fetching post ${postId}:`, error);
            return null; // تجاهل البوست اللي فيه خطأ
          }
        });
        const myPostsRes = await Promise.all(myPostsPromises);
        const myPostsData = myPostsRes.filter((post) => post !== null);

        // جلب Shared Posts مع معالجة الأخطاء
        const sharedPostsPromises = (userData?.sharedPosts || []).map(
          async (shared) => {
            try {
              const res = await axios.get(
                `https://graduation.amiralsayed.me/api/posts/${shared.postId}`,
                {
                  headers: {
                    Authorization: `Bearer ${
                      token || localStorage.getItem("token")
                    }`,
                  },
                }
              );
              const authorId = res.data.data.author;
              const userData = await fetchUser(authorId);
              return { ...res.data.data, user: userData };
            } catch (error) {
              console.error(
                `Error fetching shared post ${shared.postId}:`,
                error
              );
              return null;
            }
          }
        );
        const sharedPostsRes = await Promise.all(sharedPostsPromises);
        const sharedPostsData = sharedPostsRes.filter((post) => post !== null);

        // جلب Saved Posts مع معالجة الأخطاء
        const savedPostsPromises = (userData?.savedPosts || []).map(
          async (postId) => {
            try {
              const res = await axios.get(
                `https://graduation.amiralsayed.me/api/posts/${postId}`,
                {
                  headers: {
                    Authorization: `Bearer ${
                      token || localStorage.getItem("token")
                    }`,
                  },
                }
              );
              const authorId = res.data.data.author;
              const userData = await fetchUser(authorId);
              return { ...res.data.data, user: userData };
            } catch (error) {
              console.error(`Error fetching saved post ${postId}:`, error);
              return null;
            }
          }
        );
        const savedPostsRes = await Promise.all(savedPostsPromises);
        const savedPostsData = savedPostsRes.filter((post) => post !== null);

        setPostsData({
          myPosts: myPostsData,
          sharedPosts: sharedPostsData,
          savedPosts: savedPostsData,
        });
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    if (userData && token) fetchPosts();
  }, [userData, token]);

  return (
    <div className="min-h-screen bg-gray-50 font-family-sans">
      {/* استدعاء مكون الهيدر */}
      <Header />

      {/* Cover Section */}
      <div className="relative">
        <div
          className="h-64 sm:h-80 md:h-96 bg-cover bg-center relative overflow-hidden"
          style={{
            backgroundImage: `url(${profileData.coverImage})`,
          }}
        ></div>

        {/* Profile Info */}
        <div className="relative -mt-12 sm:-mt-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="relative">
                <img
                  src={profileData.avatar}
                  alt={profileData.name}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-lg"
                />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {profileData.name}
                    </h2>
                    <p className="text-gray-600 text-base sm:text-lg">
                      {profileData.email}
                    </p>
                    <p className="text-gray-700 mt-1">{profileData.bio}</p>
                    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-2 text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {profileData.joinDate}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{profileData.friends}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-citio-blue text-white cursor-pointer px-4 sm:px-6 py-2 rounded-lg hover:bg-citio-blue/90 transition-colors flex items-center space-x-2 w-full sm:w-auto"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-blue-50 hover:bg-blue-100 rounded-lg p-4 sm:p-6 text-center cursor-pointer">
            <div className="text-citio-blue mb-2">
              <StickyNote className="w-6 sm:w-8 h-6 sm:h-8 mx-auto" />
            </div>
            <div className="text-xl sm:text-3xl font-bold text-citio-blue">
              {profileData.stats.postsCreated}
            </div>
            <div className="text-gray-600">Posts Created</div>
          </div>
          <div className="bg-green-50 hover:bg-green-100 rounded-lg p-4 sm:p-6 text-center cursor-pointer">
            <div className="text-green-500 mb-2">
              <Share className="w-6 sm:w-8 h-6 sm:h-8 mx-auto" />
            </div>
            <div className="text-xl sm:text-3xl font-bold text-green-600">
              {profileData.stats.sharedPosts}
            </div>
            <div className="text-gray-600">Shared Posts</div>
          </div>
          <div className="bg-yellow-50 hover:bg-yellow-100 rounded-lg p-4 sm:p-6 text-center cursor-pointer">
            <div className="text-yellow-500 mb-2">
              <Bookmark className="w-6 sm:w-8 h-6 sm:h-8 mx-auto" />
            </div>
            <div className="text-xl sm:text-3xl font-bold text-yellow-600">
              {profileData.stats.savedPosts}
            </div>
            <div className="text-gray-600">Saved Posts</div>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-0">
              {tabs.map((tab, index) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`flex-1 py-4 px-6 text-center cursor-pointer font-medium transition-colors ${
                    selectedTab === tab
                      ? "border-b-2 border-citio-blue text-citio-blue bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {tab === "My Posts" && (
                    <StickyNote className="w-5 h-5 inline mr-2" />
                  )}
                  {tab === "Shared Posts" && (
                    <Share className="w-5 h-5 inline mr-2" />
                  )}
                  {tab === "Saved Posts" && (
                    <Bookmark className="w-5 h-5 inline mr-2" />
                  )}
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Posts Content */}
          <div className="p-6">
            {selectedTab === "My Posts" && (
              <div className="space-y-6">
                {postsData.myPosts.map((post) => (
                  <Post key={post._id} data={post} />
                ))}
              </div>
            )}
            {selectedTab === "Shared Posts" && (
              <div className="space-y-6">
                {postsData.sharedPosts.map((post) => (
                  <Post key={post._id} data={post} />
                ))}
              </div>
            )}
            {selectedTab === "Saved Posts" && (
              <div className="space-y-6">
                {postsData.savedPosts.map((post) => (
                  <Post key={post._id} data={post} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Modal */}
      <ProfileEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default ProfilePage;
