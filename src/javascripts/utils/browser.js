export function getQueryParams () {
  const query = window.location.search.substring(1) || '';
  if (query === "") return {};
  const obj = {};
  const queries = query.split('&');
  for (let i = 0; i < queries.length; i++) {
    const pair = queries[i].split('=', 2);
    if (pair.length === 1) {
      obj[pair[0]] = "";
    } else {
      obj[pair[0]] = decodeURIComponent(pair[1].replace(/\+/g, " "));
    }
  }
  return obj;
}
