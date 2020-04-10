/** @import d3 */

/**
 * Cosntructs a memoized instance of f
 * @template S
 * @template T
 * @param {(...args: S) => T} f
 * @param {(...args: S) => string|number} hash
 * @returns {(...args: S) => T}
 */
function memoize(f, hash) {
  const memo = {};
  return (...args) => {
    const key = hash(...args);
    if (!(key in memo)) memo[key] = f(...args);
    return memo[key];
  };
}

/**
 * Represents a rectangle as x, y, width, height
 * @typedef {[number, number, number, number]} Rectangle
 */

/**
 * Returns the smallest dimensions {width, height} that fit the content
 * dimensions (width >= contentWidth and height >= contentHeight) while
 * maintaining the aspect ratio of the frame (width/height ==
 * frameWidth/frameHeight)
 * @param {[number, number, number, number]} contentBounds
 * @param {[number, number]} frameSize
 */
function fit(
  [contentX, contentY, contentWidth, contentHeight],
  [frameWidth, frameHeight]
) {
  const scale = Math.max(
    contentWidth / frameWidth,
    contentHeight / frameHeight
  );

  const width = frameWidth * scale;
  const height = frameHeight * scale;
  const x = contentX - (width - contentWidth) / 2;
  const y = contentY - (height - contentHeight) / 2;

  return [x, y, width, height];
}

/**
 * Scales a rectangle out from its center
 * @param {Rectangle} rectangle
 * @param {number} scale
 */
function scaleRectangle([x, y, width, height], scale) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const newWidth = width * scale;
  const newHeight = height * scale;
  return [centerX - newWidth / 2, centerY - newHeight / 2, newWidth, newHeight];
}

/**
 * @param {d3.HierarchyNode<any>} node
 * @returns {number}
 */
function whichChild(node) {
  if (!node.parent) return 0;
  return node.parent.children.indexOf(node);
}

/**
 * @param {d3.HierarchyNode<any>} branch
 * @param {d3.HierarchyNode<any>} target
 * @returns {number}
 */
function whichBranch(branch, target) {
  const lineage = target.ancestors();
  const branchIndex = lineage.indexOf(branch);
  if (branchIndex <= 0) return -1;
  return whichChild(lineage[branchIndex - 1]);
}

/**
 * @param {[number, number][]} points
 */
function centroid(points) {
  const [sumX, sumY] = points.reduce(
    ([x, y], [accX, accY]) => [x + accX, y + accY],
    [0, 0]
  );
  return [sumX / points.length, sumY / points.length];
}

/**
 * @param {[number, number][]} points
 */
function stdDist(points) {
  const [cX, cY] = centroid(points);
  const dists2 = points.map(
    ([x, y]) => Math.pow(cX - x, 2) + Math.pow(cY - y, 2)
  );
  const meanDist2 = dists2.reduce((a, b) => a + b, 0) / dists2.length;

  const dists = dists2.map(Math.sqrt);
  const meanDist = dists.reduce((a, b) => a + b, 0) / dists.length;

  return Math.sqrt(meanDist2 - Math.pow(meanDist, 2));
}

function clusterCenter(node) {
  const points = node.leaves().map((leaf) => [leaf.data.x, leaf.data.y]);
  return centroid(points);
}

function clusterRadius(node) {
  const points = node.leaves().map((leaf) => [leaf.data.x, leaf.data.y]);
  return stdDist(points);
}

const colorCycle = [
  "#66c2a5",
  "#fc8d62",
  "#8da0cb",
  "#e78ac3",
  "#a6d854",
  "#ffd92f",
  "#e5c494",
];

function colorIndex(node) {
  let i = whichChild(node);
  i += node.parent && colorIndex(node.parent) == i;
  return i;
}

/**
 * @typedef ClusterData
 * @property {string} name
 * @property {string} preview
 * @property {number} size
 * @property {Rectangle} [bounds]
 * @property {number} [x]
 * @property {number} [y]
 * @property {ClusterData[]} [children]
 */

/**
 * @typedef {d3.HierarchyNode<ClusterData>} Node
 */

