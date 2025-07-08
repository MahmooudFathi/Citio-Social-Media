import React, { useState, useRef } from "react";
import { useAuth } from "../Context/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ProfileEditModal = ({ isOpen, onClose }) => {
  const { user, setUser } = useAuth();
  const [username, setUsername] = useState(user?.localUserName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const updateUsernameMutation = useMutation({
    mutationFn: async (newUsername) => {
      const response = await axios.put(
        "https://graduation.amiralsayed.me/api/users/me",
        { userName: newUsername },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setUser((prev) => ({ ...prev, localUserName: data.userName }));
      queryClient.invalidateQueries(["user"]);
      toast.success("Username updated successfully! 🎉");
    },
    onError: (error) => {
      toast.error(
        `Error: ${error.response?.data?.message || "Failed to update username"}`
      );
    },
  });

  const updateBioMutation = useMutation({
    mutationFn: async (newBio) => {
      const response = await axios.put(
        "https://graduation.amiralsayed.me/api/users/me/bio",
        { newBio },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setUser((prev) => ({ ...prev, bio: data.bio }));
      queryClient.invalidateQueries(["user"]);
      toast.success("Bio updated successfully! 📝");
    },
    onError: (error) => {
      toast.error(
        `Error: ${error.response?.data?.message || "Failed to update bio"}`
      );
    },
  });

  const updateAvatarMutation = useMutation({
    mutationFn: async (avatarFile) => {
      const formData = new FormData();
      formData.append("avatar", avatarFile);
      const response = await axios.put(
        "https://graduation.amiralsayed.me/api/users/me/avatar",
        formData,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setUser((prev) => ({ ...prev, avatarUrl: data.avatarUrl }));
      queryClient.invalidateQueries(["user"]);
      toast.success("Avatar updated successfully! 🎉");
    },
    onError: (error) => {
      toast.error(
        `Error: ${error.response?.data?.message || "Failed to update avatar"}`
      );
    },
  });

  const updateCoverMutation = useMutation({
    mutationFn: async (coverFile) => {
      const formData = new FormData();
      formData.append("cover", coverFile);
      const response = await axios.put(
        "https://graduation.amiralsayed.me/api/users/me/cover",
        formData,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setUser((prev) => ({ ...prev, coverUrl: data.coverUrl }));
      queryClient.invalidateQueries(["user"]);
      toast.success("Cover updated successfully! 🎉");
    },
    onError: (error) => {
      toast.error(
        `Error: ${error.response?.data?.message || "Failed to update cover"}`
      );
    },
  });

  const handleUpdate = async () => {
    let promises = [];

    if (username.trim() && username !== user.localUserName) {
      promises.push(updateUsernameMutation.mutateAsync(username));
    }

    if (bio.trim() && bio !== user.bio) {
      promises.push(updateBioMutation.mutateAsync(bio));
    }

    const avatarFile = avatarInputRef.current?.files[0];
    if (avatarFile) {
      promises.push(updateAvatarMutation.mutateAsync(avatarFile));
    }

    const coverFile = coverInputRef.current?.files[0];
    if (coverFile) {
      promises.push(updateCoverMutation.mutateAsync(coverFile));
    }

    if (promises.length > 0) {
      try {
        await Promise.all(promises);
        onClose();
        navigate("/profile");
      } catch (error) {
        console.error("Error updating profile:", error);
      }
    } else {
      toast.info("No changes detected.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-300 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Your Info</h2>
        <button
          onClick={onClose}
          className="absolute cursor-pointer top-2 right-2 text-gray-700 hover:text-gray-900"
        >
          ✕
        </button>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">User Name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="User Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write something about yourself..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Profile Image</label>
            <input
              type="file"
              ref={avatarInputRef}
              accept="image/*"
              className="mt-1 p-2 w-full border cursor-pointer border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cover Image</label>
            <input
              type="file"
              ref={coverInputRef}
              accept="image/*"
              className="mt-1 p-2 w-full border cursor-pointer border-gray-300 rounded-md"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 cursor-pointer border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="px-4 py-2 bg-blue-600 cursor-pointer text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={
              updateUsernameMutation.isLoading ||
              updateBioMutation.isLoading ||
              updateAvatarMutation.isLoading ||
              updateCoverMutation.isLoading
            }
          >
            {updateUsernameMutation.isLoading ||
            updateBioMutation.isLoading ||
            updateAvatarMutation.isLoading ||
            updateCoverMutation.isLoading
              ? "Updating..."
              : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditModal;