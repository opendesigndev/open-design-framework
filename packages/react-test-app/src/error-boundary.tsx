import { Component } from "react";
import { type Location, UNSAFE_LocationContext } from "react-router-dom";

type State = { error: null | { location: Location } };
export class ErrorBoundary extends Component<{ children: JSX.Element }, State> {
  state: State = { error: null };
  declare context: React.ContextType<typeof UNSAFE_LocationContext>;

  static contextType = UNSAFE_LocationContext as any;

  componentDidCatch(error: unknown) {
    this.setState({ error: { location: this.context.location } });
  }

  render() {
    if (this.state.error?.location === this.context.location) {
      // You can render any custom fallback UI
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