/**
 * @typedef ChartProps
 * @property {ClusterData} data
 * @property {number} width
 * @property {number} height
 * @property {number} [clusterOpacity]
 * @property {number} [clusterScale]
 */

class Chart {
  /**
   *
   * @param {ChartProps} props
   */
  constructor(props) {
    this.props = { clusterOpacity: 0.5, clusterScale: 1.5, ...props };
    this.currentFocus = null;

    this.clusterCenter = memoize(clusterCenter, (node) => node.value);
    this.clusterRadius = memoize(clusterRadius, (node) => node.value);
    this.colorIndex = memoize(colorIndex, (node) => node.value);
    this.handleNodeClick = this.handleNodeClick.bind(this);
    this.leafColor = this.leafColor.bind(this);

    this.root = d3
      .hierarchy(props.data)
      .sum((node) => node.size)
      .sort((a, b) => b.size - a.size);

    this.svg = d3
      .create("svg")
      .attr("viewBox", [0, 0, this.props.width, this.props.height])
      .style("font", "10px sans-serif")
      .attr("text-anchor", "middle")
      .style("cursor", "pointer")
      .on("click", () => this.focus(this.root));

    this.clusters = this.svg
      .append("g")
      .selectAll("circle")
      .data(this.root.descendants().filter((node) => node.children))
      .join("circle")
      .attr("fill-opacity", 0)
      .attr(
        "fill",
        (node) => colorCycle[this.colorIndex(node) % colorCycle.length]
      )
      .on("click", this.handleNodeClick);

    this.leaves = this.svg
      .append("g")
      .selectAll("circle")
      .data(this.root.leaves())
      .join("circle")
      .on("click", this.handleNodeClick);

    this.focus(this.root);
  }

  /**
   * @param {Node} d
   */
  handleNodeClick(d) {
    const branchIndex = whichBranch(this.currentFocus, d);
    if (branchIndex == -1 && this.currentFocus.parent) {
      this.focus(this.currentFocus.parent);
      return;
    }
    this.focus(this.currentFocus.children[branchIndex]);
    d3.event.stopPropagation();
  }

  node() {
    return this.svg.node();
  }

  /**
   * @param {Node} node
   */
  clusterColor(node) {
    return colorCycle[this.colorIndex(node) % colorCycle.length];
  }

  leafColor(node) {
    const bi = whichBranch(this.currentFocus, node);
    return bi != -1
      ? this.clusterColor(this.currentFocus.children[bi])
      : "#808080";
  }

  setZoom([x, y, scale]) {
    this.leaves
      .attr(
        "transform",
        (node) =>
          `translate(${(node.data.x - x) * scale},${(node.data.y - y) * scale})`
      )
      .attr("r", 5);

    this.clusters
      .attr("transform", (node) => {
        const [cx, cy] = this.clusterCenter(node);
        return `translate(${(cx - x) * scale},${(cy - y) * scale})`;
      })
      .attr(
        "r",
        (node) => this.props.clusterScale * this.clusterRadius(node) * scale
      );
  }

  focus(node) {
    this.currentFocus = node;
    const [x, y, width, height] = fit(scaleRectangle(node.data.bounds, 1.1), [
      this.props.width,
      this.props.height,
    ]);
    const scale = this.props.width / width;
    this.setZoom([x, y, scale]);

    this.leaves
      .attr("fill", this.leafColor)
      .attr("fill-opacity", (node) =>
        whichBranch(this.currentFocus, node) == -1 ? 0.2 : 1
      );

    this.clusters.attr(
      "fill-opacity",
      (node) =>
        this.props.clusterOpacity *
        (this.currentFocus.children.indexOf(node) != -1)
    );
    this.clusters.attr("visibility", (node) =>
      this.currentFocus.children.indexOf(node) == -1 ? "hidden" : "visible"
    );
  }
}

(async () => {
  const response = await fetch("output/kmeans.json");
  const data = await response.json();
  $("svg").remove();
  $("body").prepend(
    new Chart({
      data,
      width: window.innerWidth,
      height: window.innerHeight,
    }).node()
  );
})();
