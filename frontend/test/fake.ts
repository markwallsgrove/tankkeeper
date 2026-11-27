import type { LitElement } from "lit";
import type { HassConnection, HomeAssistant, Message } from "../src/types";
import commands from "./commands.json";

interface CommandArgs {
  required: string[];
  optional: string[];
}

const COMMANDS: Record<string, CommandArgs | undefined> = commands;

/** Why the backend would refuse these arguments by name, or undefined when it takes them. */
export function badArgs(command: string, args: unknown): string | undefined {
  const known = COMMANDS[command];
  if (known === undefined) return undefined;
  const names = Object.keys(args ?? {});
  const unknown = names.filter(
    (name) => !known.required.includes(name) && !known.optional.includes(name),
  );
  const missing = known.required.filter((name) => !names.includes(name));
  if (unknown.length === 0 && missing.length === 0) return undefined;
  return `${command}: unknown ${unknown.join(",") || "-"}, missing ${missing.join(",") || "-"}`;
}

export type Handler = (message: Message) => unknown;

/** Home Assistant's websocket connection, answering Tankkeeper commands from handlers. */
export class FakeConnection implements HassConnection {
  readonly sent: Message[] = [];
  private readonly handlers = new Map<string, Handler>();

  on(command: string, answer: Handler | object): this {
    this.handlers.set(command, typeof answer === "function" ? (answer as Handler) : () => answer);
    return this;
  }

  fail(command: string, code: string, message: string): this {
    return this.on(command, () => {
      throw Object.assign(new Error(message), { code });
    });
  }

  sendMessagePromise<T>(message: Message): Promise<T> {
    this.sent.push(message);
    const command = message.type.replace("tankkeeper/", "");
    const bad = badArgs(command, message.args);
    if (bad !== undefined) return Promise.reject(new Error(bad));
    const handler = this.handlers.get(command);
    if (handler === undefined) {
      return Promise.reject(new Error(`No answer for ${message.type}`));
    }
    try {
      return Promise.resolve(handler(message) as T);
    } catch (error: unknown) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  types(): string[] {
    return this.sent.map((message) => message.type);
  }

  last(type: string): Message {
    const found = this.sent.filter((message) => message.type === `tankkeeper/${type}`).at(-1);
    if (found === undefined) throw new Error(`${type} was not sent`);
    return found;
  }
}

export function hassWith(connection: FakeConnection): HomeAssistant {
  return { connection };
}

export async function settle(element: LitElement): Promise<void> {
  for (let i = 0; i < 8; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await element.updateComplete;
  }
}

export function find(root: Element, selector: string): HTMLElement {
  const scope = root.shadowRoot ?? root;
  const found = scope.querySelector<HTMLElement>(selector);
  if (found === null) throw new Error(`Nothing matches ${selector}`);
  return found;
}

export function findAll(root: Element, selector: string): Element[] {
  return [...(root.shadowRoot ?? root).querySelectorAll(selector)];
}

export function text(root: Element): string {
  return (root.shadowRoot ?? root).textContent.replace(/\s+/g, " ").trim();
}

export function mount<T extends HTMLElement>(tag: string, props: Partial<T>): T {
  const element = document.createElement(tag) as T;
  Object.assign(element, props);
  document.body.append(element);
  return element;
}
