angular.module('app', [])

  .directive('committerApp', function () {
    return {
      restrict: 'E',
      templateUrl: 'app.html',
      controllerAs: 'committerApp',
      controller: CommitterApp
    }
  })

  .directive('bubbleLayout', function () {
    return {
      restrict: 'A',
      link: BubbleLayoutDirective
    }
  });


function CommitterApp($interval, $http) {
  this.$interval = $interval;
  var committerApp = this;
  $http.get('commits.json').then(function (response) {
    committerApp.currentDate = null;
    committerApp.commits = response.data;
    committerApp.reset();
  });
}
CommitterApp.prototype = {
  startByDate: function () {
    this.timer = this.$interval(this.nextDate.bind(this), 20);
  },
  startByCommit: function () {
    this.timer = this.$interval(this.nextCommit.bind(this), 10);
  },
  stop: function () {
    this.$interval.cancel(this.timer);
    this.timer = null;
  },
  reset: function () {
    this.commitIndex = -1;
    this.authorMap = {};
    this.authors = [];
    this.currentDate = null;
  },

  nextDate: function() {
    if (!this.commits || this.commitIndex === this.commits.length) return;

    if (this.currentDate) {
      // If we have a date then add one day to it
      this.currentDate = new Date(this.currentDate.getTime() + 86400000);
    }

    do {
      if (this.commitIndex === this.commits.length) return;
      this.nextCommit();
      var commitDate = new Date(this.commits[this.commitIndex].date);
      if (!this.currentDate) {
        // If we have no date yet then take the first one
        this.currentDate = commitDate;
      }
    } while(commitDate < this.currentDate);
  },

  prevDate: function() {
    if (!this.commits || this.commitIndex == -1) return;

    if (this.currentDate) {
      // If we have a date then take away one day from it
      this.currentDate = new Date(this.currentDate.getTime() - 86400000);
    }

    do {
      if (this.commitIndex == -1) return;
      this.prevCommit();
      var commitDate = new Date(this.commits[this.commitIndex].date);
      if (!this.currentDate) {
        // If we have no date yet then take the first one
        this.currentDate = commitDate;
      }
    } while(commitDate > this.currentDate);
  },

  nextCommit: function () {

    if (!this.commits || this.commitIndex === this.commits.length) return;

    // Get the next commit
    this.commitIndex++;
    var commit = this.commits[this.commitIndex];

    // If this is a new author then add to the map
    if (angular.isUndefined(this.authorMap[commit.author])) {
      this.authorMap[commit.author] = this.authors.length;
    }

    // Record this author's most recent commit
    // console.log('adding commit', commit, this.authorMap[commit.author], this.size(commit.count));
    this.authors[this.authorMap[commit.author]] = commit;

    if (this.commitIndex === this.commits.length - 1) {
      this.stop();
    }
  },

  prevCommit: function () {
    if (this.commitIndex == -1) return;

    var commitToRemove = this.commits[this.commitIndex];
    var authorIndex = this.authorMap[commitToRemove.author];

    if (commitToRemove.count === 1) {
      this.authors.splice(authorIndex, 1);

      if (authorIndex !== this.authors.length) {
        throw new Error();
      }
    }

    // Now update the relevant author for the previous commit
    this.commitIndex--;
    if (this.commitIndex > -1) {
      var previousCommit = this.commits[this.commitIndex];
      this.authors[this.authorMap[previousCommit.author]] = previousCommit;
    }
  },

  size: function (count) {
    return Math.round(Math.log(count) * 12) + 20;
  }
}

function BubbleLayoutDirective(scope, element, attr) {
  var dElement = d3.select(element[0]);
  var maxRadius = 50;
  var padding = 1.5;
  var boundingRect = element[0].getBoundingClientRect();

  var force = d3.layout.force()
    .size([boundingRect.width - maxRadius, boundingRect.height - maxRadius])
    .linkStrength(0.1)
    .friction(0.9)
    .linkDistance(20)
    .charge(-30)
    .gravity(0.1)
    .theta(0.8)
    .alpha(0.1)
    .on('tick', tick)
    .start();
  var images;
  var nodes;

  scope.$watch(attr.bubbleLayout, function () {
    images = dElement.selectAll('img');
    nodes = [];
    images.each(function (node, index) {
      var image = d3.select(this);
      if (!node || !node.x) {
        node = {
          index: index,
          x: Math.random() *  boundingRect.width,
          y: Math.random() * boundingRect.height,
        };
        image
          .datum(node)
          .call(force.drag);
      }

      var radius = image.attr("width") / 2;
      if (radius) {
        node.radius = radius;
      }

      nodes.push(node);
    });
    force.nodes(nodes).start();
  });

  function tick(e) {
    if (images) {
      images
        .each(collide(.5))
        .style("top", function(d) { return (d.y - d.radius) + 'px'; })
        .style("left", function(d) { return (d.x - d.radius) + 'px'; });
    }
  }

  // Resolves collisions between d and all other circles.
  // code based on the following example: http://bl.ocks.org/mbostock/1747543
  function collide(alpha) {
    var quadtree = d3.geom.quadtree(nodes);
    return function (d) {
      var r = d.radius + maxRadius + padding,
        nx1 = d.x - r,
        nx2 = d.x + r,
        ny1 = d.y - r,
        ny2 = d.y + r;
      quadtree.visit(function (quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== d)) {
          var x = d.x - quad.point.x,
            y = d.y - quad.point.y,
            l = Math.sqrt(x * x + y * y),
            r = d.radius + quad.point.radius + padding;
          if (l < r) {
            l = (l - r) / l * alpha;
            d.x -= x *= l;
            d.y -= y *= l;
            quad.point.x += x;
            quad.point.y += y;
          }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      });
    };
  }
}