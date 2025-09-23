import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import BlogCard from '../../components/blog/BlogCard';
import { FiSearch, FiFilter, FiGrid, FiList, FiTrendingUp, FiBookOpen } from 'react-icons/fi';

const BlogPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Sample blog posts data - in a real app, this would come from an API
  const allPosts = [
    {
      id: 1,
      title: "Revolutionizing Education: How SMIS Transforms School Management in 2025",
      excerpt: "Discover how our latest AI-powered features are helping schools worldwide streamline operations, improve student outcomes, and enhance parent engagement like never before.",
      content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      author: "Dr. Sarah Johnson",
      date: "2025-01-15",
      category: "Innovation",
      image: "/api/placeholder/800/400",
      slug: "revolutionizing-education-smis-2025"
    },
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
    },
    {
      id: 5,
      title: "The Future of Gradebooks: AI-Powered Assessment Tools",
      excerpt: "Explore how artificial intelligence is revolutionizing student assessment and providing deeper insights into learning patterns.",
      content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      author: "Prof. Lisa Wang",
      date: "2025-01-05",
      category: "Innovation",
      image: "/api/placeholder/600/300",
      slug: "future-gradebooks-ai-assessment-tools"
    },
    {
      id: 6,
      title: "Mobile-First School Management: Apps That Work",
      excerpt: "Discover how mobile-optimized interfaces are making school management more accessible for administrators, teachers, and parents.",
      content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      author: "Alex Thompson",
      date: "2025-01-03",
      category: "Features",
      image: "/api/placeholder/600/300",
      slug: "mobile-first-school-management-apps"
    }
  ];

  const categories = [
    { value: 'all', label: 'All Articles', count: allPosts.length },
    { value: 'Innovation', label: 'Innovation', count: allPosts.filter(p => p.category === 'Innovation').length },
    { value: 'Features', label: 'Features', count: allPosts.filter(p => p.category === 'Features').length },
    { value: 'Community', label: 'Community', count: allPosts.filter(p => p.category === 'Community').length },
    { value: 'Security', label: 'Security', count: allPosts.filter(p => p.category === 'Security').length }
  ];

  // Filter posts based on search and category
  const filteredPosts = allPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <Head>
        <title>Blog - SMIS | Latest Updates & Educational Insights</title>
        <meta name="description" content="Stay updated with the latest features, educational insights, and success stories from schools using SMIS worldwide." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center">
                <span className="text-2xl font-bold text-primary-blue">SMIS</span>
              </Link>
              <div className="flex items-center space-x-4">
                <Link href="/" className="text-gray-700 hover:text-primary-blue px-3 py-2 text-sm font-medium transition-colors">
                  Home
                </Link>
                <Link href="/login" className="px-4 py-2 bg-primary-blue text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-blue to-blue-700 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center mb-3">
              <FiBookOpen className="w-6 h-6 mr-2" />
              <span className="text-blue-200 font-semibold">SMIS Blog</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Educational Insights & Updates
            </h1>
            <p className="text-lg text-blue-100 mb-6 max-w-3xl mx-auto">
              Discover the latest in school management technology, educational best practices, and success stories from institutions worldwide.
            </p>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className="py-8 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center space-x-4">
                <FiFilter className="text-gray-500 w-5 h-5" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label} ({category.count})
                    </option>
                  ))}
                </select>

                {/* View Mode Toggle */}
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-primary-blue text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    <FiGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-primary-blue text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    <FiList className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Blog Posts */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <FiSearch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles found</h3>
                <p className="text-gray-600">Try adjusting your search terms or category filter.</p>
              </div>
            ) : (
              <div className={`grid gap-8 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1 max-w-4xl mx-auto'
              }`}>
                {filteredPosts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default BlogPage;
