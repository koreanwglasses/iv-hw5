// Fork of https://observablehq.com/@d3/zoomable-circle-packing
// Citation: Bostock, Mike. “Zoomable Circle Packing.” Observable,
// Observable, 29 Oct. 2019, observablehq.com/@d3/zoomable-circle-packing
//
// Borrowed code labelled with  // Bostock //
// Original code labelled with // Choi //

//////////////////
////  Themes  ////
//////////////////

const originalTheme = {
    colorSchemeIndex: 0,
    colorSchemeType: "s",
    strokeOnly: false
};

const tempBalanceTheme = {
    colorSchemeIndex: 1,
    colorSchemeType: "s",
    strokeOnly: false
};

const greyTheme = {
    colorSchemeIndex: 2,
    colorSchemeType: "s",
    strokeOnly: false
};

const pastelTheme = {
    colorSchemeIndex: 4,
    colorSchemeType: "q",
    strokeOnly: false
};

const googleTheme = {
    colorSchemeIndex: 5,
    colorSchemeType: "q",
    strokeOnly: true
};

const brightTheme = {
    colorSchemeIndex: 6,
    colorSchemeType: "q",
    strokeOnly: false
};

//////////////////////////////////////////
////  Drawing parameters and Globals  ////
//////////////////////////////////////////

// Choi
const minRadius = 10;
const { colorSchemeIndex, colorSchemeType, strokeOnly } = pastelTheme;

////////////////////////////////////
////  Color Scheme Definitions  ////
////////////////////////////////////

/**
 * Choose between different color schemes by index and type (sequential or qualitative)
 */
function colorScheme(index, type) {
    const colorFuncs = [
        // Bostock //
        // 0: Blue-Green color scale
        d3
            .scaleLinear()
            .domain([0, 5])
            .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
            .interpolate(d3.interpolateHcl),

        // Choi //
        // 1: YlGnBu
        i =>
            [
                "#ffffd9",
                "#edf8b1",
                "#c7e9b4",
                "#7fcdbb",
                "#41b6c4",
                "#1d91c0",
                "#225ea8",
                "#253494",
                "#081d58",
                "#b3b3b3"
            ][i % 9],

        // 2: Greyscale
        d3
            .scaleLinear()
            .domain([0, 9])
            .range(["white", "black"])
            .interpolate(d3.interpolateHcl),

        // 3: 8-class qualitative
        i =>
            [
                "#66c2a5",
                "#fc8d62",
                "#8da0cb",
                "#e78ac3",
                "#a6d854",
                "#ffd92f",
                "#e5c494",
                "#b3b3b3"
            ][i % 8],

        // 4: Pastel tones 8-class qualitative
        i =>
            [
                "#fbb4ae",
                "#b3cde3",
                "#ccebc5",
                "#decbe4",
                "#fed9a6",
                "#ffffcc",
                "#e5d8bd",
                "#fddaec"
            ][i % 8],

        // 5: Google color scheme
        i => ["#4285F4", "#DB4437", "#F4B400", "#0F9D58"][i % 4],

        // 6: Pastel tones 4-class qualitative
        i => ['#FFB36A', '#BBF165', '#E05D9D', '#50A8B9'][i % 4]
    ];

    if (index < 0 || index >= colorFuncs.length) {
        throw new Error("color scheme index out of bounds");
    }

    const color = colorFuncs[index];

    let nodeColor;
    if ("sequential".startsWith(type)) {
        // Sequential
        nodeColor = d =>
            d.children ? color(d.depth) : strokeOnly ? "black" : "white";
    } else if ("qualitative".startsWith(type)) {
        // Qualitative
        const nodeColorMemo = {};
        nodeColor = d => {
            if (!d.parent) return "white";
            if (!(d.data.name in nodeColorMemo)) {
                let i = whichChild(d);

                for(let j = 0; j < 3; j++)  {
                  if (whichChild(d) > 0 &&
                    colorEq(color(i), nodeColor(d.parent.children[whichChild(d) - 1]))) 
                    i++; // dont repeat colors twice in a row

                  if(colorEq(color(i), nodeColor(d.parent))) i++; // make sure color is not same as parent
                }

                nodeColorMemo[d.data.name] = color(i);
            }
            return nodeColorMemo[d.data.name];
        };
    } else {
        throw new Error("invalid color scheme type");
    }

    return { color, nodeColor };
}

