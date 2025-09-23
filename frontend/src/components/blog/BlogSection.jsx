import React from 'react';
import Link from 'next/link';
import BlogCard from './BlogCard';
import { FiArrowRight, FiTrendingUp } from 'react-icons/fi';

const BlogSection = () => {
  // Sample blog posts data - in a real app, this would come from an API or CMS
  const featuredPost = {
    id: 1,
    title: "Revolutionizing Education: How SMIS Transforms School Management in 2025",
    excerpt: "Discover how our latest AI-powered features are helping schools worldwide streamline operations, improve student outcomes, and enhance parent engagement like never before.",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
    author: "Dr. Sarah Johnson",
    date: "2025-01-15",
    category: "Innovation",
    image: "/api/placeholder/800/400",
    slug: "revolutionizing-education-smis-2025"
  };

  const recentPosts = [
    {
      id: 2,
      title: "5 Ways Digital Attendance Tracking Improves School Efficiency",
      excerpt: "Learn how automated attendance systems reduce administrative burden and provide real-time insights into student engagement patterns.",
      content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      author: "Michael Chen",
      date: "2025-01-12",
      category: "Features",
      image: "/api/placeholder/600/300",
      slug: "digital-attendance-tracking-efficiency"
    },
    {
      id: 3,
      title: "Parent-Teacher Communication: Building Stronger School Communities",
      excerpt: "Explore how modern communication tools bridge the gap between home and school, fostering better student support systems.",
      content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      author: "Emily Rodriguez",
      date: "2025-01-10",
      category: "Community",
      image: "/api/placeholder/600/300",
      slug: "parent-teacher-communication-communities"
    },
    {
      id: 4,
      title: "Data Security in Education: Protecting Student Information",
      excerpt: "Understanding FERPA compliance and best practices for safeguarding sensitive educational data in the digital age.",
      content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      author: "David Kim",
      date: "2025-01-08",
      category: "Security",
      image: "/api/placeholder/600/300",
      slug: "data-security-education-student-protection"
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <FiTrendingUp className="w-6 h-6 text-primary-blue mr-2" />
            <span className="text-primary-blue font-semibold text-sm uppercase tracking-wide">
              Latest Updates
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            What's New at Our School Management Information System
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay updated with the latest features, educational insights, and success stories from schools using SMIS worldwide.
          </p>
        </div>

        {/* Featured Post */}
        <div className="mb-16">
          <div className="flex items-center mb-6">
            <div className="h-px bg-gradient-to-r from-primary-blue to-transparent flex-1"></div>
            <span className="px-4 text-sm font-semibold text-primary-blue uppercase tracking-wide">
              Featured Story
            </span>
            <div className="h-px bg-gradient-to-l from-primary-blue to-transparent flex-1"></div>
          </div>
          <BlogCard post={featuredPost} featured={true} />
        </div>

        {/* Recent Posts Grid */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Recent Articles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link 
            href="/blog"
            className="inline-flex items-center px-8 py-4 bg-primary-blue text-white rounded-xl font-semibold hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            View All Articles
            <FiArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16 bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Stay in the Loop
            </h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Get the latest SMIS updates, educational insights, and feature announcements delivered straight to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none"
              />
              <button className="px-6 py-3 bg-primary-blue text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Subscribe
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              No spam, unsubscribe at any time. We respect your privacy.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
