// Example of how to use custom icons with Peek
import React from 'react'
import { configurePeekIcons, IconProps } from '../icons'

// Example: Custom SVG icons
const CustomBugIcon = ({ size = 16, className = '' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    {/* Your custom SVG path here */}
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
)

// Example: Using an image/PNG as an icon
const CustomImageIcon = ({ size = 16, className = '' }: IconProps) => (
  <img
    src="/path/to/your/custom-icon.png"
    alt="Custom Icon"
    width={size}
    height={size}
    className={className}
  />
)

// Example: Using a CSS class-based icon (like Font Awesome)
const CustomFontIcon = ({ size = 16, className = '' }: IconProps) => (
  <i 
    className={`fa fa-bug ${className}`} 
    style={{ fontSize: size }}
  />
)

// Configure custom icons before using Peek
export const setupCustomIcons = () => {
  configurePeekIcons({
    Bug: CustomBugIcon,
    Move: CustomImageIcon,
    Close: CustomFontIcon,
    // Add more custom icons as needed
  })
}

// Usage in your app:
// 1. Call setupCustomIcons() before rendering Peek
// 2. Your custom icons will be used instead of the defaults

export default setupCustomIcons