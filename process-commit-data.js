var fs = require('fs');
var rp = require('request');
var Q = require('q');
var path = require('path');

var args = process.argv;
while(args[0] == 'node' || args[0] == __filename) args.shift();

if (args.length !== 2) {
  console.log('Usage: node process-commit-data.js inputFile.json outputFile.json');
  return;
}

var commitFileName = args[0];
var outputFile = args[2];

var commitFileContents = fs.readFileSync(commitFileName, 'utf8');
var commits = JSON.parse(commitFileContents);
var loginCount = {};

console.log(commits.length, 'commits loaded');

commits = commits

  .reverse()

  .filter(function(commit) {
    return commit.author;
  })

  .map(function(commit) {
    var login = commit.author.login;
    loginCount[login] = loginCount[login] || 0;
    loginCount[login]++;
    return {
      date: commit.commit.committer.date.split('T')[0],
      author: commit.author.login,
      count: loginCount[login]
    };
  });

fs.writeFileSync(path.resolve(outputFile), JSON.stringify(commits, null, 2));