'use client';

import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a0f0f] via-[#1b1814] to-[#0f0c0a] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-3xl border border-red-500/50 bg-red-900/20 p-8 text-center space-y-6">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Something went wrong</h1>
              <p className="text-white/70">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-white font-semibold hover:bg-orange-600 transition"
            >
              <RefreshCw className="h-4 w-4" />
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

