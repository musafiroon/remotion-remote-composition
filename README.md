# Remotion Remote Composition

With this module, you can share and load remotion compositions from a URL

> This module is based on the remotion-microfrontends repository by mykeels. You can find the original repository here: https://github.com/mykeels/remotion-microfrontends

## Exporting a composition

firstly, on the remote project, you need to change the webpack config to include a module federation plugin pointing to a file that exports composition using the `createMounter()` method

```javascript
// remote/remotion.config.js
import overrideWebpack from "remotion-remote-composition/dist/cjs/overrideWebpack";
Config.overrideWebpackConfig(
	overrideWebpack({
		containerName: "remote",
		// the path of the file(s) to export (relative to root)
		federationExposes: ["./src/Composition.tsx"],
	})
);
```

This will make an endpoint at `remotion preview url/remoteEntry.js'

## Importing a remote composition

In the `Root.tsx` of the host, `import {RemoteComposition} from 'remotion-remote-composition'`  
and add it as a composition with the props

```javascript

// host/remotion.config.js
import overrideWebpack from "remotion-remote-composition/dist/cjs/overrideWebpack";

Config.overrideWebpackConfig(overrideWebpack({ name: "host" }));`
```

```javascript
<Composition
	id="HelloWorld"
	component={RemoteComposition}
	durationInFrames={150}
	fps={30}
	width={1920}
	height={1080}
	defaultProps={{
		url: "http://localhost:3000/remoteEntry.js",
		module: "./src/Composition.tsx",
		scope: "remotevideo",
		/** The name of the exported composition.If the composition is the default export,then simply use "default" */
		composition: "HelloWorld",
		// props to pass to the composition
		compositionProps: {
			titleText: "Welcome to Remotion",
			titleColor: "green",
		},
	}}
/>
```

If you find any issues, etc then feel free to file an issue on [GitHub]()
