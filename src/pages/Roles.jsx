import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../Context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import ProfileImage from "../assets/pngtree-male-avatar-vector-icon-png-image_691612.jpg";
import { Link } from "react-router-dom";
import Header from "../components/Header";

const Roles = () => {
  const { usersData, user } = useAuth();
  const [roleSelections, setRoleSelections] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();
  const usersPerPage = 5;

  const updateUserRole = async ({ token, userId, newRole }) => {
    try {
      const response = await axios.post(
        "https://graduation.amiralsayed.me/api/users/changeRole",
        { idToChange: userId, newRole },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to update role");
    }
  };

  const deleteUser = async ({ token, userId }) => {
    try {
      const response = await axios.delete(
        `https://graduation.amiralsayed.me/api/users/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to delete user");
    }
  };

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, newRole }) =>
      updateUserRole({ token: user.token, userId, newRole }),
    onSuccess: (_, variables) => {
      toast.success(`User role updated to ${variables.newRole}`);
      queryClient.invalidateQueries(["users"]);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: ({ userId }) => deleteUser({ token: user.token, userId }),
    onSuccess: (_, variables) => {
      toast.success("User deleted successfully");
      queryClient.invalidateQueries(["users"]);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleRoleChange = (userId, newRole) => {
    setRoleSelections((prev) => ({
      ...prev,
      [userId]: newRole,
    }));
  };

  const handleUpdateRole = (userId) => {
    const newRole =
      roleSelections[userId] || usersData.find((u) => u._id === userId)?.role;
    if (!newRole) return;
    updateRoleMutation.mutate({ userId, newRole });
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate({ userId });
    }
  };

  // فلترة وتصفية البيانات
  const filteredUsers = usersData
    ?.filter((user) => {
      const matchesSearch =
        user.localUserName?.includes(searchTerm) ||
        user.email?.includes(searchTerm);
      const matchesRole = filterRole === "All" || user.role === filterRole;
      return matchesSearch && matchesRole;
    })
    ?.sort((a, b) => a.localUserName.localeCompare(b.localUserName));

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers?.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil((filteredUsers?.length || 0) / usersPerPage);

  return (
    <div className="min-h-screen bg-gray-50 font-family-sans">
      <Header />
      <div className="min-h-screen bg-gray-100 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">All Users</h2>
        
        {/* Search and Filter Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 border bg-background-input border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 16.65z"
              />
            </svg>
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="p-2 border border-gray-200 cursor-pointer rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="All">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="superAdmin">SuperAdmin</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left text-gray-600 font-semibold">
                  Avatar
                </th>
                <th className="p-3 text-left text-gray-600 font-semibold">
                  Local Username
                </th>
                <th className="p-3 text-left text-gray-600 font-semibold">
                  Email
                </th>
                <th className="p-3 text-left text-gray-600 font-semibold">
                  Bio
                </th>
                <th className="p-3 text-left text-gray-600 font-semibold">
                  Role
                </th>
                <th className="p-3 text-left text-gray-600 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {currentUsers?.map((user) => (
                <tr
                  key={user._id}
                  className="border-t border-gray-200 hover:bg-gray-50"
                >
                  <td className="p-3">
                    <Link to={`/user/${user.centralUsrId}`}>
                      <img
                        loading="lazy"
                        src={
                          user.avatarUrl
                            ? `https://graduation.amiralsayed.me${user.avatarUrl}`
                            : ProfileImage
                        }
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = ProfileImage;
                        }}
                      />
                    </Link>
                  </td>
                  <td className="p-3">
                    <Link
                      to={`/user/${user.centralUsrId}`}
                      className="text-gray-900 font-medium hover:text-blue-600"
                    >
                      {user.localUserName}
                    </Link>
                  </td>
                  <td className="p-3 text-gray-600">{user.email}</td>
                  <td className="p-3 text-gray-600">{user.bio || "No bio"}</td>
                  <td className="p-3">
                    <select
                      value={roleSelections[user._id] || user.role}
                      onChange={(e) =>
                        handleRoleChange(user._id, e.target.value)
                      }
                      className="p-1 border border-gray-200 cursor-pointer rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 text-gray-900"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="superAdmin">SuperAdmin</option>
                    </select>
                  </td>
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => handleUpdateRole(user._id)}
                      disabled={
                        updateRoleMutation.isLoading &&
                        updateRoleMutation.variables?.userId === user._id
                      }
                      className="px-2 py-1 bg-blue-600 text-white cursor-pointer rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {updateRoleMutation.isLoading &&
                      updateRoleMutation.variables?.userId === user._id
                        ? "Updating..."
                        : "Change Role"}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      disabled={
                        deleteUserMutation.isLoading &&
                        deleteUserMutation.variables?.userId === user._id
                      }
                      className="px-2 py-1 bg-red-500 text-white cursor-pointer rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {deleteUserMutation.isLoading &&
                      deleteUserMutation.variables?.userId === user._id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {currentUsers?.length === 0 && (
            <p className="text-center text-gray-600 mt-4">No users found.</p>
          )}
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 mx-1 cursor-pointer bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 mx-1 rounded-md cursor-pointer ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {page}
                </button>
              )
            )}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 mx-1 cursor-pointer bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Roles;
