import React, { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HiOutlinePhoto } from "react-icons/hi2";
import { PiPlayCircle } from "react-icons/pi";
import { AiOutlineClose } from "react-icons/ai";
import { useAuth } from "../Context/AuthContext";

const PostShare = () => {
  const [postCaption, setPostCaption] = useState("");
  const [tag, setTag] = useState("");
  const [images, setImages] = useState([]);
  const imageRef = useRef();
  const queryClient = useQueryClient();
  const { userData } = useAuth();
  const token = localStorage.getItem("token");

  const mutation = useMutation({
    mutationFn: async (newPost) => {
      const formData = new FormData();
      formData.append("postCaption", newPost.postCaption);
      formData.append("tag", newPost.tag);

      if (newPost.media && newPost.media.length > 0) {
        newPost.media.forEach((file) => {
          formData.append("media", file);
        });
      }

      const endpoint =
        userData?.role === "admin" || userData?.role === "superAdmin"
          ? "https://graduation.amiralsayed.me/api/posts/admin"
          : "https://graduation.amiralsayed.me/api/posts";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to upload post");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["posts"]);
      queryClient.invalidateQueries(["userPosts", userData?._id]);
      setPostCaption("");
      setImages([]);
    },
    onError: (error) => {
      console.error("Post upload failed:", error.message);
      alert("حدث خطأ أثناء النشر!");
    },
  });

  const onImageChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFiles = Array.from(event.target.files);
      if (images.length + selectedFiles.length > 5) {
        alert("يمكنك رفع 5 صور كحد أقصى!");
        return;
      }
      setImages([...images, ...selectedFiles]);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleShare = () => {
    if (!postCaption.trim() && images.length === 0) {
      alert("يجب إدخال نص أو صورة!");
      return;
    }
    mutation.mutate({ postCaption, media: images, tag });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleShare();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <img
          src={
            userData && userData.avatarUrl
              ? `https://graduation.amiralsayed.me${userData.avatarUrl}`
              : "/images/avatar.jpg"
          }
          alt="Your profile"
          className="w-10 h-10 rounded-full border-2 border-background-card"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/images/avatar.jpg";
          }}
        />
        <input
          type="text"
          placeholder="What's on your mind?"
          value={postCaption}
          onChange={(e) => setPostCaption(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-background-card border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-citio-blue focus:bg-white transition-colors text-citio-gray"
        />
      </div>
      <div className="mb-4">
        <input
          type="text"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="مثلاً: Alert أو Media أو أي تصنيف"
          className="w-full bg-background-card border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-citio-blue"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div
            className="option flex items-center space-x-2 text-citio-green hover:text-citio-green/80 text-sm font-medium transition-colors cursor-pointer"
            onClick={() => imageRef.current.click()}
          >
            <HiOutlinePhoto className="w-5 h-5" />
            <span>Photo</span>
          </div>
          <div className="option flex items-center cursor-pointer space-x-2 text-citio-blue hover:text-citio-blue/80 text-sm font-medium transition-colors">
            <span>😊 Feeling</span>
          </div>
          <div style={{ display: "none" }}>
            <input
              type="file"
              name="myImage"
              ref={imageRef}
              multiple
              accept="image/*"
              onChange={onImageChange}
            />
          </div>
        </div>
        <button
          className="bg-citio-blue text-white px-4 py-2 rounded-lg hover:bg-citio-blue/90 hover:cursor-pointer transition-colors font-medium"
          onClick={handleShare}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Posting..." : "Post"}
        </button>
      </div>
      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {images.map((img, index) => (
            <div key={index} className="relative">
              <AiOutlineClose
                className="absolute top-1 right-1 w-5 h-5 text-white bg-gray-800 rounded-full p-0.5 cursor-pointer hover:bg-gray-600"
                onClick={() => removeImage(index)}
              />
              <img
                src={URL.createObjectURL(img)}
                alt={`Preview ${index}`}
                className="w-full h-24 object-cover rounded-lg"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostShare;
