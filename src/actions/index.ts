import { defineAction } from "astro:actions";
import { env } from "cloudflare:workers";
import { getAgentByName } from "agents";

export const server = {
	reset: defineAction({
		handler: async () => {
			const spaceAgent = await getAgentByName(env.SpaceAgent, "default");
			await spaceAgent.reset();
			return { success: true };
		},
	}),
};
