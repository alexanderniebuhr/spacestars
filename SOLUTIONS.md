# Setup

## Agents `src/worker.ts`

```
import {
	Agent,
	type Connection,
	type ConnectionContext,
	callable,
	getCurrentAgent,
	routeAgentRequest,
} from "agents";

export type SpaceState = {
	users: Record<string, { sticker: string }>;
	winningSticker: string;
};

export class SpaceAgent extends Agent<Env, SpaceState> {
	override initialState = {
		users: {},
		winningSticker: "test",
	} satisfies SpaceState;

	override onStart() {
		this
			.sql`CREATE TABLE IF NOT EXISTS user_sticker (id TEXT PRIMARY KEY, sticker TEXT)`;
	}

	override onClose(
		connection: Connection,
		code: number,
		reason: string,
		wasClean: boolean,
	) {
		console.log(
			`Connection ${connection.id} closed: ${code} ${reason} ${wasClean}`,
		);
		this.setState({
			users: Object.fromEntries(
				Object.entries(this.state.users).filter(([id]) => id !== connection.id),
			),
			winningSticker: this.state.winningSticker,
		});
	}

	// override async onStateChanged(
	// 	state: SpaceState,
	// 	source: Connection | "server",
	// ) {
	// 	console.log("State updated:", state);
	// 	console.log("Updated by:", source === "server" ? "server" : source.id);
	// 	const messages = [
	// 		{
	// 			role: "system",
	// 			content: "Always only response with the name of the sticker.",
	// 		},
	// 		{
	// 			role: "user",
	// 			content: `Stickers:${JSON.stringify(state.users)}`,
	// 		},
	// 		{
	// 			role: "user",
	// 			content: "What is the winning sticker?",
	// 		},
	// 	];
	// 	console.log("Sending question to AI:", messages);
	// 	// const response = await this.env.AI.run("@cf/zai-org/glm-4.7-flash", {
	// 	// 	messages,
	// 	// });
	// 	this.setState({
	// 		users: state.users,
	// 		winningSticker: "",
	// 	});
	// }

	override async onConnect(connection: Connection, ctx: ConnectionContext) {
		console.log(`New connection: ${connection.id}`);
	}

	@callable()
	reset() {
		this.setState({ users: {}, winningSticker: "" });
	}
}
```

```
const agentResponse = await routeAgentRequest(request, env);
if (agentResponse) return agentResponse;
```

## Agents Config `wrangler.jsonc`

```
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

```
import BackgroundImage from "../components/BackgroundImage.astro";
```

```
<BackgroundImage /> 
```

# Custom Elements (Client Side)

## Sticker Toolbar webcomponent `src/components/StickerToolbar.astro`

```
import type { SpaceAgent, SpaceState } from "../worker";
import { AgentClient } from "agents/client";
```

```
this.#client = new AgentClient<SpaceAgent, SpaceState>({
	host: window.location.origin,
	agent: "SpaceAgent",
	onStateUpdate: (state) => {
		this.#updateSelected(state);
	},
});
```

```
this.#client.setState({
	users: {
		...this.#client.state?.users,
		[this.#client.id]: { sticker },
	},
});
```

## Toolbar `src/pages/index.astro`

```
import StickerToolbar from "../components/StickerToolbar.astro";
```

```
<StickerToolbar />
```

# Server Actions

## Actions `src/actions/index.ts`
```
import { env } from "cloudflare:workers";
import { getAgentByName } from "agents";
```
```
reset: defineAction({
	handler: async () => {
		const spaceAgent = await getAgentByName(env.SpaceAgent, "default");
		await spaceAgent.reset();
		return { success: true };
	},
}),
```
## Reset Button `src/components/ResetButton.astro`

```
import { actions } from "astro:actions";
```

```
await actions.reset();
```

## Toolbar `src/pages/index.astro`


```
import ResetButton from "../components/ResetButton.astro";
```

```
<ResetButton />
```

# Server Islands + Hydration

## Astronauts `src/components/Astronauts.astro`
```
import { env } from "cloudflare:workers";
import { getAgentByName } from "agents";

const spaceAgent = await getAgentByName(env.SpaceAgent, "default");
const { users } = await spaceAgent.state;
```

```
import type { SpaceAgent, SpaceState } from "../worker";
import { AgentClient } from "agents/client";

new AgentClient<SpaceAgent, SpaceState>({
	host: window.location.origin,
	agent: "SpaceAgent",
	onStateUpdate: (state) => {
		console.log("State updated:", state);
		const astronautsElement = document.getElementById("Astronauts");
		if (astronautsElement) {
			astronautsElement.textContent = state.users
				? JSON.stringify(state.users)
				: "No users";
		}
	},
});
```

## `src/pages/index.astro`

```
import Astronauts from "../components/Astronauts.astro";
```

```
<Astronauts server:defer />
```