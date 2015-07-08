import { stripLeadingSlashes } from './URLUtils';

function pathnameIsActive(pathname, activePathname) {
  if (stripLeadingSlashes(activePathname).indexOf(stripLeadingSlashes(pathname)) === 0)
    return true; // This quick comparison satisfies most use cases.

  // TODO: Implement a more stringent comparison that checks
  // to see if the pathname matches any routes (and params)
  // in the currently active branch.

  return false;
}

function queryIsActive(query, activeQuery) {
  if (activeQuery == null)
    return query == null;

  if (query == null)
    return true;

  for (var p in query)
    if (query.hasOwnProperty(p) && String(query[p]) !== String(activeQuery[p]))
      return false;

  return true;
}

export default function isActive(location, pathname, query) {
  if (location == null)
    return false;

  return pathnameIsActive(pathname, location.pathname) &&
    queryIsActive(query, location.query);
}

