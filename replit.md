# AutoScrapePro - Vehicle Data Scraping Platform

## Overview

AutoScrapePro is a comprehensive vehicle data scraping platform that combines a browser extension with a full-stack web application to automate the extraction and management of vehicle listings from major automotive websites. The system scrapes vehicle data from AutoTrader, Cars.com, CarGurus, and Dealer.com, stores it in a centralized database, and provides tools for managing and reposting vehicles to Facebook Marketplace.

The platform consists of three main components: a Chrome extension that performs the actual scraping, a React-based dashboard for data management, and an Express.js API backend that coordinates operations and stores data.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Dark Mode Implementation (August 2025)
- Added complete dark mode toggle feature with theme provider
- Implemented localStorage persistence and system theme detection
- Updated all dashboard components with dark mode styling
- Theme toggle appears in dashboard header with sun/moon icons
- Fixed Windows compatibility issue with server host binding (localhost vs 0.0.0.0)

## System Architecture

### Frontend Architecture
The client application is built using React 18 with TypeScript, utilizing the "wouter" library for lightweight routing. The UI is constructed with shadcn/ui components based on Radix UI primitives, styled with Tailwind CSS using a custom design system with CSS variables for theming. State management is handled through TanStack Query (React Query) for server state management, providing caching, synchronization, and background updates. The build system uses Vite for fast development and optimized production builds.

### Backend Architecture
The server runs on Express.js with TypeScript, implementing a RESTful API architecture. The application uses a modular structure with separate route handlers, storage abstractions, and database connections. Database operations are handled through Drizzle ORM, which provides type-safe SQL queries and migrations. The server includes middleware for request logging, error handling, and development-specific features like Vite integration.

### Browser Extension Architecture
The Chrome extension uses Manifest V3 with a service worker background script, content scripts for website interaction, and a popup interface. Content scripts are injected into target automotive websites to extract vehicle data using site-specific selectors. The extension communicates with the main application through HTTP requests to the backend API and uses Chrome's storage API for configuration persistence.

### Data Storage Solutions
PostgreSQL serves as the primary database, accessed through Neon's serverless driver for connection pooling and performance optimization. The database schema includes tables for vehicles, scraping sessions, activity logs, user management, Facebook integration settings, and extension configurations. Drizzle ORM provides the data access layer with automatic TypeScript type generation from the schema definitions.

### Authentication and Session Management
The system uses connect-pg-simple for PostgreSQL-based session storage, integrated with Express sessions. User authentication is handled through traditional username/password authentication with session-based persistence. The database includes a users table for credential storage and user management.

### State Management and Real-time Updates
The frontend uses TanStack Query for intelligent caching and background synchronization of server state. Real-time updates are achieved through periodic polling with configurable intervals based on the operation type (active scraping sessions poll every 2 seconds, dashboard stats refresh less frequently). The extension maintains its own state and communicates status updates to the web application through API calls.

## External Dependencies

### Database and Infrastructure
- **Neon PostgreSQL**: Serverless PostgreSQL database hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations and migrations
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### Frontend Libraries
- **React 18**: Core frontend framework with TypeScript support
- **TanStack Query**: Server state management, caching, and synchronization
- **wouter**: Lightweight client-side routing library
- **shadcn/ui**: Component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Vite**: Build tool and development server

### Backend Dependencies
- **Express.js**: Web framework for the API server
- **TypeScript**: Type safety and enhanced development experience
- **Zod**: Runtime type validation and schema definition
- **date-fns**: Date manipulation and formatting utilities

### Chrome Extension APIs
- **Chrome Storage API**: Persistent storage for extension settings
- **Chrome Tabs API**: Tab management and communication
- **Chrome Scripting API**: Dynamic content script injection
- **Web Accessible Resources**: Secure resource sharing between extension components

### Target Website Integration
- **AutoTrader.com**: Vehicle listing scraping with site-specific selectors
- **Cars.com**: Automotive data extraction and processing
- **CarGurus.com**: Vehicle information and pricing data collection
- **Dealer.com**: Dealership inventory scraping capabilities
- **Facebook Marketplace**: Integration for automated vehicle posting (manual process with generated descriptions)

### Development and Build Tools
- **ESBuild**: Fast JavaScript/TypeScript bundling for production
- **tsx**: TypeScript execution for development and scripts
- **PostCSS**: CSS processing and optimization
- **Autoprefixer**: Automatic vendor prefix addition for cross-browser compatibility