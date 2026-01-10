import { ScriptOnce } from "@tanstack/react-router";

/**
 * Executes a function only once with the given parameter
 */
export function FunctionOnce<T = unknown>({
	children,
	param,
}: {
	children: (param: T) => unknown;
	param?: T;
}) {
	return (
		<ScriptOnce>
			{`(${children?.toString()})(${JSON.stringify(param)})`}
		</ScriptOnce>
	);
}
