/**
 * Returns the smallest dimensions {width, height} that fit the content
 * dimensions (width >= contentWidth and height >= contentHeight) while
 * maintaining the aspect ratio of the frame (width/height ==
 * frameWidth/frameHeight)
 * @param {{x: number, y: number, width: number, height: number}} contentBounds 
 * @param {{width: number, height: number}} frameSize
 */
function fit(contentBounds, frameSize) {
  const scale = Math.min(contentBounds.width/frameSize.width, contentBounds.height/frameBounds.height)

  const width = frameSize.width * scale
  const height = frameSize.height * scale
  const x = contentBounds.x - (width - contentBounds.width) / 2
  const y = contentBounds.y - (height - contentBounds.height) / 2

  return [x, y, width, height]
}

function chart(data) {
  const svg = d3.create("svg")
        .attr("viewBox", [-100, -100, 200, 200])
        .style("font", "10px sans-serif")
        .attr("text-anchor", "middle");
}


chart({})