const { color, nodeColor } = colorScheme(colorSchemeIndex, colorSchemeType);

// adjust text color based on background luminance
const textColor = d => (luminance(nodeColor(d)) > 70 ? "black" : "white");

//////////////////////////////
////  Visualization Code  ////
//////////////////////////////

// Helper functions
const clamp = (x, min, max) => Math.min(Math.max(x, min), max);
const luminance = color => d3.lab(color).l;

const whichChild = (() => {
    const whichChildMemo = {};
    return d =>
        whichChildMemo[d.data.name]
            ? whichChildMemo[d.data.name]
            : (whichChildMemo[d.data.name] = d.parent.children.indexOf(d));
})();

const colorEq = (a, b) => d3.color(a).toString() == d3.color(b).toString();

const width = $(window).width();
const height = $(window).height();

// Choi //
// Show previews on hover
const showPreview = d => {
    if (d.data.preview) {
        $("#preview-img").attr("src", d.data.preview);
        $("#preview-name").text(d.data.name);
        $("#preview").removeAttr("hidden");
        $("#preview").css("background-color", nodeColor(d));
        $("#preview").css("color", textColor(d));
    }
};

const hidePreview = _ => {
    $("#preview").attr("hidden", true);
};

// make preview follow mouse, and flip the preview box if it gets too
// close to the edges
$(document).mousemove(({ originalEvent }) => {
    const { clientX, clientY } = originalEvent;

    const flipUp = clientY + $("#preview").outerHeight() > height;
    const flipLeft = clientX + $("#preview").outerWidth() > width;

    $("#preview").removeClass("flipped-up");
    $("#preview").removeClass("flipped-left");
    $("#preview").removeClass("flipped-up-left");
    if (flipUp && flipLeft) {
        $("#preview").addClass("flipped-up-left");
    } else if (flipUp) {
        $("#preview").addClass("flipped-up");
    } else if (flipLeft) {
        $("#preview").addClass("flipped-left");
    }

    $("#preview").css(
        "top",
        clientY - (flipUp && $("#preview").outerHeight())
    );
    $("#preview").css(
        "left",
        clientX - (flipLeft && $("#preview").outerWidth())
    );
});

// Bostock //
// Create the circle packing layout
const pack = data =>
    d3
        .pack()
        .size([width, height])
        .padding(3)(
            d3
                .hierarchy(data)
                .sum(d => d.size)
                .sort((a, b) => b.size - a.size)
        );

const chart = data => {
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
        .on("mouseover", function (d) {
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
        .on("mouseout", function () {
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
            .filter(function (d) {
                return d.parent === focus || this.style.display === "inline";
            })
            .transition(transition)
            .style("fill-opacity", d => (d.parent === focus ? 1 : 0))
            .on("start", function (d) {
                if (d.parent === focus) this.style.display = "inline";
            })
            .on("end", function (d) {
                if (d.parent !== focus) this.style.display = "none";
            });
    }

    zoomTo([root.x, root.y, focus.r * 2 * Math.max(1, width / height)]);
    return svg.node();
};

// Choi //
// loading data
loadAffinityProp = async () => {
    const response = await fetch("output/affinity-prop.json");
    const data = await response.json();
    $("svg").remove();
    $("body").prepend(chart(data));
};

loadKMeans = async () => {
    const response = await fetch("output/kmeans.json");
    const data = await response.json();
    $("svg").remove();
    $("body").prepend(chart(data));
};

document.onload = loadKMeans();
