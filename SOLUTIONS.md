# Setup

## Agents `src/worker.ts`

```ts
import {
	Agent,
	type Connection,
	type ConnectionContext,
	callable,
	getCurrentAgent,
	routeAgentRequest,
} from "agents";

export type SpaceState = {
	users: Record<string, { sticker: string, top: string, left: string }>;
};

export class SpaceAgent extends Agent<Env, SpaceState> {
	override initialState = {
		users: {},
	} satisfies SpaceState;

	override onClose(
		connection: Connection,
		code: number,
		reason: string,
		wasClean: boolean,
	) {
		this.setState({
			users: Object.fromEntries(
				Object.entries(this.state.users).filter(([id]) => id !== connection.id),
			),
		});
	}

	@callable()
	reset() {
		this.setState({ users: {} });
	}
}
```

```ts
const agentResponse = await routeAgentRequest(request, env);
if (agentResponse) return agentResponse;
```

## Agents Config `wrangler.jsonc`

```jsonc
"durable_objects": {
	"bindings": [
		{
			"name": "SpaceAgent",
			"class_name": "SpaceAgent"
		}
	]
},
"migrations": [
	{
		"tag": "v1",
		"new_sqlite_classes": ["SpaceAgent"]
	}
],
```

# Astro Images

## Background Image `src/pages/index.astro`

```ts
import BackgroundImage from "../components/BackgroundImage.astro";
```

```astro
<BackgroundImage /> 
```

# Custom Elements (Client Side)

## Sticker Toolbar webcomponent `src/components/StickerToolbar.astro`

```ts
import type { SpaceAgent, SpaceState } from "../worker";
import { AgentClient } from "agents/client";
```

```ts
this.#client = new AgentClient<SpaceAgent, SpaceState>({
	host: window.location.origin,
	agent: "SpaceAgent",
	onStateUpdate: (state) => {
		this.#updateSelected(state);
	},
});
```

```ts
this.#client.setState({
	users: {
		...this.#client.state?.users,
		[this.#client.id]: { sticker, top:  `${Math.random() * 85 + 5}%`, left: `${Math.random() * 85 + 5}%` },
	},
});
```

## Toolbar `src/pages/index.astro`

```ts
import StickerToolbar from "../components/StickerToolbar.astro";
```

```astro
<StickerToolbar />
```

# Server Actions

## Actions `src/actions/index.ts`
```ts
import { env } from "cloudflare:workers";
import { getAgentByName } from "agents";
```
```ts
reset: defineAction({
	handler: async () => {
		const spaceAgent = await getAgentByName(env.SpaceAgent, "default");
		await spaceAgent.reset();
		return { success: true };
	},
}),
```
## Reset Button `src/components/ResetButton.astro`

```ts
import { actions } from "astro:actions";
```

```ts
await actions.reset();
```

## Admin `src/pages/admin.astro`


```ts
import ResetButton from "../components/ResetButton.astro";
```

```astro
<ResetButton />
```

# Server Islands + Hydration

## Astronauts `src/components/Astronauts.astro`
```ts
import { env } from "cloudflare:workers";
import { getAgentByName } from "agents";

const spaceAgent = await getAgentByName(env.SpaceAgent, "default");
const { users } = await spaceAgent.state;
```

```ts
import type { SpaceAgent, SpaceState } from "../worker";
import { AgentClient } from "agents/client";

new AgentClient<SpaceAgent, SpaceState>({
	host: window.location.origin,
	agent: "SpaceAgent",
onStateUpdate: (state) => {
		console.log("State updated:", state);
		const astronautsElement = document.getElementById("astronauts");
		if (astronautsElement) {
			astronautsElement.innerHTML = "";
      Object.values(state.users).forEach(sticker => {
        const stickerElement = document.createElement("span");
        stickerElement.className = "absolute inline-flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 select-none items-center justify-center rounded-full bg-white/90 text-3xl shadow-2xl";
        stickerElement.style.top = sticker.top;
        stickerElement.style.left = sticker.left;
        stickerElement.textContent = sticker.sticker;
        astronautsElement.appendChild(stickerElement);
      });
		}
	},
});
```

## `src/pages/index.astro`

```ts
import Astronauts from "../components/Astronauts.astro";
```

```astro
<Astronauts server:defer />
```