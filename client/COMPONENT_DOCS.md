# Enhanced UI Components Documentation

## Overview

The Input and Button components have been enhanced to support icons as props, making them more reusable and consistent throughout the application.

## Input Component

### Props

- **leftIcon**: React node for an icon on the left side of the input
- **rightIcon**: React node for an icon on the right side of the input
- All standard HTML input props are supported

### Usage Examples

```jsx
import { Input } from './components/ui/input';
import { Search, Mail, Lock, Eye, EyeOff } from 'lucide-react';

// Basic input with left icon
<Input
  placeholder="Search..."
  leftIcon={<Search />}
/>

// Email input
<Input
  type="email"
  placeholder="Enter your email"
  leftIcon={<Mail />}
/>

// Password input with toggle visibility
const [showPassword, setShowPassword] = useState(false);

<Input
  type={showPassword ? 'text' : 'password'}
  placeholder="Enter your password"
  leftIcon={<Lock />}
  rightIcon={
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="text-muted-foreground hover:text-foreground"
    >
      {showPassword ? <EyeOff /> : <Eye />}
    </button>
  }
/>
```

### Features

- Automatic padding adjustment when icons are present
- Consistent icon sizing (16px)
- Proper spacing and positioning
- Works with form validation states
- Full TypeScript support

## Button Component

### Props

- **leftIcon**: React node for an icon on the left side of the button
- **rightIcon**: React node for an icon on the right side of the button
- **loading**: Boolean to show loading state
- **loadingText**: Text to display when loading (optional)
- All existing button props (variant, size, etc.)

### Usage Examples

```jsx
import { Button } from './components/ui/button';
import { Plus, Download, Send, Save } from 'lucide-react';

// Button with left icon
<Button leftIcon={<Plus />}>
  Add New
</Button>

// Button with right icon
<Button rightIcon={<Send />}>
  Send Message
</Button>

// Loading button
<Button
  loading={isLoading}
  loadingText="Saving..."
  leftIcon={<Save />}
>
  Save Changes
</Button>

// Icon-only button
<Button variant="ghost" size="icon">
  <Download />
</Button>
```

### Features

- Automatic loading state handling
- Customizable loading text
- Proper icon spacing
- Works with all existing variants and sizes
- Loading spinner replaces left icon when loading

## Migration Guide

### Before (Manual Icon Positioning)

```jsx
// Old way - manual positioning
<div className='relative'>
  <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
  <Input className='pl-10' placeholder='Email' />
</div>
```

### After (Icon Props)

```jsx
// New way - using props
<Input placeholder='Email' leftIcon={<Mail />} />
```

## Benefits

1. **Consistency**: All inputs and buttons with icons follow the same pattern
2. **Reusability**: No need to manually position icons every time
3. **Maintainability**: Icon styling is centralized in the component
4. **Accessibility**: Better screen reader support
5. **TypeScript**: Full type safety for icon props
6. **Performance**: No unnecessary wrapper divs

## Best Practices

1. Use meaningful icons that represent the input purpose
2. Keep loading text concise and descriptive
3. For password fields, always include a visibility toggle
4. Use icon-only buttons for space-constrained areas
5. Ensure icons have proper contrast for accessibility

## Available Icons

The project uses Lucide React icons. Common icons include:

- **Form fields**: User, Mail, Lock, Phone, Calendar
- **Actions**: Search, Filter, Download, Upload, Send
- **UI**: Eye, EyeOff, ChevronDown, Plus, X
- **Navigation**: ArrowLeft, ArrowRight, Home, Settings

See [Lucide React documentation](https://lucide.dev/icons/) for the complete icon set.
