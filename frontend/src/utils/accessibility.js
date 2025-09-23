// Accessibility utilities and testing helpers

// ARIA live region announcer for screen readers
export class LiveAnnouncer {
  constructor() {
    this.liveRegion = null;
    this.init();
  }

  init() {
    if (typeof document === 'undefined') return;

    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.style.position = 'absolute';
    this.liveRegion.style.left = '-10000px';
    this.liveRegion.style.width = '1px';
    this.liveRegion.style.height = '1px';
    this.liveRegion.style.overflow = 'hidden';
    
    document.body.appendChild(this.liveRegion);
  }

  announce(message, priority = 'polite') {
    if (!this.liveRegion) return;

    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = '';
      }
    }, 1000);
  }

  destroy() {
    if (this.liveRegion && this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion);
      this.liveRegion = null;
    }
  }
}

// Focus management utilities
export const focusManager = {
  // Store the last focused element before opening modal/dialog
  storeFocus() {
    this.lastFocusedElement = document.activeElement;
  },

  // Restore focus to the last focused element
  restoreFocus() {
    if (this.lastFocusedElement && this.lastFocusedElement.focus) {
      this.lastFocusedElement.focus();
      this.lastFocusedElement = null;
    }
  },

  // Trap focus within a container (for modals, dialogs)
  trapFocus(container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },

  // Move focus to element and announce to screen readers
  moveFocusTo(element, announcement) {
    if (element && element.focus) {
      element.focus();
      if (announcement && window.liveAnnouncer) {
        window.liveAnnouncer.announce(announcement);
      }
    }
  }
};

// Keyboard navigation utilities
export const keyboardNavigation = {
  // Handle arrow key navigation in lists/grids
  handleArrowKeys(event, items, currentIndex, orientation = 'vertical') {
    const { key } = event;
    let newIndex = currentIndex;

    if (orientation === 'vertical') {
      if (key === 'ArrowDown') {
        newIndex = Math.min(currentIndex + 1, items.length - 1);
      } else if (key === 'ArrowUp') {
        newIndex = Math.max(currentIndex - 1, 0);
      }
    } else if (orientation === 'horizontal') {
      if (key === 'ArrowRight') {
        newIndex = Math.min(currentIndex + 1, items.length - 1);
      } else if (key === 'ArrowLeft') {
        newIndex = Math.max(currentIndex - 1, 0);
      }
    } else if (orientation === 'grid') {
      // Implement grid navigation logic
      const columns = Math.ceil(Math.sqrt(items.length));
      const row = Math.floor(currentIndex / columns);
      const col = currentIndex % columns;

      switch (key) {
        case 'ArrowDown':
          newIndex = Math.min(currentIndex + columns, items.length - 1);
          break;
        case 'ArrowUp':
          newIndex = Math.max(currentIndex - columns, 0);
          break;
        case 'ArrowRight':
          newIndex = Math.min(currentIndex + 1, items.length - 1);
          break;
        case 'ArrowLeft':
          newIndex = Math.max(currentIndex - 1, 0);
          break;
      }
    }

    if (newIndex !== currentIndex) {
      event.preventDefault();
      items[newIndex]?.focus();
      return newIndex;
    }

    return currentIndex;
  },

  // Handle escape key to close modals/dropdowns
  handleEscape(event, closeCallback) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeCallback();
    }
  },

  // Handle enter/space for button-like elements
  handleActivation(event, activateCallback) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activateCallback();
    }
  }
};

// Color contrast checker
export const colorContrast = {
  // Calculate relative luminance
  getLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  // Calculate contrast ratio between two colors
  getContrastRatio(color1, color2) {
    const lum1 = this.getLuminance(...color1);
    const lum2 = this.getLuminance(...color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  },

  // Check if contrast meets WCAG standards
  meetsWCAG(color1, color2, level = 'AA', size = 'normal') {
    const ratio = this.getContrastRatio(color1, color2);
    
    if (level === 'AAA') {
      return size === 'large' ? ratio >= 4.5 : ratio >= 7;
    } else {
      return size === 'large' ? ratio >= 3 : ratio >= 4.5;
    }
  },

  // Parse hex color to RGB
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
  }
};

