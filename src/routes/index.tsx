import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

function App() {
	return (
		<div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
			<h1 className="text-4xl font-bold text-foreground mb-4">
				Welcome to Takonbini
			</h1>
			<p className="text-lg text-muted-foreground">
				Your Japanese convenience store companion.
			</p>
		</div>
	);
}
