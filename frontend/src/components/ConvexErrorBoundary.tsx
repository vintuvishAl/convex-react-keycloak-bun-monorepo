import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ConvexErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Convex Error:', error, errorInfo);
    
    // Check if it's an auth error
    if (error.message?.toLowerCase().includes('auth') || 
        error.message?.toLowerCase().includes('unauthorized')) {
      const keycloak = (window as any).keycloakInstance;
      if (keycloak) {
        sessionStorage.clear();
        keycloak.logout({
          redirectUri: window.location.origin + '/login'
        }).catch(console.error);
      }
    }

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h2 className="text-red-800 text-lg font-semibold">Something went wrong</h2>
          <p className="text-red-600 mt-2">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button 
            className="mt-4 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}