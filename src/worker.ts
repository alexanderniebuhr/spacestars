import handler from "@astrojs/cloudflare/entrypoints/server";

// TODO
export default {
	async fetch(request, env, ctx) {
		// TODO
		return handler.fetch(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;
