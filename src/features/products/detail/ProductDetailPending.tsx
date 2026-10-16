export default function ProductDetailPending() {
	return (
		<div className="min-h-screen bg-background px-4 pb-16 pt-24">
			<div className="mx-auto w-full max-w-6xl">
				<div className="h-5 w-32 animate-pulse rounded-full bg-muted" />
				<div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
					<div className="aspect-4/3 w-full animate-pulse rounded-2xl border border-border/60 bg-muted/40" />
					<div className="space-y-4">
						<div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
						<div className="h-20 w-full animate-pulse rounded bg-muted" />
						<div className="h-10 w-1/3 animate-pulse rounded bg-muted" />
					</div>
				</div>
			</div>
		</div>
	);
}
