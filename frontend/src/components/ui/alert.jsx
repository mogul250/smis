import React from 'react';

const alertVariants = {
  default: "bg-white border-gray-200",
  destructive: "border-red-200 bg-red-50 text-red-900 [&>svg]:text-red-600",
  success: "border-green-200 bg-green-50 text-green-900 [&>svg]:text-green-600",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-900 [&>svg]:text-yellow-600",
};

const Alert = React.forwardRef(({ className = "", variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={`relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-gray-950 ${alertVariants[variant]} ${className}`}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef(({ className = "", ...props }, ref) => (
  <h5
    ref={ref}
    className={`mb-1 font-medium leading-none tracking-tight ${className}`}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`text-sm [&_p]:leading-relaxed ${className}`}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
