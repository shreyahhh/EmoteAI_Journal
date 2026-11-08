import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';

/**
 * Catches render errors in one tab so they don't take down the whole dashboard.
 * Resets automatically if `resetKey` changes (e.g. switching tabs away and back).
 */
export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <Card className="text-center">
          <CardContent className="flex flex-col items-center gap-3 pt-6">
            <h3 className="text-emote-card-title font-semibold text-foreground">Something went wrong</h3>
            <p className="max-w-sm text-emote-muted leading-relaxed text-muted-foreground">
              This section hit an unexpected error. The rest of the app is unaffected.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => this.setState({ error: null })}>
              Try again
            </Button>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}
