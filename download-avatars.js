var fs = require('fs');
var rp = require('request');
var Q = require('q');
var path = require('path');

var args = process.argv;
while(args[0] == 'node' || args[0] == __filename) args.shift();

if (args.length !== 2) {
  console.log('Usage: node download-avatars.js commits.json imageFolder');
  return;
}

var commitFileName = args[0];
var imageFolder = args[1];

var commitFileContents = fs.readFileSync(commitFileName, 'utf8');
var commits = JSON.parse(commitFileContents);

console.log(commits.length, 'commits loaded');

var userMap = {};
var promise = Q();

commits.forEach(function(commit, index) {
  if (commit.author) {
    var login = commit.author.login;
    if (!userMap[login]) {
      userMap[login] = commit.author;
      console.log('found', login, commit.author.avatar_url);
      promise = promise.then(function() {
        return Q.Promise(function(resolve, reject) {
          console.log('requesting', login, commit.author.avatar_url, path.resolve(imageFolder, login + '.jpg'));
          rp(commit.author.avatar_url)
            .on('response', function() { resolve(true); })
            .pipe(fs.createWriteStream(path.resolve(imageFolder, login + '.jpg')));
        });
      });
    }
  }
});