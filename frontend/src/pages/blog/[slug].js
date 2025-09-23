import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import PlaceholderImage from '../../components/blog/PlaceholderImage';
import { FiCalendar, FiClock, FiUser, FiArrowLeft, FiShare2, FiBookmark, FiHeart, FiMessageCircle } from 'react-icons/fi';

const BlogPost = () => {
  const router = useRouter();
  const { slug } = router.query;

  // Sample blog posts data - in a real app, this would come from an API
  const blogPosts = {
    "revolutionizing-education-smis-2025": {
      id: 1,
      title: "Revolutionizing Education: How SMIS Transforms School Management in 2025",
      excerpt: "Discover how our latest AI-powered features are helping schools worldwide streamline operations, improve student outcomes, and enhance parent engagement like never before.",
      content: `
        <p>The landscape of education technology has evolved dramatically over the past decade, and 2025 marks a pivotal moment in how schools manage their operations. Our School Management Information System (SMIS) has been at the forefront of this transformation, introducing cutting-edge features that are reshaping the educational experience for administrators, teachers, students, and parents alike.</p>

        <h2>The Power of AI-Driven Insights</h2>
        <p>One of the most significant advancements in our platform is the integration of artificial intelligence to provide actionable insights. Our AI algorithms analyze student performance patterns, attendance trends, and engagement metrics to help educators make data-driven decisions that directly impact student success.</p>

        <p>For instance, our predictive analytics can identify students who may be at risk of falling behind academically, allowing teachers to intervene early with targeted support. This proactive approach has shown remarkable results, with participating schools reporting a 35% improvement in student retention rates.</p>

        <h2>Streamlined Administrative Operations</h2>
        <p>Administrative tasks that once consumed hours of manual work are now automated through intelligent workflows. From automated report generation to smart scheduling systems that optimize resource allocation, SMIS has reduced administrative overhead by an average of 40% across our partner institutions.</p>

        <p>The system's intuitive dashboard provides real-time visibility into all aspects of school operations, enabling administrators to make informed decisions quickly and efficiently. Whether it's tracking budget allocations, monitoring facility usage, or managing staff schedules, everything is accessible from a single, unified interface.</p>

        <h2>Enhanced Parent Engagement</h2>
        <p>Perhaps one of the most impactful features is our enhanced parent portal, which has revolutionized how families stay connected with their children's education. Parents now receive real-time updates about their child's academic progress, attendance, and school activities through our mobile app.</p>

        <p>The two-way communication system allows parents to easily connect with teachers, schedule conferences, and participate in their child's educational journey more actively than ever before. Schools using our platform have reported a 60% increase in parent engagement metrics.</p>

        <h2>Looking Ahead</h2>
        <p>As we continue to innovate and expand our platform's capabilities, we remain committed to our core mission: empowering educational institutions to focus on what matters most – providing exceptional education to every student. The future of school management is here, and it's more connected, intelligent, and efficient than ever before.</p>
      `,
      author: "Dr. Sarah Johnson",
      authorBio: "Dr. Johnson is the Chief Education Officer at SMIS with over 15 years of experience in educational technology and school administration.",
      date: "2025-01-15",
      category: "Innovation",
      image: "/api/placeholder/1200/600",
      slug: "revolutionizing-education-smis-2025",
      readingTime: 8,
      tags: ["AI", "Education Technology", "School Management", "Innovation"]
    },
    "digital-attendance-tracking-efficiency": {
      id: 2,
      title: "5 Ways Digital Attendance Tracking Improves School Efficiency",
      excerpt: "Learn how automated attendance systems reduce administrative burden and provide real-time insights into student engagement patterns.",
      content: `
        <p>Traditional paper-based attendance systems are becoming obsolete as schools embrace digital solutions that offer unprecedented efficiency and accuracy. Digital attendance tracking is more than just a technological upgrade – it's a fundamental shift that impacts every aspect of school operations.</p>

        <h2>1. Real-Time Data Collection and Analysis</h2>
        <p>Digital attendance systems provide instant access to attendance data, allowing administrators and teachers to identify patterns and trends immediately. This real-time visibility enables quick interventions when students show concerning attendance patterns.</p>

        <h2>2. Automated Reporting and Compliance</h2>
        <p>Generate comprehensive attendance reports with just a few clicks. Our system automatically calculates attendance percentages, identifies chronic absenteeism, and ensures compliance with state and federal reporting requirements.</p>

        <h2>3. Parent Communication Integration</h2>
        <p>Parents receive instant notifications when their child is marked absent, improving communication and reducing the likelihood of unexcused absences going unnoticed.</p>

        <h2>4. Integration with Academic Performance</h2>
        <p>By correlating attendance data with academic performance metrics, educators can better understand the relationship between presence and achievement, leading to more targeted interventions.</p>

        <h2>5. Streamlined Administrative Processes</h2>
        <p>Eliminate manual data entry, reduce errors, and free up administrative staff to focus on more strategic initiatives that directly impact student success.</p>
      `,
      author: "Michael Chen",
      authorBio: "Michael is a Product Manager at SMIS specializing in attendance and student information systems.",
      date: "2025-01-12",
      category: "Features",
      image: "/api/placeholder/1200/600",
      slug: "digital-attendance-tracking-efficiency",
      readingTime: 5,
      tags: ["Attendance", "Efficiency", "Automation", "School Operations"]
    }
  };

  const post = blogPosts[slug];

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <Link href="/blog" className="text-primary-blue hover:text-blue-700">
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <Head>
        <title>{post.title} - SMIS Blog</title>
        <meta name="description" content={post.excerpt} />
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
                <Link href="/blog" className="text-gray-700 hover:text-primary-blue px-3 py-2 text-sm font-medium transition-colors">
                  Blog
                </Link>
                <Link href="/" className="text-gray-700 hover:text-primary-blue px-3 py-2 text-sm font-medium transition-colors">
                  Home
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Back Button */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Link 
            href="/blog"
            className="inline-flex items-center text-primary-blue hover:text-blue-700 font-medium transition-colors"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
        </div>

        {/* Article Header */}
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <header className="mb-8">
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-blue text-white">
                {post.category}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {post.excerpt}
            </p>

            {/* Article Meta */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
              <div className="flex items-center space-x-2">
                <FiUser className="w-4 h-4" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FiCalendar className="w-4 h-4" />
                <span>{formatDate(post.date)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FiClock className="w-4 h-4" />
                <span>{post.readingTime} min read</span>
              </div>
            </div>

            {/* Social Actions */}
            <div className="flex items-center justify-between border-t border-b border-gray-200 py-4 mb-8">
              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors">
                  <FiHeart className="w-5 h-5" />
                  <span>Like</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
                  <FiBookmark className="w-5 h-5" />
                  <span>Save</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
                  <FiShare2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
              </div>
              <div className="flex items-center space-x-2 text-gray-500">
                <FiMessageCircle className="w-5 h-5" />
                <span>0 Comments</span>
              </div>
            </div>
          </header>

          {/* Featured Image */}
          <div className="relative aspect-w-16 aspect-h-9 mb-8 rounded-xl overflow-hidden">
            {post.image.includes('/api/placeholder') ? (
              <PlaceholderImage
                width={1200}
                height={600}
                text={post.category}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover"
              />
            )}
          </div>

          {/* Article Content */}
          <div 
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-primary-blue prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Author Bio */}
          <div className="mt-12 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center">
                <FiUser className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">About {post.author}</h3>
                <p className="text-gray-600">{post.authorBio}</p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </>
  );
};

export default BlogPost;
