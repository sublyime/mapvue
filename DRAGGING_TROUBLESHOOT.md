# Dragging Windows - Troubleshooting Guide

## 🔍 **Issue Diagnosis**

Your windows can't be dragged because the draggable window system isn't integrated into your current application. You're still using the original static components.

## ✅ **Solution Applied**

I've updated your `main.tsx` to use `WindowizedMapVue` instead of the original `App`. This should enable the draggable window system.

## 🧪 **Testing Options**

### **Option 1: Full Integration (Applied)**
Your `main.tsx` now loads `WindowizedMapVue` which includes the complete draggable window system.

### **Option 2: Test Mode**
If you want to test just the dragging first, temporarily change `main.tsx` to:

```tsx
import WindowTest from './WindowTest.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WindowTest />
  </StrictMode>,
)
```

This will show you 3 test windows to verify dragging works.

## 🎮 **How to Test Dragging**

Once you restart your dev server, you should be able to:

1. **Open Windows**: Click the taskbar at the bottom
2. **Drag**: Click and hold window headers, then drag
3. **Resize**: Drag corners or edges 
4. **Dock**: Drag windows to left/right screen edges
5. **Controls**: Use minimize/maximize/close buttons

## ⚠️ **Common Issues**

### **Windows Still Not Draggable?**
- Restart your dev server: `npm run dev`
- Check browser console for errors
- Verify no CSS is preventing mouse events

### **TypeScript Errors?**
- Some components may need props updated
- Check that all imports resolve correctly

### **No Taskbar Visible?**
- Look at the bottom of the screen
- It appears as a dark rounded bar with window icons

## 🔧 **Quick Fixes**

### **CSS Conflicts**
If something is blocking mouse events, add to your CSS:
```css
.draggable-window {
  pointer-events: auto !important;
}
```

### **Z-Index Issues**
Make sure no elements have z-index higher than 9999:
```css
.high-z-element {
  z-index: 999; /* Lower than window system */
}
```

## 🚀 **Next Steps**

1. **Restart Dev Server**: `npm run dev` or `yarn dev`
2. **Test Dragging**: Try the test windows first
3. **Use Full App**: Switch back to `WindowizedMapVue` 
4. **Customize**: Modify window positions and sizes as needed

The draggable window system should now be active! 🎉