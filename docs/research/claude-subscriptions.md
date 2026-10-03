# Claude subscriptions in NGO OS

Research checked on 2026-10-03 for a private hackathon demo. Community projects already implement subscription-backed Claude access. This document compares their code and proposes an integration. No live subscription request or connection UI was tested.

## Recommendation

Use [ben-vargas/ai-sdk-provider-claude-code](https://github.com/ben-vargas/ai-sdk-provider-claude-code) for the first local demo. Its current npm release is `4.3.3`, supports our AI SDK 7 stack, and uses the Claude Agent SDK with a Claude Code login. It avoids adding a separate proxy service. These facts were checked against npm metadata and the repository's current README.

For the exact browser-based **Connect Claude** feature, use [shahidshabbir-se/opencode-anthropic-oauth](https://github.com/shahidshabbir-se/opencode-anthropic-oauth) as the OAuth and transport reference. It implements browser authorization, code exchange, and token refresh. It is an OpenCode plugin, so it needs adaptation to our server facade rather than installation as a Next.js provider.

These are two useful implementation routes. The first gets subscription-backed inference into the demo with less work. The second supplies the browser login flow the requested feature needs.

## Repositories worth reusing

| Repository | What its code provides | Fit for NGO OS |
| --- | --- | --- |
| [ben-vargas/ai-sdk-provider-claude-code](https://github.com/ben-vargas/ai-sdk-provider-claude-code) | AI SDK 7 provider, streaming, model selection, and Claude Code authentication | Best local demo candidate. Custom workspace tools need its MCP bridge. |
| [shahidshabbir-se/opencode-anthropic-oauth](https://github.com/shahidshabbir-se/opencode-anthropic-oauth) | Browser OAuth with PKCE, code exchange, refresh, and custom Anthropic request handling | Closest reference for a real Connect Claude button. Port its small auth module and adapt the transport. |
| [griffinmartin/opencode-claude-auth](https://github.com/griffinmartin/opencode-claude-auth) | Existing Claude Code credential reuse, refresh coordination, and tool/request/stream transformations | Useful reference for the direct Anthropic transport. Not a drop-in web package. |
| [RichardAtCT/claude-code-openai-wrapper](https://github.com/RichardAtCT/claude-code-openai-wrapper) | Python service wrapping the Agent SDK behind OpenAI-compatible endpoints | Useful if we want a separate local proxy. More deployment work than a native TypeScript provider. |

All four repositories report an MIT license. The source inspections below establish implementation details, not successful access with our account.

## The local demo route

The [provider's tool example](https://github.com/ben-vargas/ai-sdk-provider-claude-code/blob/main/examples/ai-sdk-tools.ts) exports `createAiSdkMcpServer`. It converts AI SDK tools with Zod object schemas into an in-process MCP server. The example demonstrates provider-executed tool calls and results in both generated and streamed responses.

Our `workspaceTools` in `src/server/assistant/facade.ts` already use Zod object schemas and call `src/server/workspace/facade.ts`. Reuse those definitions through the helper. A separate public MCP endpoint is unnecessary for this route.

The proposed implementation is small.

1. Add the community provider through pnpm. Configure a Claude-specific model path in the server assistant facade.
2. Authenticate Claude Code on the machine running the demo server. A login on a visitor's laptop does not automatically authenticate a remote server.
3. Bridge `workspaceTools` into an in-process server named `workspace`. Allow its named tools and disable Claude Code's built-in filesystem and shell tools.
4. Stream through the existing AI SDK and assistant-ui chat. Let Claude Code own its tool loop for this path. Passing our normal `tools` map to `ToolLoopAgent` does not automatically expose it to the CLI.
5. Add a model choice using Claude Code aliases such as `sonnet`, `opus`, and `haiku`. Actual availability comes from the signed-in account.
6. Verify a streamed reply and a persisted task creation before calling the integration working.

Keep the existing OpenRouter path. The Claude path has different tool execution semantics, so this is a provider-specific branch behind the facade, not a replacement for the workspace tools or UI.

One host login is one connected account. That is enough to prove the demo's inference path, but it is not the requested per-user connection feature. Separate users need separate authenticated runtimes or configuration directories. The provider's [settings type](https://github.com/ben-vargas/ai-sdk-provider-claude-code/blob/main/src/types.ts) supports per-instance subprocess environment configuration. Never claim that every visitor spends their own allowance when requests use the host account.

## The browser Connect Claude route

The browser plugin's [OAuth module](https://github.com/shahidshabbir-se/opencode-anthropic-oauth/blob/master/src/oauth.ts) has `createAuthorizationRequest`, `exchangeCodeForTokens`, and `refreshTokens`. It uses a SHA-256 PKCE challenge and a code-paste flow. Its [plugin entry point](https://github.com/shahidshabbir-se/opencode-anthropic-oauth/blob/master/src/index.ts) wires those operations into OpenCode and customizes Anthropic requests.

The proposed data shape is one connection per authenticated user. A connection holds its access token, refresh token, expiry, and selected model. Pending authorization holds its verifier, state, owner, and expiry. Public UI state is disconnected, awaiting authorization, connected, or needs attention. Tokens remain server-side and encrypted at rest.

A new server-only connection facade starts authorization, completes the code exchange, refreshes credentials, and disconnects. Route-local settings show **Connect Claude**, an authorization link, a code field when needed, a model choice, and **Disconnect**. Use the existing UI components.

Resolve the current user's connection inside `streamAssistant()`. For the direct API route, use the AI SDK Anthropic provider with a custom fetch adapter based on the community transport. That keeps our existing `ToolLoopAgent` and workspace tools. For the native CLI route, keep credentials in the user's own runtime and let the CLI manage them. Avoid combining both refresh mechanisms against one login.

The transport requires more than replacing an API key with a bearer token. The two OpenCode plugins also transform headers, system prompts, tool names, and stream events. Their implementations differ, including billing-header handling. Copying a README snippet is not enough. Select one complete transport and test it against the current account before porting it.

## Existing app integration points

| Location | Change needed |
| --- | --- |
| `src/server/assistant/facade.ts` | Resolve the selected connection and provider before generation. Reuse `workspaceTools`. |
| `src/app/(api)/api/assistant/route.ts` | Keep the route thin. Its current 60-second limit needs a check with CLI startup latency. |
| `src/server/api/context.ts` and `src/server/api/trpc.ts` | Reuse Clerk identity and authenticated procedures for per-user connections. |
| `src/server/<domain>/facade.ts` | New server-only boundary for connection lifecycle and credential access. |
| `src/env.ts` | Validated provider configuration and encryption settings. |
| `src/app/(workspace)/dashboard/` | Route-local connection controls and model selection. |

The current assistant uses one `OPENROUTER_API_KEY` and the global `WORKSPACE_AI_MODEL`. Its route does not enforce Clerk identity, and workspace operations use shared demo data. Add user identity before storing per-user credentials. Keep the hackathon's shared workspace behavior explicit.

## What still needs a live check

Verify subscription authentication, model availability, token refresh, and a streamed response. Verify that a tool creates a real task through the existing facade. Check that disconnect prevents future requests and that two users cannot select each other's connection. Usage metadata describes requests; it is not a transferable subscription token balance.

The repositories are community integrations and can break when upstream auth or request handling changes. [Anthropic's official SDK documentation](https://code.claude.com/docs/en/agent-sdk/overview#get-started) restricts third-party subscription login without prior approval. That distinction does not erase the implementations above. For this private demo, the technical recommendation is the native AI SDK provider first, with the browser plugin as the reference for a per-user connection flow.
