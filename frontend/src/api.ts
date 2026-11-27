import type { ChatAgent, ConverseResult, HassConnection, Message } from "./types";

/** Calls TankKeeper's websocket commands, which use the same service layer as the tools. */
export class TankkeeperApi {
  /**
   * timeZone is Home Assistant's, so "today" is the same day the backend uses.
   * entryId is the tank's config entry, which the settings cog opens.
   */
  constructor(
    private readonly connection: HassConnection,
    readonly timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
    readonly entryId?: string,
  ) {}

  call<T>(tool: string, args: Record<string, unknown> = {}): Promise<T> {
    return this.send<T>({ type: `tankkeeper/${tool}`, args });
  }

  accept(proposalId: string): Promise<unknown> {
    return this.send({ type: "tankkeeper/accept_proposal", proposal_id: proposalId });
  }

  reject(proposalId: string): Promise<unknown> {
    return this.send({ type: "tankkeeper/reject_proposal", proposal_id: proposalId });
  }

  acceptFinding(checkId: string): Promise<unknown> {
    return this.send({ type: "tankkeeper/accept_finding", check_id: checkId });
  }

  rejectFinding(checkId: string): Promise<unknown> {
    return this.send({ type: "tankkeeper/reject_finding", check_id: checkId });
  }

  deleteConversation(conversationId: string): Promise<unknown> {
    return this.send({ type: "tankkeeper/delete_conversation", conversation_id: conversationId });
  }

  chatAgent(): Promise<ChatAgent> {
    return this.send<ChatAgent>({ type: "tankkeeper/chat_agent" });
  }

  /** Send one chat message to the agent through Home Assistant's conversation API. */
  converse(text: string, conversationId: string, agentId: string): Promise<ConverseResult> {
    return this.send<ConverseResult>({
      type: "conversation/process",
      text,
      conversation_id: conversationId,
      agent_id: agentId,
    });
  }

  private send<T>(message: Message): Promise<T> {
    return this.connection.sendMessagePromise<T>(message);
  }
}

/** The text of a failed command, an error or anything else that was thrown. */
export function errorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  return String(error);
}
