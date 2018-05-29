define([
  '../util/utils',
  '../../vendor/d3.min',
], (utils, d3) => {
  return {
    /**
     * draw - draw chart
     *
     * @param {Object} $scope        angular $scope
     * @param {Object} treeData          Data for chart
     * @param {String} elementId     HTML element id to embed chart
     * @param {Object} customOptions Custom chart options
     *
     * @return {Object} Chart object
     */
    draw($scope, app, chartData, elementId, customOptions) {
      // Define width and hight of this extension
      let extWidth = 0;
      let extHeight = 0;

      if ($scope.layout.props.defineScreenSize) {
        // Screen size = Auto
        extWidth = $scope.self.$element.width();
        extHeight = $scope.self.$element.height() - 10;
      } else {
        // Screen size = Custom
        extWidth = $scope.layout.props.screenWidth;
        extHeight = $scope.layout.props.screenHeight;
      }

      // Set the dimensions and margins of the diagram
      const margin = { top: 20, right: 90, bottom: 30, left: 90 };
      const width = extWidth - margin.left - margin.right;
      const height = extHeight - margin.top - margin.bottom;

      // append the svg object to the extension HTML element
      const svg = d3.select(`div#${elementId}`).append('svg')
          .attr('width', width + margin.right + margin.left)
          .attr('height', height + margin.top + margin.bottom)
          .append('g')
          .attr('transform', `translate(${margin.left}, ${margin.top})`);

      let i = 0;
      const duration = 750;

      // declares a tree layout and assigns the size
      const treemap = d3.tree().size([height, width]);

      // Assigns parent, children, height, depth
      const root = d3.hierarchy(chartData, (d) => { return d.children; });
      root.x0 = height / 2;
      root.y0 = 0;

      // Palette color
      const palette = utils.getDefaultPaletteColor();

      // Make RGB color lighter or barker
      function makeColorsLighterDarker(c,n,i,d) {for(i=3;i--;c[i]=d<0?0:d>255?255:d|0)d=c[i]+n;return c.join(','); }
      const colorDefault = makeColorsLighterDarker(palette[3].split(',').map(Number), 100);

      // Color selection
      const color = ($scope.layout.props.colors) ? `rgba(${palette[3]},1)` : `rgba(${utils.getConversionRgba($scope.layout.props.colorForMain.color, 1)})`;
      const colorOpaque = ($scope.layout.props.colors) ? `rgba(${colorDefault},1)` : `rgba(${utils.getConversionRgba($scope.layout.props.colorForMain.color, 1)})`;

      // Creates a curved (diagonal) path from parent to the child nodes
      function diagonal(s, d) {
        const path = `M ${s.y} ${s.x}
                C ${(s.y + d.y) / 2} ${s.x},
                  ${(s.y + d.y) / 2} ${d.x},
                  ${d.y} ${d.x}`;
        return path;
      }

      // Replace param names (q$meaX) to a measure label in description
      function replaceParamNamesWithLabel(description) {
        let result = description;
        for (let i = 0; i < $scope.paramNames.length; i++) {
          result = result.replace($scope.paramNames[i], $scope.measureLabels[i]);
        }
        return result;
      }

      function update(source) {
        // Assigns the x and y position for the nodes
        const treeData = treemap(root);

        // Compute the new tree layout.
        const nodes = treeData.descendants();
        const links = treeData.descendants().slice(1);

        // Normalize for fixed-depth.
        nodes.forEach((d) => { d.y = d.depth * 180; });

        // Update the nodes
        const node = svg.selectAll('g.node')
            .data(nodes, (d) => { return d.id || (d.id = ++i); });

        // Enter any new modes at the parent's previous position.
        const nodeEnter = node.enter().append('g')
            .attr('class', 'node')
            .attr('transform', () => {
              return `translate(${source.y0}, ${source.x0})`;
            })
        .on('click', click);

        // Add Circle for the nodes
        nodeEnter.append('circle')
            .attr('class', 'node')
            .attr('r', 1e-6)
            .attr('stroke', () => {
              return color;
            })
            .style('fill', (d) => {
              return d._children ? color : '#fff';
            });

        // Add labels for the nodes
        nodeEnter.append('text')
          .attr('dy', '.35em')
          .attr('x', () => {
            return (-1 * $scope.layout.props.bubbleSize) - 5;
          })
          .attr('text-anchor', () => {
            return 'end';
          })
          .text((d) => {
            return replaceParamNamesWithLabel(d.data.description);
          });

        // Add result for the end node
        nodeEnter.append('text')
          .attr('dy', '.35em')
          .attr('x', () => {
            return $scope.layout.props.bubbleSize + 5;
          })
          .attr('text-anchor', () => {
            return 'start';
          })
          // .style('font-size', '20px')
          .style('font-weight', 'bold')
          .style('fill', color)
          .text((d) => {
            let result = '';
            if (d.children || d._children) {
              // Display result on all nodes when displayResultsOnAllNodes = true
              if ($scope.layout.props.displayResultsOnAllNodes) {
                result = `${$scope.levelsList[d.data.yval - 1]}`;
                result += `(${d.data.yval2[0].slice(1, $scope.levelsList.length + 1).join('|')})`;
                return result;
              }
            } else if ($scope.layout.props.rpartMethod === 'class') {
              result = `${$scope.levelsList[d.data.yval - 1]}`;
              result += `(${d.data.yval2[0].slice(1, $scope.levelsList.length + 1).join('|')})`;
            } else {
              result = `${d.data.yval}`;
            }
            return result;
          });

        // Update
        const nodeUpdate = nodeEnter.merge(node);

        // Transition to the proper position for the node
        nodeUpdate.transition()
          .duration(duration)
          .attr('transform', (d) => {
            return `translate(${d.y}, ${d.x})`;
          });

        // Update the node attributes and style
        nodeUpdate.select('circle.node')
          .attr('r', $scope.layout.props.bubbleSize)
          .attr('stroke', () => {
            return color;
          })
          .style('fill', (d) => {
            return d._children ? colorOpaque : '#fff';
          })
          .attr('cursor', 'pointer');

        // Remove any exiting nodes
        const nodeExit = node.exit().transition()
          .duration(duration)
          .attr('transform', () => {
            return `translate(${source.y}, ${source.x})`;
          })
          .remove();

        // On exit reduce the node circles size to 0
        nodeExit.select('circle')
          .attr('r', 1e-6);

        // On exit reduce the opacity of text labels
        nodeExit.select('text')
          .style('fill-opacity', 1e-6);

        // Update the links
        const link = svg.selectAll('path.link')
          .data(links, (d) => { return d.id; });

        // Enter any new links at the parent's previous position.
        const linkEnter = link.enter().insert('path', 'g')
          .attr('class', 'link')
          .attr('stroke', () => {
            return colorOpaque;
          })
          .attr('d', () => {
            const o = { x: source.x0, y: source.y0 };
            return diagonal(o, o);
          });

        // UPDATE
        const linkUpdate = linkEnter.merge(link);

        // Transition back to the parent element position
        linkUpdate.transition()
          .duration(duration)
          .attr('d', (d) => { return diagonal(d, d.parent); });

        // Remove any exiting links
        const linkExit = link.exit().transition()
          .duration(duration)
          .attr('d', () => {
            const o = { x: source.x, y: source.y };
            return diagonal(o, o);
          })
          .remove();

        // Store the old positions for transition.
        nodes.forEach((d) => {
          d.x0 = d.x;
          d.y0 = d.y;
        });
      }

      // Toggle children on click.
      function click(d) {
        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;
        }
        update(d);
      }

      // Collapse the node and all it's children
      function collapse(d) {
        if (d.children) {
          d._children = d.children;
          d._children.forEach(collapse);
          d.children = null;
        }
      }

      // Collapse all child nodes
      function collapseAll(d) {
        if (d.children) {
          d.children.forEach(collapseAll);
          if (typeof $scope.layout.props.defaultCollapseLevel !== 'undefined' && d.depth >= $scope.layout.props.defaultCollapseLevel) {
            collapse(d);
          }
        }
      }

      // Collapse after the second level
      root.children.forEach(collapseAll);

      update(root);
    },
  };
});
