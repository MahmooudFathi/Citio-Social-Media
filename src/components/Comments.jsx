import "./Comments.css";
import React, { useEffect, useRef, useState } from "react";
import Profile from "../assets/pngtree-male-avatar-vector-icon-png-image_691612.jpg";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { GoHeart, GoHeartFill } from "react-icons/go";
import { IoClose } from "react-icons/io5";
import { MdMoreVert } from "react-icons/md";
import { FaPen, FaReply } from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuth } from "../Context/AuthContext";

const BASE_URL = "https://graduation.amiralsayed.me/api/comments";

function formatUsername(username) {
  if (!username) return "";
  return username
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\d+$/, "");
}

const fetchUser = async (userId, token) => {
  try {
    const res = await axios.get(
      `https://graduation.amiralsayed.me/api/users/${userId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  } catch (error) {
    console.error("Error fetching user:", error);
    return { name: "Unknown", avatarUrl: null };
  }
};

const fetchComments = async ({ queryKey, token }) => {
  try {
    const [, postId] = queryKey;
    const res = await axios.get(`${BASE_URL}/post/${postId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const comments = res.data;
    const commentsWithUserData = await Promise.all(
      comments.map(async (comment) => {
        const userData = await fetchUser(comment.userId);
        return { ...comment, user: userData };
      })
    );
    return commentsWithUserData;
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
};

const postComment = async ({ postId, content, parentCommentId, token }) => {
  return axios.post(
    `${BASE_URL}/post/${postId}`,
    { content, parentCommentId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};

const deleteComment = async (commentId, token) => {
  return axios.delete(`${BASE_URL}/${commentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

const updateComment = async ({ commentId, content, token }) => {
  return axios.put(
    `${BASE_URL}/${commentId}`,
    { content },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};

const reactToComment = async ({ commentId, impressionType, token }) => {
  return axios.post(
    `${BASE_URL}/${commentId}/reactions`,
    { impressionType },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};

const isArabic = (text) => /[\u0600-\u06FF]/.test(text);

const Comments = ({ postId }) => {
  const queryClient = useQueryClient();
  const textareaRef = useRef(null);
  const replyInputRef = useRef(null);
  const writeRef = useRef(null);
  const [editMode, setEditMode] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [editContent, setEditContent] = useState("");
  const { userData } = useAuth();
  const token = userData?.token || localStorage.getItem("token");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const menuRef = useRef(null);

  const { data: comments = [], isPending } = useQuery({
    queryKey: ["comments", postId],
    queryFn: fetchComments,
    enabled: !!postId,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (editMode !== null && textareaRef.current) {
      textareaRef.current.focus();
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [editMode]);

  useEffect(() => {
    if (replyTo === null) return;
    document.addEventListener("click", (event) => {
      if (writeRef.current && !writeRef.current.contains(event.target)) {
        setReplyTo(null);
      }
    });
    return () =>
      document.removeEventListener("click", (event) => {
        if (writeRef.current && !writeRef.current.contains(event.target)) {
          setReplyTo(null);
        }
      });
  }, [replyTo]);

  useEffect(() => {
    if (replyTo !== null) {
      setNewComment("");
      setTimeout(() => replyInputRef.current?.focus(), 0);
    }
  }, [replyTo]);

  useEffect(() => {
    document.addEventListener("click", (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpenId(null);
      }
    });
    return () =>
      document.removeEventListener("click", (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setMenuOpenId(null);
        }
      });
  }, []);

  const addCommentMutation = useMutation({
    mutationFn: postComment,
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      toast.success("Comment added successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to add comment");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: (data, variables) => {
      const deletedCommentId = variables;
      const parentCommentId = data.comment?.parentCommentId;
      queryClient.setQueryData(["comments", postId], (oldData) => {
        let updatedComments = oldData.filter(
          (comment) => comment._id !== deletedCommentId
        );
        if (parentCommentId) {
          updatedComments = updatedComments.map((comment) => {
            if (comment._id === parentCommentId) {
              return {
                ...comment,
                replies: comment.replies.filter(
                  (id) => id !== deletedCommentId
                ),
              };
            }
            return comment;
          });
        }
        return updatedComments;
      });
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
    onError: () => {
      toast.error("Failed to delete comment");
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: updateComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      toast.success("Comment updated successfully");
      setEditMode(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update comment");
    },
  });

  const updateCommentReplies = async ({ commentId, replies }) => {
    return axios.put(
      `${BASE_URL}/${commentId}`,
      { replies },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
  };

  const updateRepliesMutation = useMutation({
    mutationFn: updateCommentReplies,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });

  const reactMutation = useMutation({
    mutationFn: reactToComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });

  const handleSendComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate({
      postId,
      content: newComment,
      parentCommentId: replyTo,
    });
  };

  const handleDeleteComment = (commentId, parentCommentId) => {
    deleteCommentMutation.mutate(commentId, {
      onSuccess: () => {
        if (parentCommentId) {
          const parentComment = queryClient
            .getQueryData(["comments", postId])
            ?.find((c) => c._id === parentCommentId);
          if (parentComment) {
            const updatedReplies = parentComment.replies.filter(
              (id) => id !== commentId
            );
            updateRepliesMutation.mutate({
              commentId: parentCommentId,
              replies: updatedReplies,
            });
          }
        }
        toast.success("Comment deleted successfully");
      },
    });
  };

  const handleReact = (commentId, impressionType) => {
    reactMutation.mutate({ commentId, impressionType });
  };

  return (
    <div className="comments-container">
      <div className="write-comment" ref={writeRef}>
        <img
          loading="lazy"
          src={
            userData?.avatarUrl
              ? `https://graduation.amiralsayed.me${userData.avatarUrl}`
              : Profile
          }
          alt="Profile"
          className="w-10 h-10 rounded-full object-cover border border-background-card"
        />
        <input
          ref={replyInputRef}
          key={replyTo}
          type="text"
          placeholder={
            replyTo !== null ? "Write a reply..." : "Write a comment..."
          }
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 p-2 border border-background-card rounded-lg focus:outline-none focus:ring-2 focus:ring-text-primary bg-background-input text-text-primary"
        />
        <button
          onClick={handleSendComment}
          className="px-4 py-1 bg-text-primary text-white rounded-lg hover:bg-text-primary/90 hover:cursor-pointer transition-colors disabled:opacity-50"
          disabled={addCommentMutation.isPending}
        >
          {addCommentMutation.isPending ? "Sending..." : "Send"}
        </button>
      </div>
      {isPending && (
        <p className="text-center text-secondary-text">Loading comments...</p>
      )}
      {comments.length === 0 && !isPending && (
        <p className="text-center text-secondary-text">
          No comments found. Be the first to comment! 📝
        </p>
      )}
      {comments
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .filter((comment) => !comment.parentCommentId)
        .map((comment) => (
          <div
            key={comment._id}
            className="comment-card shadow-sm border border-background-card rounded-lg p-4 mb-4 bg-white"
          >
            <div className="flex items-start gap-3">
              <img
                loading="lazy"
                src={
                  comment.user.avatarUrl
                    ? `https://graduation.amiralsayed.me${comment.user.avatarUrl}`
                    : Profile
                }
                alt="User"
                className="w-10 h-10 rounded-full object-cover border border-background-card"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = Profile;
                }}
              />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-text-primary">
                      {formatUsername(comment.user.localUserName)}
                    </span>
                    <span className="text-sm text-secondary-text ml-2">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {userData?.centralUsrId === comment.userId && (
                    <div className="relative">
                      <MdMoreVert
                        className="text-secondary-text hover:text-text-primary cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(
                            menuOpenId === comment._id ? null : comment._id
                          );
                        }}
                      />
                      {menuOpenId === comment._id && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-background-card z-10"
                        >
                          <div
                            className="menu-item flex items-center px-4 py-2 text-sm text-text-primary hover:bg-background-card transition-colors"
                            onClick={() => {
                              setEditMode(comment._id);
                              setEditContent(comment.content);
                              setMenuOpenId(null);
                            }}
                          >
                            <FaPen className="mr-2" /> Edit
                          </div>
                          <div
                            className="menu-item flex items-center px-4 py-2 text-red-500 hover:bg-red-50 transition-colors"
                            onClick={() => {
                              setMenuOpenId(null);
                              handleDeleteComment(
                                comment._id,
                                comment.parentCommentId
                              );
                            }}
                          >
                            <IoClose className="mr-2" /> Delete
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {editMode === comment._id ? (
                  <div className="mt-2">
                    <textarea
                      ref={textareaRef}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-2 border border-background-card rounded-lg focus:outline-none focus:ring-2 focus:ring-text-primary bg-background-input text-text-primary min-h-[80px] resize-y"
                      dir={isArabic(comment.content) ? "rtl" : "ltr"}
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        className="px-3 py-1 bg-text-primary text-white rounded-lg hover:bg-text-primary/90 hover:cursor-pointer transition-colors"
                        onClick={() =>
                          updateCommentMutation.mutate({
                            commentId: editMode,
                            content: editContent,
                          })
                        }
                        disabled={updateCommentMutation.isPending}
                      >
                        {updateCommentMutation.isPending ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="px-3 py-1 border border-background-card rounded-lg hover:bg-gray-100 hover:cursor-pointer transition-colors"
                        onClick={() => setEditMode(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p
                    className="mt-2 text-secondary-text leading-relaxed"
                    dir={isArabic(comment.content) ? "rtl" : "ltr"}
                  >
                    {comment.content}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-4 text-sm text-secondary-text">
                  <button
                    onClick={() => handleReact(comment._id, "like")}
                    className="flex items-center gap-1 hover:text-text-primary hover:cursor-pointer"
                  >
                    {comment.reactions?.some(
                      (r) => r.impressionType === "like"
                    ) ? (
                      <GoHeartFill className="text-red-500" />
                    ) : (
                      <GoHeart />
                    )}
                    {comment.reactions?.length || 0}
                  </button>
                  <div className="flex items-center gap-2">
                    {comment.replies?.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedComments((prev) => {
                            const newSet = new Set(prev);
                            newSet.has(comment._id)
                              ? newSet.delete(comment._id)
                              : newSet.add(comment._id);
                            return newSet;
                          });
                        }}
                        className="flex items-center gap-1 hover:text-text-primary hover:cursor-pointer"
                      >
                        <span>{comment.replies.length} Replies</span>
                        <span
                          className={`transition-transform ${
                            expandedComments.has(comment._id)
                              ? "rotate-180"
                              : ""
                          }`}
                        >
                          ↓
                        </span>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setReplyTo(comment._id);
                      }}
                      className="flex items-center gap-1 hover:text-text-primary hover:cursor-pointer"
                    >
                      <FaReply /> Reply
                    </button>
                  </div>
                </div>
                {expandedComments.has(comment._id) && (
                  <div className="ml-12 mt-4">
                    {comments
                      .filter((reply) => reply.parentCommentId === comment._id)
                      .map((reply) => (
                        <div
                          key={reply._id}
                          className="comment-card shadow-sm border border-background-card rounded-lg p-3 mb-3 bg-white"
                        >
                          <div className="flex items-start gap-2">
                            <img
                              loading="lazy"
                              src={
                                reply.user.avatarUrl
                                  ? `https://graduation.amiralsayed.me${reply.user.avatarUrl}`
                                  : Profile
                              }
                              alt="User"
                              className="w-8 h-8 rounded-full object-cover border border-background-card"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = Profile;
                              }}
                            />
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-semibold text-text-primary">
                                    {formatUsername(reply.user.localUserName)}
                                  </span>
                                  <span className="text-xs text-secondary-text ml-2">
                                    {new Date(reply.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                {userData?.centralUsrId === reply.userId && (
                                  <FaPen
                                    className="text-secondary-text hover:text-text-primary cursor-pointer"
                                    onClick={() => {
                                      setEditMode(reply._id);
                                      setEditContent(reply.content);
                                    }}
                                  />
                                )}
                              </div>
                              {editMode === reply._id ? (
                                <div className="mt-2">
                                  <textarea
                                    ref={textareaRef}
                                    value={editContent}
                                    onChange={(e) =>
                                      setEditContent(e.target.value)
                                    }
                                    className="w-full p-1 border border-background-card rounded-lg focus:outline-none focus:ring-2 focus:ring-text-primary bg-background-input text-text-primary min-h-[60px] resize-y"
                                    dir={
                                      isArabic(reply.content) ? "rtl" : "ltr"
                                    }
                                  />
                                  <div className="mt-1 flex gap-1">
                                    <button
                                      className="px-2 py-0.5 bg-text-primary text-white rounded-lg hover:bg-text-primary/90 hover:cursor-pointer transition-colors"
                                      onClick={() =>
                                        updateCommentMutation.mutate({
                                          commentId: editMode,
                                          content: editContent,
                                        })
                                      }
                                      disabled={updateCommentMutation.isPending}
                                    >
                                      {updateCommentMutation.isPending
                                        ? "Saving..."
                                        : "Save"}
                                    </button>
                                    <button
                                      className="px-2 py-0.5 border border-background-card rounded-lg hover:bg-gray-100 hover:cursor-pointer transition-colors"
                                      onClick={() => setEditMode(null)}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p
                                  className="mt-1 text-secondary-text text-sm"
                                  dir={isArabic(reply.content) ? "rtl" : "ltr"}
                                >
                                  {reply.content}
                                </p>
                              )}
                              <div className="mt-1 flex items-center gap-2 text-xs text-secondary-text">
                                <button
                                  onClick={() => handleReact(reply._id, "like")}
                                  className="flex items-center gap-1 hover:text-text-primary hover:cursor-pointer"
                                >
                                  {reply.reactions?.some(
                                    (r) => r.impressionType === "like"
                                  ) ? (
                                    <GoHeartFill className="text-red-500" />
                                  ) : (
                                    <GoHeart />
                                  )}
                                  {reply.reactions?.length || 0}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
};

export default Comments;
