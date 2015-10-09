angular.module('app', [])

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
    this.commitIndex = 0;
    this.authorMap = {};
    this.authors = [];
  },

  next: function() {
    // Get the next commit
    var commit = this.commits[this.commitIndex];

    // If this is a new author then add to the map
    if (!this.authorMap[commit.author]) {
      this.authorMap[commit.author] = this.authors.length;
    }
    console.log('adding commit', commit, this.authorMap[commit.author]);
    // Record this authors most recent commit
    this.authors[this.authorMap[commit.author]] = commit;

    this.commitIndex++;
    if (this.commitIndex === this.commits.length) {
      this.stop();
    }
  },

  size: function(count) {
    return Math.round(Math.log(count)) * 20;
  }
}