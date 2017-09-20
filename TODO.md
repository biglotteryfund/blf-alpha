# App todo

These are chores, refactoring tasks or simply reminders of code that needs to be written.

## To fix
- [ ] homepage: google tag manager / experiment for homepage – verify working
- [ ] homepage: data/application base64 JS is violating CSP (google cx api)
- [ ] og:url / getCurrentUrl() for contact page returning http://172.31.25.75/status on prod?
- [ ] race condition means language switcher can point to wrong URL if multiple pages requested at once
- [ ] CSRF: how to approach when pages are cached?

## Tech debt
- [ ] could change desktop breakpoint to be > 1024 for ipad landscape (20% margins too big)
- [ ] form errors on order form return users to unselected tab
- [ ] specify a db pool size
- [ ] use production version of vue in non-dev envs (webpack branch fixes this)
- [ ] find solution to hardcoded links in locale/lang files (is this a CMS job?)
- [ ] remove vary header
- [ ] and add ARIA roles to SVGs and mobile nav
- [ ] resize carousel height on item change
- [ ] make commit hooks only run if JS code changes
- [ ] pre-commit hook shouldn't break the dev server
- [ ] log material orders (need legal signoff)

## Tests to write
 - [ ] news UD works (CR done)
 - [ ] GA is loaded
 - [ ] are form fields working as expected?
 