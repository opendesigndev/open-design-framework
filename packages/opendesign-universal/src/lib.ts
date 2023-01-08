/* eslint-disable @typescript-eslint/no-redeclare */

// Since we want to be compatible with browser, node, webworkers and anything
// that comes in the future, we do not want to require any particular "lib"
// setting in tsconfig.json. Since there is no option to say "include whatever
// objects are available in our supported runtimes" we have to do it ourselves.
//
// Therefore this file just reexports those globals with either the existing
// global type, or fallback in case the global type is missing.
//
// This file should only contain DOM types which are also supported in node.
// Everything else should go into @opendesign/env
// You do not have to use it from dom-only parts of code
// (@opendesign/react, @opendesign/universal/dom)

interface Event {}

interface EventListener {
  (evt: Event): void;
}

interface EventTargetFallback {
  addEventListener(type: string, callback: EventListener | null): void;
  dispatchEvent(event: Event): boolean;
  removeEventListener(type: string, callback: EventListener | null): void;
}

declare var EventTarget: ExtractGlobal<
  "EventTarget",
  {
    prototype: EventTargetFallback;
    new (): EventTargetFallback;
  }
>;
interface AbortControllerFallback {
  readonly signal: InstanceType<typeof AbortSignal>;
  abort(): void;
}

interface AbortSignalFallback extends InstanceType<typeof EventTarget> {
  readonly aborted: boolean;
}

type ExtractGlobal<P extends string, Alt> = typeof globalThis extends {
  [p in P]: infer T;
}
  ? T
  : Alt;

const global: any = globalThis;

export const AbortController: ExtractGlobal<
  "AbortController",
  {
    prototype: AbortControllerFallback;
    new (): AbortControllerFallback;
  }
> = global.AbortController;

export const AbortSignal: ExtractGlobal<
  "AbortSignal",
  {
    prototype: AbortSignalFallback;
    new (): AbortSignalFallback;
    abort(reason?: any): AbortSignalFallback;
    timeout(milliseconds: number): AbortSignalFallback;
  }
> = global.AbortSignal;

export type AbortSignal = InstanceType<typeof AbortSignal>;

export const performance: ExtractGlobal<"performance", { now(): number }> =
  global.performance;
