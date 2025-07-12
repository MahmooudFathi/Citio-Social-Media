import React, { useEffect, useRef, useState } from "react";
import {
  MoreHorizontal,
  ThumbsUp,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Edit2,
  Trash2,
  HeartCrack,
  Frown,
  HandHeart,
  Laugh,
} from "lucide-react";
import { useAuth } from "../Context/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axios from "axios";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";
import { Link } from "react-router-dom";
import ProfileImage from "../assets/pngtree-male-avatar-vector-icon-png-image_691612.jpg";
import { format } from "timeago.js";
import { MdVerified } from "react-icons/md";
import Comments from "./Comments";
import EditPostModal from "./EditPostModal";

const Post = ({ data }) => {
  // التحقق من إن impressionsCount موجود وصالح
  const impressionsCount = data?.impressionsCount || {
    like: 0,
    love: 0,
    care: 0,
    laugh: 0,
    sad: 0,
    hate: 0,
    total: 0,
  };
  const [commentOpen, setCommentOpen] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState(null);
  const userId = localStorage.getItem("userId");
  const { userData } = useAuth();
  const [shared, setShared] = useState(!!data?.shareList?.includes(userId));
  const [shareCount, setShareCount] = useState(data?.shareCount || 0);
  const [shareList, setShareList] = useState(data?.shareList || []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newCaption, setNewCaption] = useState(data?.postCaption || "");
  const [isSaved, setIsSaved] = useState(!!data?.saveList?.includes(userId));
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const menuRef = useRef(null);
  const textareaRef = useRef(null);
  const reactionRef = useRef(null);
  const toastId = useRef(null);
  const lightboxRef = useRef(null);
  const queryClient = useQueryClient();
  const token = userData?.token || localStorage.getItem("token");

  const isArabic = (text) => /[\u0600-\u06FF]/.test(text);

  function formatUsername(username) {
    if (!username) return "";
    return username
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .replace(/\d+$/, "");
  }

  // دالة جلب بيانات المستخدم
  const fetchUser = async (userId) => {
    try {
      const res = await axios.get(
        `https://graduation.amiralsayed.me/api/users/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res.data;
    } catch (error) {
      toast.error("Error fetching user:", error);
      return { name: "Unknown", avatarUrl: null }; // بيانات افتراضية عند الفشل
    }
  };

  const { data: originalAuthorData, isLoading: isLoadingOriginalAuthor } =
    useQuery({
      queryKey: ["user", data.originalPost?.originalAuthor],
      queryFn: () => fetchUser(data.originalPost.originalAuthor),
      enabled: !!data.sharedPost && !!data.originalPost?.originalAuthor,
      staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !event.target.closest(".menu-item")
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutsideLightbox = (event) => {
      if (
        isLightboxOpen &&
        lightboxRef.current &&
        !lightboxRef.current.contains(event.target) &&
        !event.target.closest(".closeLightbox")
      ) {
        setIsLightboxOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideLightbox);
    return () =>
      document.removeEventListener("mousedown", handleClickOutsideLightbox);
  }, [isLightboxOpen]);

  useEffect(() => {
    if (editMode && textareaRef.current) {
      textareaRef.current.focus();
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [editMode]);

  const deletePostMutation = useMutation({
    mutationFn: async () =>
      await axios.delete(
        `https://graduation.amiralsayed.me/api/posts/${data._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries(["posts"]);
      toast.success("Post deleted successfully! 🎉");
    },
    onError: (error) =>
      console.error(
        "Error deleting post:",
        error.response?.data || error.message
      ),
  });

  const likePostMutation = useMutation({
    mutationFn: async (reactionType) =>
      await axios.post(
        `https://graduation.amiralsayed.me/api/posts/${data._id}/reactions`,
        { reactionType },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries(["posts"]);
    },
    onError: (error) =>
      toast.error(
        "Error toggling reaction:",
        error.response?.data || error.message
      ),
  });

  const sharePostMutation = useMutation({
    mutationFn: async () =>
      await axios({
        method: shared ? "DELETE" : "POST",
        url: `https://graduation.amiralsayed.me/api/posts/${data._id}/shares`,
        headers: { Authorization: `Bearer ${token}` },
      }),
    onSuccess: (response) => {
      setShared(!shared);
      setShareList(response.data.post.shareList || []);
      setShareCount(response.data.post.shareCount || 0);
      queryClient.invalidateQueries(["posts"]);
    },
    onError: (error) =>
      console.error(
        "Error toggling share:",
        error.response?.data || error.message
      ),
  });

  const handleUpdateCaption = async () => {
    try {
      const response = await axios.put(
        `https://graduation.amiralsayed.me/api/posts/${data._id}/caption`,
        { newCaption },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Caption updated successfully! 🎉");
      setEditMode(false);
      queryClient.invalidateQueries(["posts"]);
    } catch (error) {
      console.error(
        "Error updating caption:",
        error.response?.data || error.message
      );
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleUpdateCaption();
    }
  };

  const savePostMutation = useMutation({
    mutationFn: async () => {
      setMenuOpen(false);
      return await axios.post(
        `https://graduation.amiralsayed.me/api/posts/${data._id}/saves`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
    },
    onSuccess: (response) => {
      setIsSaved(!!response.data.post.saveList.includes(userId));
      setTimeout(() => setMenuOpen(false), 100);
      if (toastId.current) toast.dismiss(toastId.current);
      toastId.current = toast.success(
        isSaved ? "Post removed from saved! ❌" : "Post saved successfully! 🎉",
        { autoClose: 2000 }
      );
      queryClient.invalidateQueries(["posts"]);
    },
    onError: (error) => {
      console.error(
        "Error toggling save:",
        error.response?.data || error.message
      );
      if (toastId.current) toast.dismiss(toastId.current);
      toastId.current = toast.error(
        `Error: ${error.response?.data?.message || "Something went wrong!"}`,
        { autoClose: 2000 }
      );
    },
  });

  const openLightbox = (index) => {
    setStartIndex(index);
    setIsLightboxOpen(true);
  };

  const galleryImages =
    data?.media?.map((mediaItem) => ({
      original: `https://graduation.amiralsayed.me${mediaItem.url}`,
      thumbnail: `https://graduation.amiralsayed.me${mediaItem.url}`,
    })) || [];

  const displayedImages = data?.media?.slice(0, 3) || [];
  const extraImagesCount = data?.media?.length > 3 ? data.media.length - 3 : 0;

  // حساب عدد الـ reactions بطريقة آمنة
  const totalReactions = Object.values(impressionsCount).reduce(
    (sum, value) => sum + (value || 0),
    0
  );

  const reactionIcons = {
    like: <ThumbsUp className="w-5 h-5" />,
    love: <Heart className="w-5 h-5" />,
    care: <HandHeart className="w-5 h-5" />,
    laugh: <Laugh className="w-5 h-5" />,
    sad: <Frown className="w-5 h-5" />,
    hate: <HeartCrack className="w-5 h-5" />,
  };

  const getUserReaction = () => {
    const userReaction = data?.impressionList?.find(
      (imp) => imp.userId === userId
    )?.impressionType;
    return userReaction || null;
  };

  // توليد لون عشوائي
  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // حالة لتخزين ألوان الـ Tags
  const [tagColors, setTagColors] = useState({});

  useEffect(() => {
    if (data?.tags) {
      const newTagColors = {};
      data.tags.forEach((tag) => {
        newTagColors[tag] = getRandomColor();
      });
      setTagColors(newTagColors);
    }
  }, [data?.tags]);

  const handleUpdate = (updatedData) => {
    // Update local state with new data
    Object.assign(data, updatedData);
    queryClient.invalidateQueries(["posts"]);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between p-4">
        <div className="flex items-center space-x-3">
          <img
            src={
              data?.user?.avatarUrl
                ? `https://graduation.amiralsayed.me${data.user.avatarUrl}`
                : ProfileImage
            }
            alt={data?.user?.name || "User"}
            className="w-12 h-12 rounded-full object-cover border-2 border-background-card"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = ProfileImage;
            }}
          />
          <div>
            <div className="flex items-center space-x-2">
              <Link
                to={`/user/${data?.user?.centralUsrId}`}
                className="font-semibold text-text-primary text-base hover:underline"
              >
                {data?.user?.localUserName
                  ? formatUsername(data.user.localUserName)
                  : "Loading..."}
              </Link>
              {data.sharedPost && data.originalPost && (
                <div className=" p-2 text-sm text-gray-700 flex items-center">
                  <span>shared a post from </span>
                  <Link
                    to={`/user/${data.originalPost.originalAuthor}`}
                    className="font-semibold pl-3 text-text-primary text-base hover:underline"
                  >
                    {isLoadingOriginalAuthor
                      ? "Loading..."
                      : originalAuthorData
                      ? formatUsername(originalAuthorData.localUserName)
                      : formatUsername(
                          data.originalPost.originalAuthor
                            .split("-")
                            .join("")
                            .slice(0, 10)
                        )}
                  </Link>
                </div>
              )}
              {userData?.role !== "user" && (
                <MdVerified className="text-blue-500 w-4 h-4" />
              )}
            </div>
            <p className="text-sm text-secondary-text">
              {format(data?.createdAt || new Date())}
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-secondary-text hover:text-text-primary p-2 rounded-full hover:bg-background-card transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 cursor-pointer" />
          </button>
          {menuOpen && (
            <div
              ref={menuRef}
              className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10"
            >
              <button
                onClick={() => savePostMutation.mutate()}
                className="flex items-center w-full px-4 py-2 text-sm text-text-primary cursor-pointer hover:bg-background-card transition-colors menu-item"
              >
                <Bookmark className="w-4 h-4 mr-2" />{" "}
                {isSaved ? "UnSave" : "Save"}
              </button>
              {data?.author === userData?.centralUsrId && (
                <>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center w-full px-4 py-2 cursor-pointer text-sm text-text-primary hover:bg-background-card transition-colors menu-item"
                  >
                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                  </button>
                  <button
                    onClick={() => deletePostMutation.mutate()}
                    className="flex items-center w-full px-4 py-2 cursor-pointer text-sm text-red-500 hover:bg-red-50 transition-colors menu-item"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="px-4 pb-4">
        {editMode ? (
          <div className="flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-text-primary resize-none"
              dir={isArabic(data?.postCaption) ? "rtl" : "ltr"}
            />
            <div className="flex gap-2">
              <button
                onClick={handleUpdateCaption}
                className="px-4 py-1 bg-text-primary text-white rounded-lg hover:bg-text-primary/90 hover:cursor-pointer transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="px-4 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 hover:cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p
            className="text-secondary-text leading-relaxed text-base"
            dir={isArabic(data?.postCaption) ? "rtl" : "ltr"}
          >
            {data?.postCaption || "No caption"}
          </p>
        )}
      </div>
      {/* Original Post Content (if it's a shared post) */}
      {data.sharedPost && data.originalPost && (
        <div className="mx-4 mb-4 border border-gray-200 rounded-lg bg-gray-50">
          {/* Original post header */}
          <div className="flex items-center space-x-3 p-3 border-b border-gray-200">
            <img
              src={
                originalAuthorData?.avatarUrl
                  ? `https://graduation.amiralsayed.me${originalAuthorData.avatarUrl}`
                  : ProfileImage
              } // يفضل إضافة صورة المستخدم الأصلي هنا
              alt={originalAuthorData?.name || "Original author"}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <Link
                to={`/user/${data.originalPost.originalAuthor}`}
                className="font-semibold text-text-primary text-sm hover:underline"
              >
                {isLoadingOriginalAuthor
                  ? "Loading..."
                  : originalAuthorData
                  ? formatUsername(originalAuthorData.localUserName)
                  : formatUsername(
                      data.originalPost.originalAuthor
                        .split("-")
                        .join("")
                        .slice(0, 10)
                    )}
              </Link>
            </div>
          </div>

          {/* Original post content */}
          <div className="p-3">
            <p
              className="text-secondary-text text-sm leading-relaxed"
              dir={isArabic(data.originalPost.caption) ? "rtl" : "ltr"}
            >
              {data.originalPost.caption || "No caption"}
            </p>

            {/* Original post media */}
            {data?.media && data.media.length > 0 && (
              <div className="mt-3">
                {data.media.length === 1 ? (
                  <div
                    className="flex justify-center cursor-pointer"
                    onClick={() => openLightbox(0)}
                  >
                    <img
                      src={`https://graduation.amiralsayed.me${data.media[0].url}`}
                      alt="Post media"
                      className="max-w-full max-h-[300px] rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1">
                    {displayedImages.map((mediaItem, index) => (
                      <div
                        key={index}
                        className="relative cursor-pointer group"
                        onClick={() => openLightbox(index)}
                      >
                        <img
                          src={`https://graduation.amiralsayed.me${mediaItem.url}`}
                          alt={`Post media ${index}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        {index === 2 && extraImagesCount > 0 && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white font-bold rounded-lg">
                            +{extraImagesCount}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {!data.sharedPost && data?.media && data.media.length > 0 && (
        <div className="mt-4">
          {data.media.length === 1 ? (
            <div
              className="flex justify-center cursor-pointer"
              onClick={() => openLightbox(0)}
            >
              <img
                src={`https://graduation.amiralsayed.me${data.media[0].url}`}
                alt="Post media"
                className="max-w-full max-h-[400px] rounded-lg"
              />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {displayedImages.map((mediaItem, index) => (
                <div
                  key={index}
                  className="relative cursor-pointer group"
                  onClick={() => openLightbox(index)}
                >
                  <img
                    src={`https://graduation.amiralsayed.me${mediaItem.url}`}
                    alt={`Post media ${index}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  {index === 2 && extraImagesCount > 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white font-bold rounded-lg">
                      +{extraImagesCount}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* قسم الـ Tags */}
      {data?.tags && data.tags.length > 0 && data.tags.every((tag) => tag) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {data.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-sm rounded-2xl text-white"
              style={{
                backgroundColor: tagColors[tag] || getRandomColor(),
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between px-4 py-2 border-t border-background-card">
        <div className="flex items-center space-x-2">
          <div className="flex -space-x-1">
            {Object.entries(impressionsCount)
              .filter(([_, count]) => count > 0)
              .slice(0, 3)
              .map(([type]) => (
                <div
                  key={type}
                  className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-white"
                  style={{
                    backgroundColor:
                      type === "love"
                        ? "#ef4444"
                        : type === "like"
                        ? "#3b82f6"
                        : type === "care"
                        ? "#10b981"
                        : type === "laugh"
                        ? "#f59e0b"
                        : type === "sad"
                        ? "#6b7280"
                        : "#ef4444",
                  }}
                >
                  {reactionIcons[type]}
                </div>
              ))}
          </div>
          <span className="text-sm text-secondary-text hover:text-text-primary cursor-pointer">
            {totalReactions} reactions
          </span>
        </div>
        <div className="flex items-center space-x-4 text-sm text-secondary-text">
          <span className="hover:text-text-primary cursor-pointer">
            {data?.comments?.length || 0} comments
          </span>
          <span className="hover:text-text-primary cursor-pointer">
            {shareCount} shares
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-2 border-t border-background-card">
        <div className="relative flex items-center space-x-2">
          <div
            ref={reactionRef}
            className="relative inline-block"
            onMouseEnter={() => setReactionOpen(true)}
            onMouseLeave={() => setReactionOpen(false)}
          >
            <button
              onClick={() => setReactionOpen(!reactionOpen)}
              className={`flex items-center space-x-2 px-4 py-1 rounded-lg hover:bg-background-card cursor-pointer transition-colors ${
                selectedReaction
                  ? `text-${
                      selectedReaction === "love"
                        ? "red"
                        : selectedReaction === "like"
                        ? "blue"
                        : selectedReaction === "care"
                        ? "green"
                        : selectedReaction === "laugh"
                        ? "yellow"
                        : selectedReaction === "sad"
                        ? "gray"
                        : "red"
                    }-500`
                  : "text-secondary-text"
              }`}
            >
              {selectedReaction ? (
                reactionIcons[selectedReaction]
              ) : (
                <Heart className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">React</span>
            </button>
            {reactionOpen && (
              <div
                ref={reactionRef}
                className="absolute bottom-full left-0 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10"
              >
                {Object.keys(reactionIcons).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      likePostMutation.mutate(type);
                      setSelectedReaction(type);
                      setReactionOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-text-primary cursor-pointer hover:bg-background-card transition-colors"
                  >
                    {reactionIcons[type]}
                    <span className="ml-2 capitalize">{type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setCommentOpen(!commentOpen)}
            className="flex items-center space-x-2 px-4 py-1 rounded-lg hover:bg-background-card cursor-pointer transition-colors text-secondary-text"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Comment</span>
          </button>
          <button
            onClick={() => sharePostMutation.mutate()}
            className={`flex items-center space-x-2 px-4 py-1 rounded-lg hover:bg-background-card cursor-pointer transition-colors ${
              shared ? "text-green-500" : "text-secondary-text"
            }`}
          >
            <Share2 className="w-5 h-5" />
            <span className="text-sm font-medium">Share</span>
          </button>
        </div>
        <button
          onClick={() => savePostMutation.mutate()}
          className={`p-2 rounded-lg hover:bg-background-card cursor-pointer transition-colors ${
            isSaved ? "text-yellow-300" : "text-secondary-text"
          }`}
        >
          <Bookmark className="w-5 h-5" />
        </button>
      </div>
      {commentOpen && <Comments postId={data?._id} />}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 w-screen h-screen bg-black bg-opacity-90 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-transparent"
            onClick={(e) => e.stopPropagation()}
            ref={lightboxRef}
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 text-white text-3xl font-bold bg-text-primary rounded-full w-10 h-10 flex items-center justify-center closeLightbox"
            >
              ×
            </button>
            <ImageGallery
              items={galleryImages}
              startIndex={startIndex}
              showThumbnails={true}
              showPlayButton={false}
              showFullscreenButton={false}
            />
          </div>
        </div>
      )}
      {isModalOpen && (
        <EditPostModal
          postId={data._id}
          postData={data}
          onClose={() => setIsModalOpen(false)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};

export default Post;
