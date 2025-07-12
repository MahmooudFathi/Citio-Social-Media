import React from "react";
import axios from "axios";
import Post from "./Post";
import { useInfiniteQuery } from "@tanstack/react-query";
import InfiniteScroll from "react-infinite-scroll-component";
import toast from "react-hot-toast";
import { useAuth } from "../Context/AuthContext"

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
    toast.error("Error fetching user:", error);
    return { name: "Unknown", avatarUrl: null }; // بيانات افتراضية عند الفشل
  }
};

const fetchPosts = async ({ pageParam = 1, scope, isProfilePage, userId, token }) => {
  if (!token) throw new Error("Unauthorized: No Token Found");

  const url = isProfilePage
    ? `https://graduation.amiralsayed.me/api/posts/user/${userId}`
    : "https://graduation.amiralsayed.me/api/posts";

  try {
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: isProfilePage
        ? { page: pageParam, limit: 10 }
        : {
            page: pageParam,
            limit: 10,
            scope: scope || undefined,
          },
    });

    const posts = res.data.data;

    // جلب بيانات المستخدم لكل منشور
    const postsWithUserData = await Promise.all(
      posts.map(async (post) => {
        const userData = await fetchUser(post.author, token);
        return { ...post, user: userData };
      })
    );

    return {
      posts: postsWithUserData,
      nextPage: posts.length < 10 ? null : pageParam + 1,
    };
  } catch (error) {
    if (isProfilePage && error.response?.status === 404) {
      // المستخدم لسه معندوش بوستات
      return { posts: [], nextPage: null }; // ✅ رجّع Array فاضية بدال ما ترمي Error
    }
    throw error; // أي خطأ تاني نرميه عادي
  }
};

const Posts = ({ scope, userId }) => {
  const isProfilePage = !!userId;
  const { userData } = useAuth();
  const token = userData?.token || localStorage.getItem("token");
  const { data, fetchNextPage, hasNextPage, isLoading, error } =
    useInfiniteQuery({
      queryKey: isProfilePage ? ["userPosts", userId] : ["posts", scope],
      queryFn: ({ pageParam = 1 }) =>
        fetchPosts({ pageParam, scope, isProfilePage, userId, token }),
      getNextPageParam: (lastPage) => lastPage.nextPage,
      staleTime: 5000,
    });

  if (isLoading)
    return <p className="text-center text-gray-500">Loading posts...</p>;
  if (error)
    return (
      <p className="text-center text-red-500 font-semibold">
        Error loading posts: {error.message} ,
        <strong> Please Refresh The Page</strong>
      </p>
    );

  const allPosts = data?.pages.flatMap((page) => page.posts) || [];

  return (
    <div className="flex flex-col gap-4">
      {isProfilePage && allPosts.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          <p>No Posts yet.</p>
        </div>
      ) : (
        <InfiniteScroll
          dataLength={allPosts.length}
          next={fetchNextPage}
          hasMore={!!hasNextPage}
          loader={
            <h4 className="text-center text-gray-500 mt-5">
              Loading more posts...
            </h4>
          }
          endMessage={<p className="text-center text-gray-500 py-4">No more posts</p>}
          className="flex flex-col gap-4"
        >
          {allPosts.map((post, index) => (
            <Post data={post} id={index} key={post._id || index} />
          ))}
        </InfiniteScroll>
      )}
    </div>
  );
};

export default Posts;
