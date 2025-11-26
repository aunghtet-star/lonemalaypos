import React from 'react';

interface ErrorBoundaryState { hasError: boolean; error?: Error; }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('UI ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center text-red-600">
          <h2 className="font-bold mb-2">Something went wrong.</h2>
          <p className="text-sm mb-4">{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-500 text-white rounded">Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

