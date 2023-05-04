import type { WebpackOverrideFn } from "remotion";
import { container } from "webpack";
import fs from "fs";
import path from "path";
const { ModuleFederationPlugin } = container;

export const overrideWebpack: (
	params: overrideWebpackProps
) => WebpackOverrideFn = (params) => {
	var {
		entryFile,
		createPreviewEntry = true,
		containerName: container,
	} = params;

	return (currentConfiguration) => {
		// If is building a composition then set index.ts as the entry and don't load the module federation
		if (currentConfiguration.mode === "production") {
			return {
				...currentConfiguration,
				entry: [
					entryFile || "./src/index.ts",
					...(currentConfiguration.entry as string[]),
				],
				plugins: [
					...(currentConfiguration.plugins || []),
					new ModuleFederationPlugin({
						name: container,

						exposes: params.federationExposes as any,
						filename: params.federationFilename || "remoteEntry.js",
						...params.federationPluginoverride,
						shared: {
							react: {
								import: "react", // the "react" package will be used a provided and fallback module
								shareKey: "react", // under this name the shared module will be placed in the share scope
								shareScope: "default", // share scope with this name will be used
								singleton: true, // only a single version of the shared module is allowed
								requiredVersion: "^18.x.x",
								eager: true,
							},
							"react-dom": {
								singleton: true, // only a single version of the shared module is allowed
								requiredVersion: "^18.x.x",
								eager: true,
							},
							remotion: {
								singleton: true,
								eager: true,
							},
							"remotion-remote-composition": {
								singleton: true,
								requiredVersion: "^0.6.0",
								eager: true,
							},
							...params.federationPluginoverride?.shared,
						},
					}),
				],
			};
		}
		if (
			!fs.existsSync(path.join(process.cwd(), "./src/previewEntry.ts")) &&
			createPreviewEntry
		) {
			fs.writeFileSync(
				path.join(process.cwd(), "./src/previewEntry.ts"),
				`import('@remotion/cli/dist/previewEntry');\nimport('./index');`
			);
		}
		return {
			...currentConfiguration,
			// entry: ['./src/index.ts', ...(currentConfiguration.entry as string[])],
			// set entry as ./src/previewEntry.ts and not load the remotion cli previewEntry. It will break if loaded from here
			entry: ["./src/previewEntry.ts"],
			plugins: [
				...(currentConfiguration.plugins || []),

				new ModuleFederationPlugin({
					name: container,
					exposes: params.federationExposes as any,
					filename: params.federationFilename || "remoteEntry.js",
					...params.federationPluginoverride,

					shared: {
						react: {
							import: "react", // the "react" package will be used a provided and fallback module
							shareKey: "react", // under this name the shared module will be placed in the share scope
							shareScope: "default", // share scope with this name will be used
							singleton: true, // only a single version of the shared module is allowed
							requiredVersion: "^18.x.x",
						},
						"react-dom": {
							singleton: true, // only a single version of the shared module is allowed
							requiredVersion: "^18.x.x",
						},
						remotion: {
							import: "remotion",
							shareKey: "remotion",
							shareScope: "default",
							singleton: true,
							requiredVersion: "^3.3.82",
						},
						"remotion-remote-composition": {
							singleton: true,
							requiredVersion: "^0.6.0",
						},
						...params.federationPluginoverride?.shared,
					},
				}),
			],
		};
	};
};
type overrideWebpackProps = {
	/**
	 * The name of the container
	 * eg : "host"
	 */
	containerName: string;
	/**
	 * the entry file of the composition
	 * eg : "./src/index.ts"
	 * if not provided then the default entry file will be used which is ./src/index.ts
	 * if you want to use a different entry file then set it in the overrideWebpack function
	 * eg : overrideWebpack({entry: "./src/composition.ts"}
	 */
	entryFile?: string;
	/**
	 * Whether to create a previewEntry.ts file in the root directory
	 * default : true
	 */
	createPreviewEntry?: boolean;
	/**
	 * an object of webpack module federation plugin override
	 * eg : { shared: { react: { singleton: true } } }
	 */
	federationPluginoverride?: Record<string, any>;
	/**
	 * an array of exposed modules
	 * eg : ["./src/components/Button"]
	 */
	federationExposes?: string[] | string;
	/**
	 * the filename of the federation module
	 * default : "remoteEntry.js"
	 */
	federationFilename?: string;
};

export default overrideWebpack;
