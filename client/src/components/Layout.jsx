import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { SidebarProvider, Sidebar, MobileHeader, useSidebar } from './Sidebar';
import Navigation from './Navigation'; // Landing page navigation
import AuthenticatedHeader from './AuthenticatedHeader';

// Layout wrapper that decides which layout to use
const LayoutContent = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Use different layouts based on authentication and route
  if (isAuthenticated) {
    // Special layout for agenda page
    if (location.pathname.startsWith('/agenda')) {
      return <AgendaLayout>{children}</AgendaLayout>;
    }
    // Standard authenticated layout for other pages
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
  }

  return <LandingLayout>{children}</LandingLayout>;
};

// Landing page layout (for non-authenticated users)
const LandingLayout = ({ children }) => {
  return (
    <div className='min-h-screen bg-background'>
      <Navigation />
      <main>{children}</main>
    </div>
  );
};

// Standard authenticated layout (header + content)
const AuthenticatedLayout = ({ children }) => {
  return (
    <div className='min-h-screen bg-background'>
      <AuthenticatedHeader />
      <main className='flex-1'>
        <div className='h-full'>{children}</div>
      </main>
    </div>
  );
};

// Special agenda layout (header + sidebar + two-section content)
const AgendaLayoutContent = ({ children }) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className='min-h-screen bg-background'>
      <AuthenticatedHeader />
      <div className='flex h-[calc(100vh-4rem)]'>
        {' '}
        {/* 4rem = header height */}
        {/* <Sidebar /> */}
        <main
          className={`
          flex-1 transition-all duration-300 ease-in-out
          ${isCollapsed ? 'lg:ml-0' : 'lg:ml-0'}
        `}
        >
          <div className='h-full'>{children}</div>
        </main>
      </div>
    </div>
  );
};

const AgendaLayout = ({ children }) => {
  return (
    <SidebarProvider>
      <AgendaLayoutContent>{children}</AgendaLayoutContent>
    </SidebarProvider>
  );
};

// Main Layout component that provides the appropriate layout
const Layout = ({ children }) => {
  return <LayoutContent>{children}</LayoutContent>;
};

// Content container component for consistent spacing
export const ContentContainer = ({
  children,
  className = '',
  maxWidth = 'max-w-content',
  padding = 'p-6',
}) => {
  return (
    <div className={`${maxWidth} mx-auto ${padding} ${className}`}>
      {children}
    </div>
  );
};

// Page header component for consistent page titles
export const PageHeader = ({ title, subtitle, actions, className = '' }) => {
  return (
    <header className={`border-b border-border bg-background ${className}`}>
      <ContentContainer className='flex items-center justify-between py-4'>
        <div>
          <h1 className='text-2xl font-bold text-foreground'>{title}</h1>
          {subtitle && (
            <p className='text-sm text-muted-foreground mt-1'>{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className='flex items-center space-x-2'>{actions}</div>
        )}
      </ContentContainer>
    </header>
  );
};

// Section component for consistent content sections
export const Section = ({
  title,
  subtitle,
  children,
  className = '',
  headerActions,
}) => {
  return (
    <section className={`${className}`}>
      {(title || subtitle || headerActions) && (
        <div className='flex items-center justify-between mb-6'>
          <div>
            {title && (
              <h2 className='text-lg font-semibold text-foreground'>{title}</h2>
            )}
            {subtitle && (
              <p className='text-sm text-muted-foreground mt-1'>{subtitle}</p>
            )}
          </div>
          {headerActions && (
            <div className='flex items-center space-x-2'>{headerActions}</div>
          )}
        </div>
      )}
      {children}
    </section>
  );
};

// Grid layouts for common patterns
export const GridLayout = ({
  children,
  columns = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  gap = 'gap-6',
  className = '',
}) => {
  return (
    <div className={`grid ${columns} ${gap} ${className}`}>{children}</div>
  );
};

// Two column layout
export const TwoColumnLayout = ({
  sidebar,
  content,
  sidebarWidth = 'w-80',
  gap = 'gap-6',
  className = '',
}) => {
  return (
    <div className={`flex flex-col lg:flex-row ${gap} ${className}`}>
      <aside className={`${sidebarWidth} flex-shrink-0`}>{sidebar}</aside>
      <main className='flex-1 min-w-0'>{content}</main>
    </div>
  );
};

// Centered layout for forms and focused content
export const CenteredLayout = ({
  children,
  maxWidth = 'max-w-md',
  className = '',
}) => {
  return (
    <div
      className={`min-h-screen flex items-center justify-center ${className}`}
    >
      <div className={`w-full ${maxWidth} px-4`}>{children}</div>
    </div>
  );
};

// Empty state component
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      {Icon && (
        <Icon className='mx-auto h-12 w-12 text-muted-foreground mb-4' />
      )}
      <h3 className='text-lg font-medium text-foreground mb-2'>{title}</h3>
      {description && (
        <p className='text-muted-foreground mb-6 max-w-sm mx-auto'>
          {description}
        </p>
      )}
      {action && action}
    </div>
  );
};

// Loading state component
export const LoadingState = ({ message = 'Loading...' }) => {
  return (
    <div className='flex items-center justify-center py-12'>
      <div className='flex items-center space-x-2'>
        <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary'></div>
        <span className='text-muted-foreground'>{message}</span>
      </div>
    </div>
  );
};

export default Layout;
