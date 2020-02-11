const Photospheres = (() => {
  /**
   * Load clustering data
   * TODO: Add validation 
   * @param {string} path 
   */
  const loadClusterData = async path => {
      const response = await fetch(path);
      const data = await response.json();
      return data;
  }

  const render = data => {
    const root = pack(data);
    let focus = root;
    let view;

    const svg = d3
      .create("svg")
      .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
      .style("display", "block")
      .style("margin", "0 -14px")
      .style("background", strokeOnly ? "white" : nodeColor(root))
      .style("cursor", "pointer")
      .on("click", () => zoom(root));

    // Heavily modified rendering options
    // to fit different styles (including filled vs stroke only)
    const node = svg
      .append("g")
      .selectAll("circle")
      .data(root.descendants().slice(1))
      .join("circle")
      .attr("fill", strokeOnly ? "white" : d => nodeColor(d))
      .attr("stroke", strokeOnly ? d => nodeColor(d) : null)
      .on("mouseover", function(d) {
        if (strokeOnly) {
          // darken outline on hover
          d3.select(this).attr("stroke", d =>
            d3.color(nodeColor(d)).darker()
          );
        } else {
          d3.select(this).attr("stroke", "#000");
        }
        showPreview(d);
      })
      .on("mouseout", function() {
        if (strokeOnly) {
          d3.select(this).attr("stroke", d => nodeColor(d));
        } else {
          d3.select(this).attr("stroke", null);
        }
        hidePreview();
      })
      .on(
        "click",
        d =>
          focus !== d && (d.children && zoom(d), d3.event.stopPropagation())
      );

    const label = svg
      .append("g")
      .style("font", "10px sans-serif")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .selectAll("text")
      .data(root.descendants())
      .join("text")
      .style("fill", strokeOnly ? "black" : d => textColor(d))
      .style("fill-opacity", d => (d.parent === root ? 1 : 0))
      .style("display", d => (d.parent === root ? "inline" : "none"))
      .text(d => d.data.name);

    // Modified heavily for performance optimization and
    // rendering different styles
    let prevVisibleNodes = node; // used for performance optimization
    function zoomTo(v) {
      const k = width / v[2];

      view = v;

      label.attr(
        "transform",
        d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
      );

      const isVisible = d =>
        (d.x - v[0] + d.r) * k > -width / 2 &&
        (d.x - v[0] - d.r) * k < width / 2 &&
        (d.y - v[1] + d.r) * k > -height / 2 &&
        (d.y - v[1] - d.r) * k < height / 2 &&
        d.r * k >= minRadius / 2;

      const visibleNodes = node.filter(isVisible);
      visibleNodes.attr(
        "transform",
        d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
      );
      visibleNodes.attr("r", d => d.r * k);

      prevVisibleNodes.attr("visibility", d => "hidden");
      visibleNodes.attr("visibility", d => "visible");

      prevVisibleNodes = visibleNodes;

      if (strokeOnly) {
        visibleNodes.attr(
          "stroke-width",
          d =>
            Math.max((d.r * k) / 50, 1) *
            clamp((2 * d.r * k) / minRadius - 1, 0, 1)
        );
      } else {
        visibleNodes.attr("fill-opacity", d =>
          clamp((2 * d.r * k) / minRadius - 1, 0, 1)
        );
      }
    }

    // Bostock //
    // Minor zoom modifications : Choi //
    function zoom(d) {
      const focus0 = focus;

      focus = d;

      const k = focus.r * 2 * Math.max(1, width / height);

      const transition = svg
        .transition()
        .duration(d3.event.altKey ? 7500 : 750)
        .tween("zoom", d => {
          const i = d3.interpolateZoom(view, [focus.x, focus.y, k]);
          return t => zoomTo(i(t));
        });

      label
        .filter(function(d) {
          return d.parent === focus || this.style.display === "inline";
        })
        .transition(transition)
        .style("fill-opacity", d => (d.parent === focus ? 1 : 0))
        .on("start", function(d) {
          if (d.parent === focus) this.style.display = "inline";
        })
        .on("end", function(d) {
          if (d.parent !== focus) this.style.display = "none";
        });
    }

    zoomTo([root.x, root.y, focus.r * 2 * Math.max(1, width / height)]);
    return svg.node();
  };
})();

export default Photospheres;