// /**
//  * Cosntructs a memoized instance of f
//  * @template S
//  * @template T
//  * @param {(...args: S) => T} f 
//  * @param {(...args: S) => string|number} hash 
//  * @returns {(...args: S) => T}
//  */
// function memoize(f, hash) {
//  const memo = {}
//  return (...args) => {
//    const key = hash(...args)
//    if(!(key in memo)) memo[key] = f(...args)
//    return memo[key]
//  }
// }

/**
 * Returns the smallest dimensions {width, height} that fit the content
 * dimensions (width >= contentWidth and height >= contentHeight) while
 * maintaining the aspect ratio of the frame (width/height ==
 * frameWidth/frameHeight)
 * @param {[number, number, number, number]} contentBounds 
 * @param {[number, number]} frameSize
 */
function fit([contentX, contentY, contentWidth, contentHeight], [frameWidth, frameHeight]) {
  const scale = Math.min(contentWidth/frameWidth, contentHeight/frameHeight)

  const width = frameWidth * scale
  const height = frameHeight * scale
  const x = contentX - (width - contentWidth) / 2
  const y = contentY - (height - contentHeight) / 2

  return [x, y, width, height]
}

/**
 * @param {any} node 
 * @returns {number}
 */
function whichChild(node) {
  if(!node.parent) return 0;
  return node.parent.children.indexOf(node)
}

/**
 * @param {any} branch
 * @param {any} target
 * @returns {number}
 */
function whichBranch(branch, target) {
  const lineage = target.ancestors()
  const branchIndex = lineage.indexOf(branch)
  if(branchIndex <= 0) throw new Error("target is not a strict descendant of branch")
  return whichChild(lineage[branchIndex - 1])
}

const colorCycle = ["#66c2a5",
                    "#fc8d62",
                    "#8da0cb",
                    "#e78ac3",
                    "#a6d854",
                    "#ffd92f",
                    "#e5c494",
                    "#b3b3b3"]

class Chart {

  /**
   * 
   * @param {{data: any, width: number, height: number}} props 
   */
  constructor(props) {
    this.props = props
    this.currentFocus = null

    this.root = d3.hierarchy(props.data)
                  .sum(node => node.size)
                  .sort((a, b) => b.size - a.size)


    this.svg = d3.create("svg")
          .attr("viewBox", [0, 0, this.props.width, this.props.height])
          .style("font", "10px sans-serif")
          .attr("text-anchor", "middle");
    

    this.leaves = this.svg
        .append("g")
        .selectAll("circle")
        .data(this.root.leaves())
        .join("circle")

    this.focus(this.root)
  }

  node() {
    return this.svg.node()
  }

  setZoom([x, y, scale]) {
    this.leaves.attr(
      "transform",
      node => `translate(${(node.data.x - x) * scale},${(node.data.y - y) * scale})`
    ).attr("r", 5)
  }

  focus(node) {
    this.currentFocus = node
    const [x, y, width, height] = fit(node.data.bounds, [this.props.width, this.props.height])
    const scale = this.props.width/width
    this.setZoom([x, y, scale])

    this.leaves.attr("fill", node => colorCycle[whichBranch(this.currentFocus, node) % colorCycle.length])
  }
}


(async () => {
  const response = await fetch("output/kmeans.json");
  const data = await response.json();
  $("svg").remove();
  $("body").prepend(new Chart({data, width: 800, height: 800}).node());
})();