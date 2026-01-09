import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

export const Route = createFileRoute("/")({
	component: App,
	head: () => ({
		meta: [{ title: i18n.t("appName") }],
	}),
});

function App() {
	const { t } = useTranslation();

	return (
		<div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
			<h1 className="text-4xl font-bold text-foreground mb-4">
				{t("welcome")}
			</h1>
			<p className="text-lg text-muted-foreground">{t("subtitle")}</p>
		</div>
	);
}