// Screen reader utilities
export const screenReader = {
  // Check if screen reader is active
  isScreenReaderActive() {
    return window.navigator.userAgent.includes('NVDA') ||
           window.navigator.userAgent.includes('JAWS') ||
           window.speechSynthesis?.speaking ||
           false;
  },

  // Announce text to screen reader
  announce(text, priority = 'polite') {
    if (!window.liveAnnouncer) {
      window.liveAnnouncer = new LiveAnnouncer();
    }
    window.liveAnnouncer.announce(text, priority);
  },

  // Create visually hidden text for screen readers
  createVisuallyHiddenText(text) {
    const span = document.createElement('span');
    span.textContent = text;
    span.className = 'sr-only';
    span.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    return span;
  }
};

// Accessibility testing utilities
export const a11yTesting = {
  // Check for missing alt text on images
  checkImageAltText() {
    const images = document.querySelectorAll('img');
    const issues = [];
    
    images.forEach((img, index) => {
      if (!img.alt && !img.getAttribute('aria-label') && !img.getAttribute('aria-labelledby')) {
        issues.push({
          element: img,
          issue: 'Missing alt text',
          severity: 'error',
          suggestion: 'Add descriptive alt text or aria-label'
        });
      }
    });
    
    return issues;
  },

  // Check for proper heading hierarchy
  checkHeadingHierarchy() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const issues = [];
    let lastLevel = 0;
    
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (index === 0 && level !== 1) {
        issues.push({
          element: heading,
          issue: 'Page should start with h1',
          severity: 'error'
        });
      }
      
      if (level > lastLevel + 1) {
        issues.push({
          element: heading,
          issue: `Heading level skipped from h${lastLevel} to h${level}`,
          severity: 'warning'
        });
      }
      
      lastLevel = level;
    });
    
    return issues;
  },

  // Check for form labels
  checkFormLabels() {
    const inputs = document.querySelectorAll('input, select, textarea');
    const issues = [];
    
    inputs.forEach(input => {
      const hasLabel = input.labels?.length > 0 ||
                      input.getAttribute('aria-label') ||
                      input.getAttribute('aria-labelledby');
      
      if (!hasLabel) {
        issues.push({
          element: input,
          issue: 'Form control missing label',
          severity: 'error',
          suggestion: 'Add label element or aria-label attribute'
        });
      }
    });
    
    return issues;
  },

  // Check color contrast
  checkColorContrast() {
    const elements = document.querySelectorAll('*');
    const issues = [];
    
    elements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        // This would need a more sophisticated color parsing implementation
        // For now, just flag elements that might have contrast issues
        if (color === backgroundColor) {
          issues.push({
            element,
            issue: 'Text and background colors are the same',
            severity: 'error'
          });
        }
      }
    });
    
    return issues;
  },

  // Run all accessibility checks
  runAllChecks() {
    return {
      imageAltText: this.checkImageAltText(),
      headingHierarchy: this.checkHeadingHierarchy(),
      formLabels: this.checkFormLabels(),
      colorContrast: this.checkColorContrast()
    };
  }
};

// Initialize global accessibility features
export const initializeA11y = () => {
  // Create global live announcer
  if (typeof window !== 'undefined' && !window.liveAnnouncer) {
    window.liveAnnouncer = new LiveAnnouncer();
  }

  // Add skip link for keyboard users
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.textContent = 'Skip to main content';
  skipLink.className = 'skip-link';
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 6px;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    z-index: 1000;
    transition: top 0.3s;
  `;
  
  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '6px';
  });
  
  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });
  
  document.body.insertBefore(skipLink, document.body.firstChild);
};

export default {
  LiveAnnouncer,
  focusManager,
  keyboardNavigation,
  colorContrast,
  screenReader,
  a11yTesting,
  initializeA11y
};
