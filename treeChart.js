// Adapted from original: https://jsfiddle.net/augburto/YMa2y/

/* Find the root node of a tree-like network of edges */
function findRoot(edges){
  var maxNode = edges[0].source;
  edges.map(function(x){
    if (x.target === maxNode){
      maxNode = x.source;
    }
  });
  return maxNode;
}

function nodesAndEdgesToTree(nodes, edges){

  var nodeMap = {};
  nodes.forEach(function(x) {
    nodeMap[x.id] = x;
  });

  var edgeMap = {};
  edges.forEach(function(x) {
    edgeMap[x.id] = x;
  });

  // Remove self-edges and add them as a property because trees don't support
  // them, so we can draw them later as a hack.

  var selfEdges = [];
  var treeEdges = [];
  edges.forEach(function(x){
    x.nodeInfo = nodeMap[x.target];
    if(x.source === x.target){
      x.nodeInfo.selfEdge = true;
      selfEdges.push(x);
    } else {
      x.nodeInfo.selfEdge = false;
      treeEdges.push(x);
    }
  });

  // Create a nothing -> root edge because stratify won't work without it
  var root = findRoot(treeEdges);
  treeEdges.push({source:"", target: root, nodeInfo: nodeMap[root]});

  // Create tree hierarchy structure
  var nestingFunction = d3.stratify()
    .id(function(x){return x.target;})
    .parentId(function(x){return x.source;});

  return nestingFunction(treeEdges);
}

function RadarTree(nodes, edges, options){
  var cfg = {
    radarChartOptions: {},
    duration: 500,
    rectW: 100,
    rectH: 100,
    width: "100%",
    height: 1000,
    x0: 0,
    y0: 200,
  };

  function chartInner(selection){

    //Put all of the options into a variable called cfg
    if('undefined' !== typeof options){
      for(var i in options){
        if('undefined' !== typeof options[i]){ cfg[i] = options[i]; }
      }
    }

    var root = nodesAndEdgesToTree(nodes, edges);
    chartInner.root = root;

    var tree = d3.layout.tree().nodeSize([cfg.rectW * 1.5, cfg.rectH * 1.5]);
    var diagonal = d3.svg.diagonal()
      .projection(function (d) {
        return [d.x + cfg.rectW / 2, d.y + cfg.rectH / 2];
      });

    var svg = selection
      .attr("width", cfg.width)
      .attr("height", cfg.height)
      .call(zm = d3.behavior.zoom().scaleExtent([1,3]).on("zoom", redraw))
      .append("g")
      .attr("transform", "translate(" + 350 + "," + 20 + ")");

    //necessary so that zoom knows where to zoom and unzoom from
    zm.translate([350, 20]);

    root.x0 = cfg.x0;
    root.y0 = cfg.y0;

    function collapse(d) {
      if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
      }
    }

    chartInner.update = function(source) {

      // Compute the new tree layout.
      var nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);

      // Normalize for fixed-depth.
      nodes.forEach(function (d) {
        d.y = d.depth * 180;
      });

      // Update the nodes…
      var node = svg.selectAll("g.node")
        .data(nodes, function (d) {
          return d.id;
        });

      // Enter any new nodes at the parent's previous position.
      var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function (d) {
          return "translate(" + source.x0 + "," + source.y0 + ")";
        })
        .on("click", click);

      nodeEnter.append("g")
        .each(function(d){
          var radarData = nodes
            .filter(function(x){ return x.id == d.id; })
            .map(function(x){ return x.data.nodeInfo; });

          // if not our fake tree root node.
          if (radarData[0]){
            RadarChart(radarData, cfg.radarChartOptions)(d3.select(this));
            if(radarData[0].selfEdge){
              d3.select(this).append('svg:image')
                .attr({
                  'xlink:href': 'Clockwise_arrow.svg',  // can also add svg file here
                  x: 80,
                  y: 80,
                  width: 28,
                  height: 28
                });
            }
          }
        });

      nodeEnter.append("text")
        .attr("x", cfg.rectW / 2)
        .attr("y", cfg.rectH / 2)
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .text(function (d) {
          return d.id;
        });

      // Transition nodes to their new position.
      var nodeUpdate = node.transition()
        .duration(cfg.duration)
        .attr("transform", function (d) {
          return "translate(" + d.x + "," + d.y + ")";
        });

      nodeUpdate.select("rect")
        .attr("width", cfg.rectW)
        .attr("height", cfg.rectH);

      nodeUpdate.select("text")
        .style("fill-opacity", 1);

      // Transition exiting nodes to the parent's new position.
      var nodeExit = node.exit().transition()
        .duration(cfg.duration)
        .attr("transform", function (d) {
          return "translate(" + source.x + "," + source.y + ")";
        })
        .remove();

      nodeExit.select("rect")
        .attr("width", cfg.rectW)
        .attr("height", cfg.rectH);

      nodeExit.select("text");

      // Update the links…
      var link = svg.selectAll("path.link")
        .data(links, function (d) {
          return d.target.id;
        });

      // Enter any new links at the parent's previous position.
      link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("x", cfg.rectW / 2)
        .attr("y", cfg.rectH / 2)
        .attr("d", function (d) {
          var o = {
            x: source.x0,
            y: source.y0
          };
          return diagonal({
            source: o,
            target: o
          });
        });

      // Transition links to their new position.
      link.transition()
        .duration(cfg.duration)
        .attr("d", diagonal);

      // Transition exiting nodes to the parent's new position.
      link.exit().transition()
        .duration(cfg.duration)
        .attr("d", function (d) {
          var o = {
            x: source.x,
            y: source.y
          };
          return diagonal({
            source: o,
            target: o
          });
        })
        .remove();

      // Stash the old positions for transition.
      nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    };

    // Toggle children on click.
    function click(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
      chartInner.update(d);
    }

    //Redraw for zoom
    function redraw() {
      svg.attr("transform",
        "translate(" + d3.event.translate + ")" +" scale(" + d3.event.scale + ")");
    }

    chartInner.update(root);

  }

  return chartInner;
}
