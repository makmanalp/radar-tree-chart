### Examples for Radar-tree

To view the examples, run this in a local HTTP server, e.g. `python -m
SimpleHTTPServer`. Alternatively see:

- http://akmanalp.com/radar-tree-chart/radarChart.html
- http://akmanalp.com/radar-tree-chart/radarTree.html

Files:

- radarChart.js: Main radar chart code
- radarChart.html: Radar chart examples
- apidata.json / apidata2.json: Sample API data for radar tree
- radarTree.js: Radar chart embeded tree code.
- radarTree.html: Radar chart embedded tree example.

Specifically with radarTree.html, try popping open the console and running
`d3.json("apidata2.json", fetchAndDraw);` to see it redraw.

