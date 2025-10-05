import React from 'react';

const FormField = ({ children, className = "" }) => (
  <div className={`space-y-2 ${className}`}>
    {children}
  </div>
);

const FormLabel = React.forwardRef(({ className = "", ...props }, ref) => (
  <label
    ref={ref}
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
    {...props}
  />
));
FormLabel.displayName = "FormLabel";

const FormMessage = React.forwardRef(({ className = "", children, ...props }, ref) => {
  if (!children) return null;
  
  return (
    <p
      ref={ref}
      className={`text-sm font-medium text-red-600 ${className}`}
      {...props}
    >
      {children}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

const FormDescription = React.forwardRef(({ className = "", ...props }, ref) => (
  <p
    ref={ref}
    className={`text-sm text-gray-500 ${className}`}
    {...props}
  />
));
FormDescription.displayName = "FormDescription";

export { FormField, FormLabel, FormMessage, FormDescription };
