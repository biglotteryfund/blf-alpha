# Common views

This directory contains all **common** [Nunjuck](https://mozilla.github.io/nunjucks/) templates. This covers:

-   **Components**: Shared component macros used across the website
-   **Layouts**: Global layout files which all views inherit from
-   **Includes**: A handful of global includes (global header, footer etc.) that are included once across the website.
-   **Filters**: Functions defined in here are available as [custom filters](https://mozilla.github.io/nunjucks/api.html#custom-filters) within all templates.

For all other views files we colocate template files next to the associated router code e.g. `./controllers/home/views/home.njk`.
