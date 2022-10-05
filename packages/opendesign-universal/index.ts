type DesignLoader = {};

type DesignOptions = {};

type Design = {
  // this is mostly to make react wrapper triv.
  subscribe: (onStoreChange: () => void) => () => void;
};

/**
 * Main entrypoint of the API.
 *
 * @param designLoader specifies from where to load the design. string value is
 *  a shortcut for `fetchLoader(url)`
 * @param options
 */
export function createDesign(
  designLoader: string | DesignLoader,
  options?: DesignOptions
): Design {
  const loader =
    typeof designLoader === "string" ? fetchLoader(designLoader) : designLoader;

  // ...
  return {
    subscribe: () => () => {},
  };
}

export function fetchLoader(url: string) {}
