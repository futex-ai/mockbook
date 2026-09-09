// Server-side full-document rendering for the served Mokabook shell. Full
// pages keep one persistent frame — top bar, catalogue navigation, and status
// region — around the route-owned main view that progressive navigation
// replaces.

import { renderToStaticMarkup } from "react-dom/server";

import type { Catalogue } from "../catalogue.js";
import type { ShellContext } from "./context.js";
import { SchemeSwitch } from "./head.js";
import { BrandIcon, SearchIcon } from "./icons.js";
import { CatalogueNav } from "./nav.js";
import { SearchTagPicker } from "./tags.js";
import { ShellMain, viewTitle } from "./views.js";
import type { ShellView } from "./views.js";

/** The shared 48px catalogue header keeps search available at every width. */
function TopBar(props: { catalogue: Catalogue }) {
  return (
    <header className="mbk-topbar" data-search="">
      <button
        aria-controls="mb-nav"
        aria-expanded="false"
        aria-label="Open catalogue navigation"
        className="mbk-menu"
        data-mokabook-menu=""
        type="button"
      >
        <span aria-hidden="true">☰</span>
      </button>
      <a aria-label="Mokabook" className="mbk-brand" href="/">
        <span aria-hidden="true" className="mbk-mark">
          <BrandIcon />
        </span>
        <span className="mbk-name">Mokabook</span>
      </a>
      <div className="mbk-search">
        <SearchIcon />
        <input
          aria-label="Search screens"
          data-mokabook-search=""
          placeholder="Search screens…"
          type="search"
        />
        <SearchTagPicker tags={props.catalogue.tags} />
      </div>
      {props.catalogue.hasDarkFragments ? <SchemeSwitch /> : null}
    </header>
  );
}

/** Render one full Mokabook shell page to an HTML document string. */
export function renderShellPage(
  catalogue: Catalogue,
  view: ShellView,
  context: ShellContext,
): string {
  const markup = renderToStaticMarkup(
    <html
      data-mokabook-base={context.base}
      data-mokabook-static={context.delivery ? "" : undefined}
      data-mokabook-delivery={
        context.delivery ? JSON.stringify(context.delivery) : undefined
      }
      data-mokabook-update-version={context.updateVersion}
      lang="en"
    >
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <title>{viewTitle(catalogue, view)}</title>
        <link href="/__mokabook/shell.css" rel="stylesheet" />
      </head>
      <body className="mbk-fs">
        <div className="mbk" data-drawer="closed" data-mokabook-shell="">
          <a className="mbk-skip-link" href="#mb-main">
            Skip to content
          </a>
          <TopBar catalogue={catalogue} />
          <div className="mbk-body">
            <CatalogueNav catalogue={catalogue} context={context} />
            <ShellMain catalogue={catalogue} context={context} view={view} />
          </div>
          <p
            aria-atomic="true"
            aria-live="polite"
            className="mbk-route-status"
            id="mb-status"
            role="status"
          />
        </div>
        <script src="/__mokabook/client/navigation-resize.js" />
        <script src="/__mokabook/client/browse.js" type="module" />
        {!context.delivery ? (
          <script src="/__mokabook/client/browser.js" type="module" />
        ) : null}
      </body>
    </html>,
  );
  return `<!doctype html>\n${markup}\n`;
}
