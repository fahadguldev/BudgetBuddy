# Overview

BudgetTracker is a modern expense management application built with React and Express.js. The application enables users to create monthly budgets, track expenses by category, and gain insights into their spending patterns. It features a mobile-first design with responsive components, data visualization through charts, and a clean Material Design-inspired interface using shadcn/ui components.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client uses React with TypeScript and a component-based architecture. The application is built with Vite for fast development and bundling. Key architectural decisions include:

- **Component Library**: Uses shadcn/ui components built on Radix UI primitives for consistent, accessible UI elements
- **Styling**: Tailwind CSS with CSS custom properties for theming, supporting both light and dark modes
- **State Management**: React Query (TanStack Query) for server state management with optimistic updates and caching
- **Routing**: Wouter for lightweight client-side routing without React Router's complexity
- **Form Handling**: React Hook Form with Zod validation for type-safe form validation
- **Mobile-First Design**: Responsive design with bottom navigation and mobile-optimized layouts

## Backend Architecture
The server uses Express.js with TypeScript in a RESTful API pattern:

- **Framework**: Express.js with middleware for JSON parsing, CORS, and request logging
- **Database Layer**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Schema Validation**: Zod schemas shared between client and server for consistent validation
- **Storage Pattern**: Abstract storage interface (IStorage) with in-memory implementation for development
- **API Design**: RESTful endpoints following conventional HTTP methods and status codes

## Data Storage
The application uses PostgreSQL as the primary database with Drizzle ORM:

- **Database**: PostgreSQL with Neon serverless driver for cloud deployment
- **ORM**: Drizzle ORM provides type-safe database queries and migrations
- **Schema Design**: Four main entities - budgets, categories, budget allocations, and expenses
- **Migration System**: Drizzle Kit for database schema migrations and version control
- **Development Storage**: In-memory storage implementation for rapid development and testing

## Key Features
- **Budget Management**: Monthly budget creation with income tracking
- **Category System**: Customizable spending categories with icons and colors
- **Expense Tracking**: Detailed expense logging with category assignment
- **Analytics Dashboard**: Charts and insights for spending patterns
- **Responsive Design**: Mobile-first with bottom navigation and touch-friendly interface
- **Offline Capability**: Service worker implementation for PWA functionality

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **PostgreSQL**: Primary database engine with ACID compliance

## UI and Styling
- **Radix UI**: Unstyled, accessible component primitives for complex UI elements
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **Lucide Icons**: Consistent icon library with tree-shaking support
- **shadcn/ui**: Pre-built component library combining Radix UI with Tailwind styling

## Development and Build Tools
- **Vite**: Fast build tool and development server with HMR
- **TypeScript**: Static type checking across frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind and Autoprefixer plugins

## Data and State Management
- **TanStack Query**: Server state management with caching and synchronization
- **Drizzle ORM**: Type-safe database toolkit with migration support
- **Zod**: Schema validation library for runtime type checking
- **React Hook Form**: Performant form library with validation integration

## Charting and Visualization
- **Recharts**: React charting library built on D3 for responsive data visualization

## Additional Integrations
- **Replit**: Development environment integration with banner and cartographer plugins
- **PWA Support**: Service worker implementation for offline functionality and app-like experience
- **Session Management**: Express session handling with PostgreSQL store