/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import { sleep } from "./sleep.utils";
import { assert } from "./assert.utils";

type WebpackFederatedModule = {
	[key: string]: {
		mount: (containerRef: string | HTMLElement) => () => void;
		unmount: (containerRef: string | HTMLElement) => void;
	};
};
export function loadComponent(scope: string, module: string) {
	return async (): Promise<WebpackFederatedModule | undefined> => {
		if (typeof window === "undefined") {
			return;
		}
		// Initializes the share scope. This fills it with known provided modules from this build and all remotes
		// @ts-ignore
		// eslint-disable-next-line no-undef
		await __webpack_init_sharing__("default");

		type ModuleContainer = {
			init: () => Promise<void>;
			get: (module: string) => () => WebpackFederatedModule;
		};
		const container = (
			window as unknown as Record<typeof scope, ModuleContainer>
		)[scope]; // Or get the container somewhere else
		// Initialize the container, it may provide shared modules
		try {
			// @ts-ignore
			// eslint-disable-next-line no-undef
			await container.init(__webpack_share_scopes__.default);
		} catch (err) {
			console.warn(err, { scope, module, container });
		}
		const factory = await Promise.race([
			container?.get(module),
			sleep(300).then(() =>
				Promise.reject(
					new Error(
						`No module ${module} was found in window.${scope} container`
					)
				)
			),
		]);
		const Module =
			typeof factory === "function"
				? factory()
				: Promise.reject(
						new Error(
							`No module ${module} was found in window.${scope} container`
						)
				  );
		return Module;
	};
}

export const loadScript = (
	id: string,
	src: string
): Promise<HTMLScriptElement> => {
	return new Promise((resolve, reject) => {
		if (document.querySelector(`script[id="${id}"]`)) {
			const script: HTMLScriptElement = assert(
				document.querySelector(`script[id="${id}"]`),
				`script must exist: [id=${id}]`
			);
			resolve(script);
		}
		const script = document.createElement("script");
		script.id = id;
		script.src = src;
		script.type = "text/javascript";
		script.async = true;
		script.onload = () => resolve(script);
		script.onerror = reject;
		document.head.appendChild(script);
	});
};

export const loadMicrofrontend = async ({
	entry,
	scope,
	module,
	composition = "default",
}: {
	entry: string;
	scope: string;
	module: string;
	composition: string;
}) =>
	loadScript(`mf-${scope.toLowerCase()}-entry`, entry)
		.then(() => loadComponent(scope, module)())
		.then((exported) => {
			return assert(exported)[composition] as unknown as (
				containerRef: string | HTMLElement
			) => () => void;
		})
		.then((mount) => {
			return {
				mount,
			};
		})
		.catch((error: unknown) => Promise.reject(error));
