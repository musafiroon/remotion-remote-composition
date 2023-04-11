import { createRoot, Root } from "react-dom/client";
import {
	TimelineContextValue,
	VideoConfig,
	CompositionManagerContext,
} from "remotion";
import { Internals } from "remotion";
const {
	CanUseRemotionHooks,
	CompositionManager,
	Timeline: { TimelineContext },
} = Internals;

function RemoteComposition({
	frame,
	config,
	children,
}: {
	frame: number;
	config: VideoConfig;
	children: any;
}) {
	/**
	 * Stubbing these contexts, is important so hooks like `useVideoConfig()` and `useCurrentFrame()` can continue to work.
	 *
	 * In the future, it may be helpful to provide a context provider such as:
	 * @example
	 * <RemoteComposition frame={frame} config={config}>
	 * 	{children}
	 * </RemoteComposition>
	 */
	return (
		<Internals.CanUseRemotionHooks.Provider value>
			<Internals.CompositionManager.Provider
				value={
					{
						compositions: [
							{
								id: "idMustMatch",
							},
						],
						currentComposition: "idMustMatch",
						currentCompositionMetadata: {
							defaultProps: config.defaultProps,
							durationInFrames: config.durationInFrames,
							fps: config.fps,
							height: config.height,
							width: config.width,
						},

						folders: [],
						registerFolder: () => undefined,
						unregisterFolder: () => undefined,
						registerComposition: () => undefined,
						registerSequence: () => undefined,
						sequences: [],
						setCurrentComposition: () => undefined,
						unregisterComposition: () => undefined,
						unregisterSequence: () => undefined,
						registerAsset: () => undefined,
						unregisterAsset: () => undefined,
						setCurrentCompositionMetadata: () => undefined,
						assets: [],
						setClipRegion: () => undefined,
					} as unknown as CompositionManagerContext
				}
			>
				<Internals.Timeline.TimelineContext.Provider
					value={
						{
							frame,
						} as TimelineContextValue
					}
				>
					{" "}
					<Internals.PrefetchProvider>
						<Internals.DurationsContextProvider>
							{children}
						</Internals.DurationsContextProvider>
					</Internals.PrefetchProvider>
				</Internals.Timeline.TimelineContext.Provider>
			</Internals.CompositionManager.Provider>
		</Internals.CanUseRemotionHooks.Provider>
	);
}
export function createMounter(Composition: () => JSX.Element) {
	return (
		ref: string | HTMLElement,
		{
			frame,
			config,
			continueRender,
			compositionProps,
		}: {
			frame: number;
			config: VideoConfig;
			continueRender: () => void;
			compositionProps?: { [key: string]: any };
		}
	) => {
		const container =
			ref instanceof HTMLElement ? ref : document.getElementById(ref);
		if (!container) {
			throw new Error("No container found");
		}
		const root = container.hasAttribute("data-react-root")
			? (container as unknown as { reactRoot: Root }).reactRoot
			: createRoot(container);
		(container as unknown as { reactRoot: Root }).reactRoot = root;
		container.setAttribute("data-react-root", "true");
		root.render(
			<RemoteComposition
				frame={frame}
				config={{ ...config, defaultProps: compositionProps }}
			>
				<Composition {...compositionProps} />
			</RemoteComposition>
		);
		/**
		 * Ideally, continueRender should be called in a useEffect(), that runs after the component is fully loaded
		 */
		continueRender();
	};
}
