import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PlaceholderImage from './PlaceholderImage';
import { FiCalendar, FiClock, FiUser, FiArrowRight } from 'react-icons/fi';

const BlogCard = ({ post, featured = false }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getReadingTime = (content) => {
    const wordsPerMinute = 200;
    const words = content.split(' ').length;
    return Math.ceil(words / wordsPerMinute);
  };

  if (featured) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl hover:shadow-2xl transition-all duration-300 group">
        <div className="aspect-w-16 aspect-h-9 relative">
          {post.image.includes('/api/placeholder') ? (
            <PlaceholderImage
              width={800}
              height={400}
              text={post.category}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-blue text-white">
              {post.category}
            </span>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex items-center space-x-4 text-sm mb-3 opacity-90">
            <div className="flex items-center space-x-1">
              <FiCalendar className="w-4 h-4" />
              <span>{formatDate(post.date)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FiClock className="w-4 h-4" />
              <span>{getReadingTime(post.content)} min read</span>
            </div>
            <div className="flex items-center space-x-1">
              <FiUser className="w-4 h-4" />
              <span>{post.author}</span>
            </div>
          </div>
          
          <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-200 transition-colors">
            {post.title}
          </h3>
          <p className="text-gray-200 mb-4 line-clamp-2">
            {post.excerpt}
          </p>
          
          <Link 
            href={`/blog/${post.slug}`}
            className="inline-flex items-center text-white hover:text-blue-200 font-medium transition-colors group"
          >
            Read More
            <FiArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className="aspect-w-16 aspect-h-9 relative">
        {post.image.includes('/api/placeholder') ? (
          <PlaceholderImage
            width={600}
            height={300}
            text={post.category}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-800">
            {post.category}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
          <div className="flex items-center space-x-1">
            <FiCalendar className="w-4 h-4" />
            <span>{formatDate(post.date)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <FiClock className="w-4 h-4" />
            <span>{getReadingTime(post.content)} min read</span>
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-blue transition-colors line-clamp-2">
          {post.title}
        </h3>
        
        <p className="text-gray-600 mb-4 line-clamp-3">
          {post.excerpt}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <FiUser className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">{post.author}</span>
          </div>
          
          <Link 
            href={`/blog/${post.slug}`}
            className="inline-flex items-center text-primary-blue hover:text-blue-700 font-medium text-sm transition-colors group"
          >
            Read More
            <FiArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default BlogCard;
