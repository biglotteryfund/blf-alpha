## Client-side builds

We use [Sass](https://sass-lang.com/) for stylesheets and a small amount of [Vue](https://vuejs.org/) for JavaScript enhancements. We use comparatively little JavaScript on the client-side, only where necessary to enhance a baseline experience.

You can run a one-off build with:

```shell script
npm run build
```

Watch static assets and run an incremental build when files change with:

```shell script
npm run watch
```

If you want to run a browser-sync server locally to live reload on changes you can run the following command:

```
npx browser-sync start --no-open --proxy 'http://localhost:3000' --files 'public'
```
