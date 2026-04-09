import handler from "@astrojs/cloudflare/entrypoints/server";
import {
	Agent,
	type Connection,
	type ConnectionContext,
	callable,
	getCurrentAgent,
	routeAgentRequest,
} from "agents";

export type SpaceState = {
	users: Record<string, { sticker: string; top: string; left: string }>;
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

export default {
	async fetch(request, env, ctx) {
		const agentResponse = await routeAgentRequest(request, env);
		if (agentResponse) return agentResponse;
		return handler.fetch(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;
