var Utils = {};

Utils.getQueryParams = function () {
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

Utils.Math = {
  degreesToRadians: function (degrees) {
    return degrees * (Math.PI / 180.0);
  },
  radiansToDegrees: function (radians) {
    return radians * (180.0 / Math.PI);
  }
}

module.exports = Utils;