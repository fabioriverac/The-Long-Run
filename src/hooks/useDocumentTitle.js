import { useEffect } from "react";

const SITE_NAME = "The Long Run";

/**
 * Sets `document.title` for the current page, formatted as
 * "<title> · The Long Run". Without a per-route title, every page shares
 * the static <title> from index.html — fine for the initial load, but the
 * browser tab, history entry, and bookmark all stay stuck on that one
 * title as a visitor moves between routes.
 *
 * Pass no title (or an empty one) for the home page, where a bare site
 * name reads better than a redundant "Home · The Long Run".
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  }, [title]);
}
