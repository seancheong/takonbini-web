// @vitest-environment node
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nextProvider, useTranslation } from "react-i18next";
import { expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start", () => ({
	createIsomorphicFn: () => ({
		server: (server: unknown) => ({ client: () => server }),
	}),
}));
vi.mock("@tanstack/react-start/server", () => ({
	getCookie: vi.fn(),
	getRequestHeader: vi.fn(),
	setCookie: vi.fn(),
}));

import { getRouterI18n } from "@/i18n";

function Heading() {
	const { t, i18n } = useTranslation();
	return createElement("h1", { lang: i18n.language }, t("appName"));
}

it("keeps overlapping SSR translations and language tags scoped to each router", async () => {
	const requests = ["en", "ja", "zh"].map((language) => ({
		language,
		i18n: getRouterI18n(),
	}));
	await Promise.all(
		requests.map(async (request) => {
			await request.i18n.changeLanguage(request.language);
			await Promise.resolve();
		}),
	);
	for (const request of requests) {
		const html = renderToStaticMarkup(
			createElement(
				I18nextProvider,
				{ i18n: request.i18n },
				createElement(Heading),
			),
		);
		expect(html).toContain(`lang="${request.language}"`);
		expect(html).toContain(request.i18n.getFixedT(request.language)("appName"));
	}
});
