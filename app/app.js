angular.module('app', ['ngAnimate'])

.directive('committerApp', function() {
  return {
    restrict: 'E',
    templateUrl: 'app.html',
    controllerAs: 'committerApp',
    controller: CommitterApp
  }
});


function CommitterApp($interval, $http) {
  this.$interval = $interval;
  var committerApp = this;
  $http.get('commits.json').then(function(response) {
    committerApp.commits = response.data;
    committerApp.reset();
  });
}
CommitterApp.prototype = {
  start: function() {
    this.timer = this.$interval(this.next.bind(this), 10);
  },
  stop: function() {
    this.$interval.cancel(this.timer);
    this.timer = null;
  },
  reset: function() {
    this.commitIndex = -1;
    this.authorMap = {};
    this.authors = [];
  },

  next: function() {

    if (!this.commits || this.commitIndex === this.commits.length) return;

    // Get the next commit
    this.commitIndex++;
    var commit = this.commits[this.commitIndex];

    // If this is a new author then add to the map
    if (angular.isUndefined(this.authorMap[commit.author])) {
      this.authorMap[commit.author] = this.authors.length;
    }

    // Record this author's most recent commit
    console.log('adding commit', commit, this.authorMap[commit.author], this.size(commit.count));
    this.authors[this.authorMap[commit.author]] = commit;

    if (this.commitIndex === this.commits.length-1) {
      this.stop();
    }
  },

  prev: function() {
    if (this.commitIndex == -1) return;

    var commitToRemove = this.commits[this.commitIndex];
    var authorIndex = this.authorMap[commitToRemove.author];

    if (commitToRemove.count === 1) {
      this.authors.splice(authorIndex, 1);

      if (authorIndex !== this.authors.length) { throw new Error(); }
    }

    // Now update the relevant author for the previous commit
    this.commitIndex--;
    if (this.commitIndex > -1) {
      var previousCommit = this.commits[this.commitIndex];
      this.authors[this.authorMap[previousCommit.author]] = previousCommit;
    }
  },

  size: function(count) {
    return Math.round(Math.log(count)*10) + 10;
  }
}