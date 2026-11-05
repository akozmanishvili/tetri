import { Component, type ErrorInfo, type ReactNode } from "react";
import i18n from "../i18n";

type Props = { children: ReactNode };
type State = { error: Error | null };

// we use i18n.t directly
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
              {i18n.t("errorBoundary.title")}
            </h1>
            <p className="mt-2 text-stone-600">
              {i18n.t("errorBoundary.body")}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-lg bg-red-800 px-4 py-2 font-medium text-white hover:bg-red-900"
            >
              {i18n.t("errorBoundary.reload")}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
