import React from "react";
import Header from "../components/Header";
import PostSide from "../components/PostSide";

function City() {
  
  return (
    <div className="min-h-screen bg-gray-50 font-family-sans">
      <Header />
      <main className="md:max-w-3xl mx-auto px-4 py-6">
        <PostSide/>
      </main>
    </div>
  );
}

export default City;
