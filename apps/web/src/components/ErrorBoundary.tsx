import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Uncaught render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-screen place-items-center bg-stone-50 px-4">
          <div className="max-w-md text-center">
            <p className="text-4xl">🍷💥</p>
            <h1 className="mt-4 text-xl font-semibold text-stone-900">
              Something spilled at the supra
            </h1>
            <p className="mt-2 text-stone-600">
              An unexpected error happened. Reloading usually fixes it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-lg bg-red-800 px-4 py-2 font-medium text-white hover:bg-red-900"
            >
              Reload Tetri
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
