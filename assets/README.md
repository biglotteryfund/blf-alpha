## Client-side assets

Contains JavaScript and Sass source files for the app. Everything here is compiled into build files and stored in the `/public` directory.

### Stylesheets

We use [Sass](https://sass-lang.com/) along with [PostCSS](https://postcss.org/) for our stylesheets.

### JavaScript

We use [Babel](https://babeljs.io/) and [webpack](https://webpack.js.org/concepts/) for our JavaScript.  This is a mix of vanilla JavaScript and a small number of [Vue](https://vuejs.org/) components. We use relativelty little JavaScript on the client-side, only where necessary to enhance a baseline experience.

### Builds

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
