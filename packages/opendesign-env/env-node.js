/**
 * similar to rust's todo! macro or java's and C#'s NotImplemented Exception
 * just throws an error
 */
function todo(what: string): never {
  throw new Error("TODO: " + what);
}

export const createCanvas = () => todo("createCanvas");
export const fetch = () => todo("fetch");
export const parseImage = () => todo("parseImage");
export const warn = console.warn.bind(console);
