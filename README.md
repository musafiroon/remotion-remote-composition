# Remotion Remote Composition

With this module, you can share and load remotion compositions from a URL

> This module is based on the remotion-microfrontends repository by mykeels. You can find the original repository here: https://github.com/mykeels/remotion-microfrontends

## Exporting a composition

firstly, on the remote project, you need to change the webpack config to include a module federation plugin pointing to a file that exports composition using the `createMounter()` method

```
// remotion.config.js
const webpackOverride = (currentConfiguration) => {
	return {
		...currentConfiguration,
		entry: ['./src/index.ts'],
		plugins: [
			...(currentConfiguration.plugins || []),
			new ModuleFederationPlugin({
				name: 'remotevideo',
				filename: 'remoteEntry.js',
				exposes: ['./src/bootstrap'],
				shared: {
					react: {
						import: 'react',
						shareKey: 'react',
						shareScope: 'default',
						singleton: true,
						requiredVersion: '^18.0.0',
					},
					'react-dom': {
						singleton: true,
						requiredVersion: '^18.0.0',
					},
					remotion: {
						import: 'remotion',
						shareKey: 'remotion',
						shareScope: 'default',
						singleton: true,
					},
				},
			}),
		],
	};
};
Config.overrideWebpackConfig(webpackOverride);
```

```
// src/bootstrap.tsx

import {HelloWorld} from './HelloWorld';
import {Logo} from './HelloWorld/Logo';

import {createMounter} from 'remotion-remote-composition';


export const HelloWorldMounter = createMounter(HelloWorld as any);
export const LogoMounter = createMounter(Logo as () => JSX.Element);
```

This will make an endpoint at `remotion preview url/remoteEntry.js'

## Importing a remote composition

In the `Root.tsx` of the host, `import {RemoteComposition} from 'remotion-remote-composition'`  
and add it as a composition with the props

```
    <Composition
    	id="HelloWorld"
    	component={RemoteComposition}
    	durationInFrames={150}
    	fps={30}
    	width={1920}
    	height={1080}
    	defaultProps={{
    		url: 'http://localhost:3000/remoteEntry.js',
    		module: './src/bootstrap',
    		scope: 'remotevideo',
    		composition: 'HelloWorldMounter',
    		compositionProps: {
    			titleText: 'Welcome to Remotion',
    			titleColor: 'green',
    		},
    	}}
    />

```
