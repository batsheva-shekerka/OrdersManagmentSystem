import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService } from "./api.service";

/**
 * A single part of a Gemini conversation turn. Mirrors the SDK's `Part`
 * shape closely enough for our purposes (text, or an opaque function
 * call/response payload) without pulling in the full Gemini types on
 * the frontend.
 */
export interface AgentContentPart {
  text?: string;
  functionCall?: unknown;
  functionResponse?: unknown;
}

/** A single turn in the Gemini conversation history. */
export interface AgentHistoryTurn {
  role: "user" | "model";
  parts: AgentContentPart[];
}

export interface AgentChatRequest {
  message: string;
  userId?: string;
  history?: AgentHistoryTurn[];
}

export interface AgentChatResponse {
  response: string;
  /** Full updated conversation history — pass this back on the next call. */
  history: AgentHistoryTurn[];
}

@Injectable({ providedIn: "root" })
export class AgentService {
  private api = inject(ApiService);

  chat(
    message: string,
    userId?: string,
    history: AgentHistoryTurn[] = []
  ): Observable<AgentChatResponse> {
    const body: AgentChatRequest = { message, userId, history };
    return this.api.post<AgentChatResponse>("/agent/chat", body);
  }
}
