/**
 * similar to rust's todo! macro or java's and C#'s NotImplemented Exception
 * just throws an error
 */
function todo(what) {
  throw new Error("TODO: " + what);
}

export const createCanvas = () => null;
export const parseImage = () => todo("parseImage");

export const requestAnimationFrame = (callback) => setTimeout(callback, 0);
export const cancelAnimationFrame = (timeout) => clearTimeout(timeout);

// Following APIs are built-in in newer nodejs versions, but we want to support
// older (but not EOL) node.js versions, where reasonable.
// TODO: once all versions that do not have those APIs go EOL use globals instead
// But eg. node 18 goes EOL at 2025-04-30: https://github.com/nodejs/Release
export { webcrypto as crypto } from "node:crypto";
export { default as fetch } from "node-fetch";
