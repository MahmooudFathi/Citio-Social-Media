import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const EditPostModal = ({ postId, postData, onClose, onUpdate }) => {
  const [caption, setCaption] = useState(postData.postCaption || "");
  const [tags, setTags] = useState(
    postData.tags?.filter((tag) => tag && tag.trim() !== "") || []
  );
  const [availability, setAvailability] = useState(
    postData.availability || "public"
  );
  const [mediaFiles, setMediaFiles] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    setCaption(postData.postCaption || "");
    setTags(postData.tags?.filter((tag) => tag && tag.trim() !== "") || []);
    setAvailability(postData.availability || "public");
    setMediaFiles([]);
  }, [postData]);

  const handleCaptionUpdate = async () => {
    try {
      const response = await axios.put(
        `https://graduation.amiralsayed.me/api/posts/${postId}/caption`,
        { newCaption: caption },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Caption updated successfully! 🎉");
      onUpdate({ ...postData, postCaption: caption });
    } catch (error) {
      toast.error(
        "Error updating caption: " + (error.response?.data || error.message)
      );
    }
  };

  const handleTagUpdate = async () => {
    try {
      const originalTags =
        postData.tags?.filter((tag) => tag && tag.trim() !== "") || [];
      const newTags = tags.filter((tag) => tag && tag.trim() !== "");

      // الإضافة أولاً
      for (let newTag of newTags) {
        if (!originalTags.includes(newTag)) {
          await axios.post(
            `https://graduation.amiralsayed.me/api/posts/${postId}/tags`,
            { newTag },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          // تحديث الـ State لكن بدون تعديل يدوي لـ currentTags
          await new Promise((resolve) => setTimeout(resolve, 500)); // تأخير لضمان التحديث
        }
      }

      // التحديث (استبدال) إذا كان فيه تغيير
      for (let i = 0; i < originalTags.length; i++) {
        const oldTag = originalTags[i];
        const newTag = newTags[i];
        if (newTag && oldTag !== newTag) {
          await axios.put(
            `https://graduation.amiralsayed.me/api/posts/${postId}/tags`,
            { oldTag, newTag },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
        }
      }

      // الحذف بناءً على الـ originalTags فقط
      for (let oldTag of originalTags) {
        if (!newTags.includes(oldTag)) {
          await axios.delete(
            `https://graduation.amiralsayed.me/api/posts/${postId}/tags`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              data: { tagToDelete: oldTag }, // Body للـ DELETE
            }
          );
        }
      }

      toast.success("Tags updated successfully! 🎉");
      onUpdate({ ...postData, tags: newTags }); // تحديث النهائي
    } catch (error) {
      toast.error(
        "Error updating tags: " +
          (error.response?.data?.message || error.message)
      );
      console.log("Tag Update Error Details:", error.response?.data); // للتحقق من الـ Error
    }
  };

  const handleAvailabilityUpdate = async () => {
    try {
      const response = await axios.put(
        `https://graduation.amiralsayed.me/api/posts/${postId}/availability`,
        { newAvailability: availability },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Availability updated successfully! 🎉");
      onUpdate({ ...postData, availability });
    } catch (error) {
      toast.error(
        "Error updating availability: " +
          (error.response?.data || error.message)
      );
    }
  };

  const handleMediaUpdate = async () => {
    if (mediaFiles.length === 0) return;
    const formData = new FormData();
    formData.append("postCaption", caption);
    mediaFiles.forEach((file) => formData.append("media", file));

    try {
      const response = await axios.post(
        `https://graduation.amiralsayed.me/api/posts`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Post updated with new media! 🎉");
      onUpdate(response.data);
    } catch (error) {
      toast.error(
        "Error updating media: " + (error.response?.data || error.message)
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleCaptionUpdate();
    await handleTagUpdate();
    await handleAvailabilityUpdate();
    if (mediaFiles.length > 0) await handleMediaUpdate();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-300 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Post</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full p-2 border rounded"
              rows="3"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Tags (comma-separated)
            </label>
            <input
              value={tags.join(", ")}
              onChange={(e) =>
                setTags(
                  e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter((t) => t && t.trim() !== "")
                )
              }
              className="w-full p-2 border rounded"
              placeholder="e.g., tech, news"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Availability
            </label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="friends">Friends</option>
              <option value="specific_groups">Specific Groups</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Media (optional, up to 5 files)
            </label>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) =>
                setMediaFiles(Array.from(e.target.files).slice(0, 5))
              }
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPostModal;
