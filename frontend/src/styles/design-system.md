# SMIS Design System

PowerSchool-inspired design system for the School Management Information System.

## Color Palette

### Primary Colors
- **Primary Blue**: `#1B365D` - Trust and professionalism
- **Primary Light**: `#2E5BBA` - Interactive elements and links

### Accent Colors
- **Success Green**: `#28A745` - Success states, positive actions
- **Warning Orange**: `#FD7E14` - Attention indicators, warnings
- **Danger Red**: `#DC3545` - Critical alerts, errors

### Neutral Colors
- **Gray 50**: `#F8F9FA` - Background surfaces
- **Gray 900**: `#212529` - Primary text

## Typography

### Font Family
- **Primary**: Inter (optimized for readability)
- **Fallback**: system-ui, -apple-system, sans-serif

### Font Scales
- **xs**: 12px (0.75rem)
- **sm**: 14px (0.875rem) - Body text
- **base**: 16px (1rem) - Default
- **lg**: 18px (1.125rem) - Large text
- **xl**: 20px (1.25rem) - Headings
- **2xl**: 24px (1.5rem) - Page titles

### Font Weights
- **normal**: 400 - Body text
- **medium**: 500 - Emphasis
- **semibold**: 600 - Headings
- **bold**: 700 - Strong emphasis

## Spacing System

8px grid system for consistent spacing:
- **1**: 4px (0.25rem)
- **2**: 8px (0.5rem)
- **3**: 12px (0.75rem)
- **4**: 16px (1rem)
- **6**: 24px (1.5rem)
- **8**: 32px (2rem)

## Components

### Buttons

#### Variants
- **Primary**: Main actions (blue background)
- **Secondary**: Secondary actions (gray background)
- **Success**: Positive actions (green background)
- **Warning**: Caution actions (orange background)
- **Danger**: Destructive actions (red background)
- **Outline**: Subtle actions (border only)
- **Ghost**: Minimal actions (no background)

#### Sizes
- **sm**: Small buttons (px-3 py-1.5)
- **md**: Default buttons (px-4 py-2)
- **lg**: Large buttons (px-6 py-3)
- **xl**: Extra large buttons (px-8 py-4)

### Cards

#### Structure
- **Card**: Container with shadow and border
- **Card.Header**: Top section with border
- **Card.Title**: Heading within card
- **Card.Content**: Main content area
- **Card.Footer**: Bottom section with border

#### Padding Options
- **none**: No padding
- **sm**: 16px padding
- **default**: 24px padding
- **lg**: 32px padding

### Badges

#### Variants
- **default**: Gray background
- **primary**: Blue background
- **success**: Green background
- **warning**: Yellow background
- **danger**: Red background
- **info**: Blue background

### Alerts

#### Types
- **success**: Green with checkmark icon
- **error**: Red with alert circle icon
- **warning**: Yellow with triangle icon
- **info**: Blue with info icon

#### Features
- Dismissible option
- Icon integration
- Accessible markup

### Tables

#### Features
- Responsive design
- Hover states
- Striped rows option
- Sortable headers
- Proper semantic markup

### Forms

#### Input States
- **Default**: Normal state
- **Focus**: Blue ring and border
- **Error**: Red border and text
- **Disabled**: Reduced opacity

#### Accessibility
- Proper labeling
- Error announcements
- Required field indicators
- Helper text support

## Accessibility Standards

### WCAG 2.1 AA Compliance

#### Color Contrast
- **Normal text**: 4.5:1 minimum ratio
- **Large text**: 3:1 minimum ratio
- **UI components**: 3:1 minimum ratio

#### Keyboard Navigation
- All interactive elements focusable
- Visible focus indicators
- Logical tab order
- Keyboard shortcuts where appropriate

#### Screen Reader Support
- Semantic HTML structure
- ARIA labels and descriptions
- Role attributes
- Live regions for dynamic content

#### Visual Design
- Clear visual hierarchy
- Consistent navigation
- Sufficient spacing
- Readable typography

## Responsive Design

### Breakpoints
- **sm**: 640px and up
- **md**: 768px and up
- **lg**: 1024px and up
- **xl**: 1280px and up

### Mobile-First Approach
- Base styles for mobile
- Progressive enhancement for larger screens
- Touch-friendly interaction targets
- Optimized content hierarchy

## Animation & Transitions

### Principles
- **Subtle**: Enhance UX without distraction
- **Fast**: 200-300ms for most transitions
- **Purposeful**: Support user understanding

### Common Animations
- **Fade In**: 0.5s ease-in-out
- **Slide Up**: 0.3s ease-out
- **Hover**: 0.2s ease-in-out
- **Focus**: Instant (0s)

## Usage Guidelines

### Do's
- Use consistent spacing from the 8px grid
- Maintain color contrast ratios
- Provide clear visual hierarchy
- Use semantic HTML elements
- Include proper ARIA labels

### Don'ts
- Mix different spacing systems
- Use colors that fail contrast tests
- Create overly complex layouts
- Ignore keyboard navigation
- Skip accessibility testing

## Implementation

### CSS Classes
All components use Tailwind CSS utility classes with custom CSS variables for colors.

### Component Library
Reusable React components in `/src/components/common/` directory.

### Testing
- Visual regression testing
- Accessibility audits
- Cross-browser compatibility
- Mobile device testing
