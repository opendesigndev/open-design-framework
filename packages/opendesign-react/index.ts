import { useState } from "react";
import { createDesign } from "@avocode/opendesign-universal";

export function useDesignData(url: string) {
  const [design] = useState(() => createDesign(url));
}
