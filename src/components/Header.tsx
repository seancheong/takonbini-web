import { Link } from "@tanstack/react-router";

export default function Header() {
	return (
		<header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
			<div className="container mx-auto flex h-14 items-center">
				<div className="mr-4 hidden md:flex">
					<Link to="/" className="mr-6 flex items-center space-x-2">
						<span className="hidden font-bold sm:inline-block">Takonbini</span>
					</Link>
				</div>
			</div>
		</header>
	);
}
