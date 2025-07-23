# Hydration Mismatch Fix Guide

## 🎯 Vấn đề đã được giải quyết

Lỗi hydration mismatch xảy ra khi HTML được render trên server khác với client, thường do:
- Browser extensions thêm attributes (Grammarly, etc.)
- Dynamic content như Date, Time
- Math.random() values
- Client-only logic (`typeof window`)

## 🛠️ Giải pháp đã implement

### 1. **Hydration Hooks** (`src/hooks/use-hydration.ts`)

```typescript
import { useIsClient, useSafeHydration } from '@/hooks/use-hydration'

// Hook để check client-side
const isClient = useIsClient()

// Hook để safe render dynamic content
const greeting = useSafeHydration(
  () => new Date().getHours() > 12 ? 'Chào buổi chiều' : 'Chào buổi sáng',
  'Xin chào' // fallback for SSR
)
```

### 2. **NoSSR Component** (`src/components/common/NoSSR.tsx`)

```typescript
import NoSSR from '@/components/common/NoSSR'

// Wrapper để tránh SSR cho dynamic content
<NoSSR fallback={<div>Loading...</div>}>
  <DynamicComponent />
</NoSSR>
```

### 3. **Safe ID Generation** (`src/lib/utils/id.ts`)

```typescript
import { generateTempId, generateId } from '@/lib/utils/id'

// Thay vì Date.now()
const tempId = generateTempId('booking')

// Thay vì Math.random()
const safeId = generateId('component')
```

### 4. **HydrationBoundary** (`src/components/common/HydrationBoundary.tsx`)

```typescript
import HydrationBoundary from '@/components/common/HydrationBoundary'

// Wrap component có thể gặp hydration issues
<HydrationBoundary fallback={<div>Loading...</div>}>
  <ProblematicComponent />
</HydrationBoundary>
```

## ✅ Components đã được fix

### 1. **DynamicGreeting** - Time-based greeting
- ✅ Sử dụng fallback value cho SSR
- ✅ Thêm `suppressHydrationWarning`

### 2. **DefaultSidebarState** - Real-time clock
- ✅ Sử dụng `useIsClient` hook
- ✅ Conditional rendering cho thời gian

### 3. **Layout.tsx** - Browser extension attributes
- ✅ Thêm `suppressHydrationWarning` cho body tag

### 4. **Terms/Privacy pages** - Date formatting
- ✅ Wrap date display với `suppressHydrationWarning`

### 5. **AddExportBookingForm** - Temporary IDs
- ✅ Thay `Date.now()` bằng `Math.random().toString(36)`

## 🚀 Best Practices đã implement

### 1. **Conditional Rendering**
```typescript
// ❌ Sai
{typeof window !== 'undefined' && <ClientComponent />}

// ✅ Đúng
const isClient = useIsClient()
{isClient && <ClientComponent />}
```

### 2. **Dynamic Content**
```typescript
// ❌ Sai
<span>{new Date().toLocaleString()}</span>

// ✅ Đúng
<span suppressHydrationWarning>
  {isClient ? new Date().toLocaleString() : '--:--:--'}
</span>
```

### 3. **Random Values**
```typescript
// ❌ Sai (hydration mismatch)
const id = `id_${Math.random()}`

// ✅ Đúng (consistent)
const [id] = useState(() => generateTempId())
```

### 4. **External Data**
```typescript
// ❌ Sai
const data = fetchData() // Khác nhau giữa server/client

// ✅ Đúng
const [data, setData] = useState(initialData)
useEffect(() => {
  fetchData().then(setData)
}, [])
```

## 🔧 Usage Examples

### Time Display Component
```typescript
'use client'
import { useIsClient } from '@/hooks/use-hydration'

export default function Clock() {
  const isClient = useIsClient()
  
  return (
    <span suppressHydrationWarning>
      {isClient ? new Date().toLocaleTimeString('vi-VN') : '--:--:--'}
    </span>
  )
}
```

### Dynamic Greeting
```typescript
'use client'
import { useSafeHydration } from '@/hooks/use-hydration'

export default function Greeting() {
  const greeting = useSafeHydration(
    () => {
      const hour = new Date().getHours()
      return hour < 12 ? 'Good Morning' : 'Good Afternoon'
    },
    'Hello' // SSR fallback
  )
  
  return <h1 suppressHydrationWarning>{greeting}</h1>
}
```

### Random Animation
```typescript
'use client'
import { useState, useEffect } from 'react'

export default function AnimatedElement() {
  const [style, setStyle] = useState({})
  
  useEffect(() => {
    setStyle({
      transform: `rotate(${Math.random() * 360}deg)`,
      left: `${Math.random() * 100}%`
    })
  }, [])
  
  return <div style={style}>Animated Element</div>
}
```

## 📈 Performance Benefits

1. **Faster Initial Load**: Consistent SSR/CSR rendering
2. **No Hydration Warnings**: Clean console logs
3. **Better UX**: No content flashing
4. **SEO Friendly**: Predictable server-side content

## 🔍 Monitoring

Để monitor hydration issues trong production:

```typescript
// Add to layout.tsx
import HydrationBoundary from '@/components/common/HydrationBoundary'

export default function Layout({ children }) {
  const handleHydrationError = (error: Error) => {
    // Log to monitoring service
    console.error('Hydration Error:', error)
  }
  
  return (
    <HydrationBoundary onHydrationError={handleHydrationError}>
      {children}
    </HydrationBoundary>
  )
}
```

## ✨ Result

- ✅ **No more hydration mismatch errors**
- ✅ **Consistent SSR/CSR rendering**
- ✅ **Better performance**
- ✅ **Improved user experience**
- ✅ **Clean console logs** 