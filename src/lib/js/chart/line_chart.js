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
          r: ($scope.layout.props.yAxisPosition == 'right') ? 80 : 10,
          l: ($scope.layout.props.yAxisPosition == 'left') ? 80 : 10,
          t: ($scope.layout.props.xAxisPosition == 'top') ? 80 : 10,
          b: ($scope.layout.props.xAxisPosition == 'bottom') ? 80 : 10,
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
          const fields = [parseInt(eventData.points[0].pointNumber, 10)];
          // app.field(dimension).selectValues(fields, true, true);
          $scope.backendApi.selectValues(0, fields, true);
        }
      });

      chart.on('plotly_selected', (eventData) => {
        if (typeof eventData != 'undefined' && eventData.points.length > 0) {
          const fields = eventData.points.map((d) => {
            return parseInt(d.pointNumber, 10);
          });
          // app.field(dimension).selectValues(fields, true, true);
          $scope.backendApi.selectValues(0, fields, true);
        }
      });

      return null;
    },
  };
});
