# SMIS Frontend

frontend for the School Management Information System.

## Features

- **Role-based Dashboards**: Student, Teacher, HOD, Finance, and Admin portals
- **Modern UI/UX**: Clean, intuitive design with PowerSchool-inspired aesthetics
- **Responsive Design**: Mobile-first approach with accessibility features
- **Real-time Integration**: Seamless backend API integration
- **Authentication**: JWT-based authentication with role management

## Tech Stack

- **Framework**: Next.js 13+
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Context + Custom hooks
- **API Integration**: Axios with interceptors
- **Icons**: React Icons (Feather)
- **Authentication**: JWT with secure token management

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your API URL
   ```

3. **Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Shared components (Header, Sidebar)
│   ├── student/        # Student-specific components
│   ├── teacher/        # Teacher-specific components
│   ├── hod/           # HOD-specific components
│   ├── finance/       # Finance-specific components
│   └── admin/         # Admin-specific components
├── context/           # React Context providers
├── hooks/             # Custom React hooks
├── pages/             # Next.js pages/routes
├── services/          # API integration layer
├── styles/            # Global styles and design system
└── utils/             # Helper functions
```

## Design System

### Colors
- **Primary Blue**: #1B365D (Trust and professionalism)
- **Primary Light**: #2E5BBA (Interactive elements)
- **Accent Green**: #28A745 (Success states)
- **Accent Orange**: #FD7E14 (Attention indicators)
- **Accent Red**: #DC3545 (Critical alerts)

### Typography
- **Font**: Inter for optimal readability
- **Scale**: Consistent sizing with semantic meaning

### Components
- **Cards**: Information grouping with subtle shadows
- **Buttons**: Clear hierarchy with color-coded actions
- **Forms**: Accessible inputs with proper validation
- **Tables**: Clean data presentation with hover states

## Authentication Flow

1. **Login**: Role-based authentication (Staff/Student)
2. **Token Management**: Automatic token refresh and storage
3. **Route Protection**: Role-based access control
4. **Session Handling**: Secure logout and session cleanup

## API Integration

- **Base URL**: Configurable via environment variables
- **Authentication**: Bearer token with automatic injection
- **Error Handling**: Centralized error management
- **Request/Response**: Consistent data formatting

## Accessibility

- **WCAG 2.1 AA**: Compliant design and implementation
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Semantic HTML and ARIA labels
- **Color Contrast**: 4.5:1 minimum contrast ratio

## Performance

- **Code Splitting**: Role-based component loading
- **Lazy Loading**: On-demand resource loading
- **Caching**: Intelligent data caching strategies
- **Optimization**: Bundle analysis and optimization

## Development Guidelines

1. **Component Structure**: Functional components with hooks
2. **State Management**: Context for global state, local state for components
3. **API Calls**: Use custom hooks for data fetching
4. **Styling**: Tailwind classes with custom CSS variables
5. **Testing**: Component and integration testing

## Deployment

1. **Build Optimization**: Production-ready builds
2. **Environment Configuration**: Environment-specific settings
3. **Static Assets**: Optimized asset delivery
4. **Performance Monitoring**: Core Web Vitals tracking
