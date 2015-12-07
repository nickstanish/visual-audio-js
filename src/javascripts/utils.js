function Utils () {
  
}

Utils.prototype.getQueryParams = function () {
  var query = window.location.search.substring(1) || '';
  if (query === "") return {};
  var obj = {};
  var queries = query.split('&');
  for (var i = 0; i < queries.length; i++) {
    var pair = queries[i].split('=', 2);
    if (pair.length == 1) {
      obj[pair[0]] = "";
    } else {
      obj[pair[0]] = decodeURIComponent(pair[1].replace(/\+/g, " "));
    }
  }
  return obj;
};


module.exports = Utils;