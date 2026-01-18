# Peek Custom Icons System

The Peek debug tool includes a flexible icon system that allows you to replace the default icons with your own custom graphics.

## Features

- ✅ **SVG Support**: Use custom SVG icons
- ✅ **Image Support**: Use PNG, JPG, or other image formats
- ✅ **Font Icons**: Use icon fonts like Font Awesome
- ✅ **NPM Package Ready**: All icons are bundled and work in published packages
- ✅ **TypeScript Support**: Full type safety for icon configuration

## Available Icons

The following icons can be customized:

- `Bug` - Main Peek button icon
- `Move` - Drag handle icon
- `Close` - Close button
- `Minimize` - Minimize button
- `Maximize` - Maximize button
- `Fullscreen` - Fullscreen toggle
- `ExitFullscreen` - Exit fullscreen
- `Clear` - Clear logs button
- `Copy` - Copy all logs button
- `Download` - Export logs button
- `CopyIndividual` - Copy single log button

## Usage

### 1. Basic Custom Icon Setup

```tsx
import { configurePeekIcons } from '@/components/peek/icons'

// Define your custom icon component
const MyCustomBugIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} className={className}>
    {/* Your SVG content */}
  </svg>
)

// Configure before using Peek
configurePeekIcons({
  Bug: MyCustomBugIcon
})
```

### 2. Using Image Files

```tsx
const ImageIcon = ({ size = 16, className = '' }) => (
  <img
    src="/icons/my-custom-bug.png"
    alt="Bug"
    width={size}
    height={size}
    className={className}
  />
)

configurePeekIcons({
  Bug: ImageIcon
})
```

### 3. Using Icon Fonts

```tsx
const FontAwesomeIcon = ({ size = 16, className = '' }) => (
  <i 
    className={`fas fa-bug ${className}`}
    style={{ fontSize: size }}
  />
)

configurePeekIcons({
  Bug: FontAwesomeIcon
})
```

### 4. Multiple Custom Icons

```tsx
configurePeekIcons({
  Bug: MyBugIcon,
  Move: MyMoveIcon,
  Close: MyCloseIcon,
  Clear: MyClearIcon
})
```

## NPM Package Considerations

When publishing Peek as an npm package, your custom icons will work perfectly because:

1. **Bundled Assets**: Image files in your `public/` folder get bundled
2. **SVG Inline**: SVG icons are inlined in the JavaScript bundle
3. **Font Icons**: Icon fonts work as external dependencies
4. **No External Dependencies**: The icon system doesn't rely on external CDNs

### Recommended Approach for NPM Package

For maximum compatibility in an npm package:

1. **Use SVG icons** (best performance, scalable, no external dependencies)
2. **Inline small images** as base64 data URLs
3. **Document font icon dependencies** in your package README

### Example for NPM Package

```tsx
// icons/custom-peek-icons.ts
export const customPeekIcons = {
  Bug: ({ size = 16, className = '' }) => (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24">
      <path d="..." fill="currentColor" />
    </svg>
  ),
  // ... more icons
}

// In your app setup
import { configurePeekIcons } from 'your-peek-package'
import { customPeekIcons } from './icons/custom-peek-icons'

configurePeekIcons(customPeekIcons)
```

## Icon Component Interface

All custom icons must implement this interface:

```tsx
interface IconProps {
  size?: number      // Icon size in pixels (default: 16)
  className?: string // CSS classes for styling
}

type IconComponent = React.ComponentType<IconProps>
```

## Best Practices

1. **Consistent Sizing**: Design icons for 16x16px base size
2. **Current Color**: Use `currentColor` for SVG fill/stroke to inherit text color
3. **Accessibility**: Include proper alt text for image icons
4. **Performance**: Prefer SVG over images for better performance
5. **Fallbacks**: The system falls back to default icons if custom ones fail

## Troubleshooting

**Icons not showing?**
- Check that `configurePeekIcons()` is called before rendering Peek
- Verify your icon component follows the `IconProps` interface
- Check browser console for any errors

**Icons look wrong?**
- Ensure your icons are designed for the expected size
- Check CSS classes aren't conflicting
- Verify `currentColor` is used for proper theming

**NPM package issues?**
- Make sure image assets are included in your package build
- Consider using SVG instead of external image files
- Document any required peer dependencies (like icon fonts)