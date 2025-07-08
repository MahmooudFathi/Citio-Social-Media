import React from "react";
import Posts from "./Posts";
import PostShare from "./PostShare";
import { useLocation } from "react-router-dom";
const PostSide = ({ userId }) => {
  const location = useLocation();
  const scope = location.pathname === "/city" ? "admin" : "user";

  return (
    <div className="flex flex-col gap-0 h-100vh overflow-y-auto">
      {!userId && <PostShare scope={scope} />}
      <Posts scope={scope} userId={userId} />
    </div>
  );
};

export default PostSide;
