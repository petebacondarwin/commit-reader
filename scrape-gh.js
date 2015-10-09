var fs = require('fs');
var rp = require('request-promise');

var commits = [];
var links = {};

var args = process.argv;
while(args[0] == 'node' || args[0] == __filename) args.shift();

if (args.length !== 4) {
  console.log('Usage: node scrape-gh.js owner repo user password');
  return;
}

var owner = args[0];
var repo = args[1];
var user = args[2];
var password = args[3];

var promise = makeRequest('https://api.github.com/repos/' + owner + '/' + repo + '/commits?per_page=100');

promise.then(function() {
  console.log(commits);
  fs.writeFileSync('commits.json', JSON.stringify(commits, null, 2));
}).done();

function makeRequest(url) {
  console.log('request', url);

  return rp({
    url: url,
    headers: {'User-Agent': 'request'},
    auth: { user: user, pass: password },
    resolveWithFullResponse: true
  }).then(function(response) {

    // Store these commits
    commits = commits.concat(JSON.parse(response.body));
    console.log('commit count', commits.length);

    // If there is another page then get it
    var links = parseLinks(response);
    if (links.next) {
      return makeRequest(links.next);
    }

  }, function(error) {
    console.log('There was an error', error);
  });
}

function parseLinks(response) {
  var linkLines = response.headers.link.split(',');
  var links = {};
  linkLines.forEach(function(linkLine) {
    var match = /<(.+)>; rel="(.+)"/.exec(linkLine);
    if (match) {
      links[match[2]] = match[1];
    }
  });
  return links;
}