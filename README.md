# ZettleCards - Obsidian Flashcard App

A modern, offline-first Progressive Web Application that transforms Obsidian
and Zettelkasten Markdown notes into intelligent flashcards with spaced
repetition. Built with React, TypeScript, and modern web technologies.

## What It Does

ZettleCards converts your knowledge management workflow into an effective
learning system:

- **Smart Import**: Automatically extracts questions from note titles and
  answers from content
- **Spaced Repetition**: Implements a Leitner system for optimal retention
- **Offline-First**: Full PWA functionality with local data storage
- **Privacy-Focused**: All data stays on your device via IndexedDB
- **Obsidian Integration**: Supports wiki-links, frontmatter, and tag systems

## Tech Stack & Architecture

### Frontend Framework

- **React 19** with TypeScript for type-safe component development
- **React Router v7** for client-side routing and navigation
- **Tailwind CSS v4** for utility-first styling and responsive design
- **Vite** as the build tool for fast development and optimized production builds

### Data Management

- **Dexie.js** (IndexedDB wrapper) for client-side database operations
- **React Context API** for global state management
- **Custom hooks** (`useCards`, `useToast`) for reusable business logic
- **Zod** for runtime type validation and schema enforcement

### PWA & Offline Capabilities

- **Vite PWA Plugin** with Workbox for service worker management
- **Automatic caching** strategies for static assets and API calls
- **Install prompts** and update notifications
- **Offline fallback** pages and graceful degradation

### Content Processing

- **Marked** for Markdown parsing with custom renderers
- **DOMPurify** for XSS protection and content sanitization
- **Gray Matter** for frontmatter extraction and parsing
- **Highlight.js** for syntax highlighting in code blocks

### Development & Quality

- **TypeScript** with strict type checking and modern ES features
- **ESLint** with React-specific rules and TypeScript integration
- **Playwright** for end-to-end testing and accessibility validation
- **Error boundaries** and comprehensive error handling

## Key Technical Features

### Spaced Repetition Algorithm

Implements a 5-box Leitner system with configurable intervals:

- Box 1: Daily review
- Box 2: +1 day intervals
- Box 3: +3 day intervals
- Box 4: +7 day intervals
- Box 5: +21 day intervals

### Performance Optimizations

- **Code splitting** with vendor chunks for optimal caching
- **Bundle size**: ~1.5MB total (450KB gzipped)
- **Lazy loading** for non-critical components
- **Memoization** with React.memo and useMemo for expensive operations

## Architecture Highlights

### Component Structure

- **Layout components** for consistent UI structure
- **Feature-based organization** (Import, Library, Review, Settings)
- **Reusable UI components** (Toast, Spinner, ErrorBoundary)
- **Custom hooks** for business logic separation

### State Management

- **Context providers** for global state (Cards, Toast notifications)
- **Local component state** for UI-specific data
- **Database synchronization** with real-time updates
- **Optimistic updates** for smooth user experience

### Error Handling

- **Error boundaries** for graceful failure recovery
- **Toast notifications** for user feedback
- **Comprehensive logging** in development mode
- **Fallback UI states** for network failures

### Accessibility

- **WCAG AA compliance** with proper ARIA labels
- **Keyboard navigation** support throughout the app
- **Screen reader compatibility** with semantic HTML
- **Focus management** and skip links

## Development Practices

### Code Quality

- **TypeScript strict mode** for compile-time error detection
- **ESLint configuration** with React and TypeScript rules
- **Consistent naming conventions** and code organization
- **Comprehensive error handling** and user feedback

### Testing Strategy

- **End-to-end tests** with Playwright for critical user flows
- **Accessibility testing** for WCAG compliance
- **Cross-browser compatibility** testing
- **Performance monitoring** and optimization

### Build & Deployment

- **Vite configuration** with optimized production builds
- **PWA manifest** and service worker setup
- **Asset optimization** and caching strategies
- **Environment-specific configurations**

## Browser Support

- **Modern browsers** with ES2020+ support
- **IndexedDB** and **Service Worker** compatibility required
- **PWA installation** support on mobile and desktop
- **Offline functionality** after initial load

## Performance Metrics

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3s
