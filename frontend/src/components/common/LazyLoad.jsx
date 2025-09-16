import React, { Suspense, lazy } from 'react';
import LoadingSpinner from './LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';

// Higher-order component for lazy loading
export const withLazyLoading = (importFunc, fallback = null) => {
  const LazyComponent = lazy(importFunc);
  
  return React.forwardRef((props, ref) => (
    <ErrorBoundary>
      <Suspense fallback={fallback || <LazyLoadFallback />}>
        <LazyComponent {...props} ref={ref} />
      </Suspense>
    </ErrorBoundary>
  ));
};

// Default loading fallback
const LazyLoadFallback = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center py-8">
    <LoadingSpinner size="lg" />
    <span className="ml-3 text-gray-600">{message}</span>
  </div>
);

// Lazy load wrapper component
export const LazyLoad = ({ 
  children, 
  fallback, 
  errorFallback,
  delay = 0 
}) => {
  const [shouldRender, setShouldRender] = React.useState(delay === 0);

  React.useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setShouldRender(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  if (!shouldRender) {
    return fallback || <LazyLoadFallback />;
  }

  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback || <LazyLoadFallback />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

// Intersection Observer based lazy loading
export const LazyLoadOnVisible = ({ 
  children, 
  fallback,
  rootMargin = '50px',
  threshold = 0.1,
  triggerOnce = true 
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [hasBeenVisible, setHasBeenVisible] = React.useState(false);
  const elementRef = React.useRef();

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            setHasBeenVisible(true);
            observer.unobserve(entry.target);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [rootMargin, threshold, triggerOnce]);

  const shouldRender = isVisible || hasBeenVisible;

  return (
    <div ref={elementRef}>
      {shouldRender ? (
        <ErrorBoundary>
          <Suspense fallback={fallback || <LazyLoadFallback />}>
            {children}
          </Suspense>
        </ErrorBoundary>
      ) : (
        fallback || <LazyLoadFallback />
      )}
    </div>
  );
};

// Preload component for critical resources
export const PreloadResource = ({ href, as, type, crossOrigin }) => {
  React.useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    if (crossOrigin) link.crossOrigin = crossOrigin;
    
    document.head.appendChild(link);
    
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, [href, as, type, crossOrigin]);

  return null;
};

// Lazy loaded portal components
export const LazyStudentDashboard = withLazyLoading(
  () => import('../student/StudentDashboard'),
  <LazyLoadFallback message="Loading Student Dashboard..." />
);

export const LazyTeacherDashboard = withLazyLoading(
  () => import('../teacher/TeacherDashboard'),
  <LazyLoadFallback message="Loading Teacher Dashboard..." />
);

export const LazyHODDashboard = withLazyLoading(
  () => import('../hod/HODDashboard'),
  <LazyLoadFallback message="Loading HOD Dashboard..." />
);

export const LazyFinanceDashboard = withLazyLoading(
  () => import('../finance/FinanceDashboard'),
  <LazyLoadFallback message="Loading Finance Dashboard..." />
);

export const LazyAdminDashboard = withLazyLoading(
  () => import('../admin/AdminDashboard'),
  <LazyLoadFallback message="Loading Admin Dashboard..." />
);

// Lazy loaded page components
export const LazyStudentGrades = withLazyLoading(
  () => import('../../pages/student/grades'),
  <LazyLoadFallback message="Loading Grades..." />
);

export const LazyStudentAttendance = withLazyLoading(
  () => import('../../pages/student/attendance'),
  <LazyLoadFallback message="Loading Attendance..." />
);

export const LazyStudentFees = withLazyLoading(
  () => import('../../pages/student/fees'),
  <LazyLoadFallback message="Loading Fee Information..." />
);

export const LazyStudentProfile = withLazyLoading(
  () => import('../../pages/student/profile'),
  <LazyLoadFallback message="Loading Profile..." />
);

export const LazyStudentTimetable = withLazyLoading(
  () => import('../../pages/student/timetable'),
  <LazyLoadFallback message="Loading Timetable..." />
);

// Chart components (heavy dependencies)
export const LazyChart = withLazyLoading(
  () => import('react-chartjs-2').then(module => ({ default: module.Line })),
  <LazyLoadFallback message="Loading Chart..." />
);

export const LazyBarChart = withLazyLoading(
  () => import('react-chartjs-2').then(module => ({ default: module.Bar })),
  <LazyLoadFallback message="Loading Chart..." />
);

export const LazyPieChart = withLazyLoading(
  () => import('react-chartjs-2').then(module => ({ default: module.Pie })),
  <LazyLoadFallback message="Loading Chart..." />
);

// Calendar component (heavy dependency)
export const LazyCalendar = withLazyLoading(
  () => import('react-calendar'),
  <LazyLoadFallback message="Loading Calendar..." />
);

// Table component with virtualization for large datasets
export const LazyVirtualizedTable = withLazyLoading(
  () => import('react-table'),
  <LazyLoadFallback message="Loading Table..." />
);

export default LazyLoad;
