/**
 * Very simple text reflow algorithm which will make sure that the text printed
 * fits into output window. Also helps us avoid extra diffs caused by having to
 * reflow text by hand.
 *
 * @param input Text to be reflown.
 * @param maxWidth Max text width. Defaults to width of the containing terminal
 * @returns
 */
export function reflow(
  input: string,
  maxWidth: number = Math.min(process.stdout.columns, 80),
) {
  return input
    .split("\n\n")
    .map((v) => flowParagraph(v, maxWidth))
    .join("\n\n");
}

function flowParagraph(input: string, maxWidth: number) {
  input = input.replaceAll("\n", " ").replace(/( an?) /g, "$1\u00A0");
  let output = "";
  while (input.length) {
    if (input.length <= maxWidth) {
      output += "\n" + input;
      input = "";
      continue;
    }
    const start = input.substring(0, maxWidth + 1);
    const idx = start.lastIndexOf(" ");
    if (idx > 0) {
      output += "\n" + input.substring(0, idx);
      input = input.substring(idx + 1);
    } else {
      let idx2 = input.substring(maxWidth).indexOf(" ");
      if (idx2 < 0) {
        output += "\n" + input;
        input = "";
      } else {
        output += "\n" + input.substring(0, maxWidth + idx2);
        input = input.substring(maxWidth + idx2 + 1);
      }
    }
  }
  return output.slice(1).replace(/\u00A0/g, " ");
}

const expected = Symbol("expected");
/**
 * Throw return value of this to make sure that error message gets show to the
 * user without stacktrace attached.
 *
 * @param message error message to be shown
 * @param cause same as Error.cause
 */
export function expectedError(message: string, cause?: Error) {
  const err = new Error(message, cause);
  Error.captureStackTrace(err, expectedError);
  (err as any)[expected] = true;
  throw err;
}
export function isExpectedError(error: any): error is Error {
  return typeof error === "object" && error && expected in error;
}

export function packageRoot() {
  if (import.meta.url.endsWith(".ts"))
    return new URL("..", import.meta.url).href;
  return new URL("../..", import.meta.url).href;
}
