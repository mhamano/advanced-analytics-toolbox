define([
  '../../vendor/plotly.min',
  '../util/utils'
], (Plotly, utils) => {
  return {
    /**
     * draw - draw chart
     *
     * @param {Object} $scope        angular $scope
     * @param {Object} data          Data for chart
     * @param {String} elementId     HTML element id to embed chart
     * @param {Object} customOptions Custom chart options
     *
     * @return {Object} Chart object
     */
    draw($scope, data, elementId, customOptions) {
      const options = {
        showlegend: $scope.layout.props.showLegend,
        xaxis: {
          title: $scope.layout.props.xLabelsAndTitle ? $scope.layout.props.dimensions[0].label : '',
          showgrid: $scope.layout.props.xScale,
          side: $scope.layout.props.xAxisPosition,
          type: $scope.layout.props.xAxisType,
        },
        yaxis: {
          title: $scope.layout.props.yLabelsAndTitle ? $scope.layout.props.measures[0].label : '',
          showgrid: $scope.layout.props.yScale,
          side: $scope.layout.props.yAxisPosition,
          tickformat: utils.getTickFormat($scope, 0),
          tickprefix: utils.getPrefix($scope, 0),
          ticksuffix: utils.getSuffix($scope, 0),
        },
        separators: utils.getSeparators($scope, 0),
        dragmode: 'select',
        margin: {
          r: ($scope.layout.props.yAxisPosition == 'right') ? $scope.layout.props.marginRight + 70 : $scope.layout.props.marginRight,
          l: ($scope.layout.props.yAxisPosition == 'left') ? $scope.layout.props.marginLeft + 70 : $scope.layout.props.marginLeft,
          t: ($scope.layout.props.xAxisPosition == 'top') ? $scope.layout.props.marginTop + 70 : $scope.layout.props.marginTop,
          b: ($scope.layout.props.xAxisPosition == 'bottom') ? $scope.layout.props.marginBottom + 70 : $scope.layout.props.marginBottom,
        },
      };

      $.extend(options, customOptions);

      const config = {
        scrollZoom: true,
        showLink: false,
        displaylogo: false,
        modeBarButtonsToRemove: ['sendDataToCloud'],
      };

      const chart = document.getElementById(elementId);
      Plotly.plot(chart, data, options, config);

      return chart;
    },

    /**
     * setEvents - set events to the chart
     *
     * @param {type} chart Description
     *
     * @return {type} Description
     */
    setEvents(chart, $scope, app) {
      chart.on('plotly_click', (eventData) => {
        if (typeof eventData != 'undefined' && eventData.points.length > 0) {
          const pointNumber = eventData.points[0].pointNumber;
          if (typeof eventData.points[0].data.elemNum != 'undefined') {
            const fields = [parseInt(eventData.points[0].data.elemNum[pointNumber], 10)];
            $scope.self.selectValues(0, fields, true);
          }
        }
      });

      chart.on('plotly_selected', (eventData) => {
        if (typeof eventData != 'undefined' && eventData.points.length > 0) {
          const fields = eventData.points.filter((d) => {
            // return true when not NaN
            return typeof eventData.points[0].data.elemNum[d.pointNumber] != 'undefined';
          }).map((d) => {
            return parseInt(eventData.points[0].data.elemNum[d.pointNumber], 10);
          });
          $scope.backendApi.selectValues(0, fields, true);
        }
      });

      return null;
    },
  };
});
