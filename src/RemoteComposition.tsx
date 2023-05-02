import React, { useEffect, useState, useRef, useMemo } from "react";
import { assert } from "./utils/assert.utils";

import { loadMicrofrontend } from "./utils/loader.utils";
import {
	continueRender,
	delayRender,
	useCurrentFrame,
	useVideoConfig,
	VideoConfig,
	AbsoluteFill,
} from "remotion";

export type MicrofrontendProps = {
	scope: string;
	/**
	 * The url of the exported composition
	 * eg: http://localhost:3000/remoteEntry.js
	 */
	url: string;
	/**
	 * The fileName of the script which exports those compositions
	 * eg: `./src/bootstrap`
	 */
	module: string;
	/** The name of the exported composition.If the composition is the default export,then simply use "default" */
	composition: string;
	/**Props to pass down to the composition */
	compositionProps?: { [key: string]: any };

	key?: string;
	id?: string;
	hasDelayedRender?: boolean;
	className?: string;
	/** An element to show when the remote composition is loading */
	Loading?: JSX.Element | (() => JSX.Element);
	loadMicrofrontend?: (manifest: {
		scope: string;
		entry: string;
		module: string;
		composition?: string;
	}) => Promise<{
		mount: (
			containerRef: string | HTMLElement,
			props: {
				frame: number;
				config: VideoConfig;
				continueRender: () => void;
				compositionProps?: {
					[key: string]: any;
				};
			}
		) => () => void;
	}>;
};

export const RemoteComposition = ({
	id,
	scope,
	url,
	module,
	Loading,
	className,
	hasDelayedRender,
	loadMicrofrontend,
	composition = "default",
	compositionProps,
}: MicrofrontendProps) => {
	const [handle] = useState(() => delayRender());
	const frame = useCurrentFrame();
	const config = useVideoConfig();
	const containerRef = useRef<HTMLDivElement>(null);
	// const []=useState({})
	useEffect(() => {
		// eslint-disable-next-line camelcase
		window.remotion_imported = false;
	}, []);

	/****/

	const [isMounted, setIsMounted] = useState(false);
	const [error, setError] = useState<false | Error>(false);
	const [data, setData] = useState(null);

	useEffect(() => {
		const fetchMicrofrontend = async () => {
			assert(
				loadMicrofrontend,
				"props.loadMicrofrontend must be a function"
			);
			try {
				const result = await loadMicrofrontend({
					entry: url,
					scope,
					module,
					composition,
				});
				setData(result);
				setError(null);
			} catch (err) {
				setData(null);
				setError(err);
			}
			setIsMounted(true);
		};
		fetchMicrofrontend();
	}, [url, module, scope, composition, loadMicrofrontend]);

	const mount = data?.mount;
	// console.log(data);

	const mfClassName = `microfrontend-container spin-when-empty${
		className ? " " + className : ""
	}`;

	const containerId = `mount-${(id || scope).toLowerCase()}-container`;
	const [mfError, setMFError] = useState<Error | null>(null);

	useEffect(() => {
		if (!isMounted || error || typeof mount !== "function") {
			return;
		}

		let unmount: (() => void) | null = null;
		try {
			//@ts-ignore
			unmount = mount(containerRef.current, {
				frame,
				config,
				continueRender: () => continueRender(handle),
				compositionProps,
			});
			if (!hasDelayedRender) {
				continueRender(handle);
			}
		} catch (error) {
			setMFError(
				new Error(
					`Could not mount Microfrontend: ${scope} (${module})\n${error}`
				)
			);
		}
		return () => {
			try {
				if (typeof unmount === "function") {
					console.log("unmount", scope);
					unmount();
				}
			} catch (err) {
				console.error(err);
				setMFError(
					new Error(
						`Could not mount Microfrontend: ${scope} (${module})\n${error}`
					)
				);
			}
		};
	}, [isMounted, error, url, module, frame, config]);

	return error ? (
		<div>
			{(error instanceof Error
				? error
				: new Error(
						typeof error === "string"
							? error
							: `An error occurred in a microfrontend: ${error}`
				  )
			).toString()}
		</div>
	) : mfError ? (
		<div>{mfError.toString()}</div>
	) : !isMounted ? (
		typeof Loading === "function" ? (
			<Loading />
		) : Loading ? (
			Loading
		) : (
			<div>...loading...</div>
		)
	) : (
		<div
			id={containerId}
			className={mfClassName}
			{...{ "data-mf-scope": scope, "data-mf-module": module }}
			ref={containerRef}
		/>
	);
};

RemoteComposition.defaultProps = {
	loadMicrofrontend,
	Loading: () => (
		<AbsoluteFill
			style={{
				alignItems: "center",
				justifyContent: "center",
				fontSize: "50px",
				flexDirection: "row",
			}}
		>
			<style>
				{`
				.loader-roller-csxjk {
				  border: 2em solid #f3f3f3; /* Light grey */
				  border-top: 2em solid #3498db; /* Blue */
				  border-radius: 100%;
				  width: 10em;
				  height: 10em;
				  animation: spin 2s linear infinite;
				}

				@keyframes spin {
				  0% { transform: rotate(0deg); }
				  100% { transform: rotate(360deg); }
				}`}
			</style>
			<span style={{ fontSize: "2em" }}>Loading Remote Composition</span>
			&nbsp;
			<div
				className="loader-roller-csxjk"
				style={{ fontSize: "20px", fontFamily: "sans-serif" }}
			></div>
		</AbsoluteFill>
	),
};
