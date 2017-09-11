define([
  '../../vendor/plotly.min',
  '../util/utils'
], (Plotly, utils) => {

  /**
   * draw - Description
   *
   * @param {Object} $scope        angular $scope
   * @param {Object} data          Data for chart
   * @param {String} elementId     HTML element id to embed chart
   * @param {Object} customOptions Custom chart options
   *
   * @return {Null} null
   */
  return {
    draw($scope, data, elementId, customOptions) {

      const options = {
        annotations: [],
        xaxis: {
          ticks: '',
          side: 'top',
        },
        yaxis: {
          ticks: '',
          ticksuffix: ' ',
          autosize: false,
          autorange: 'reversed',
        },
        margin: {
          r: ($scope.layout.props.yAxisPosition == 'right') ? $scope.layout.props.marginRight + 70 : $scope.layout.props.marginRight,
          l: ($scope.layout.props.yAxisPosition == 'left') ? $scope.layout.props.marginLeft + 70 : $scope.layout.props.marginLeft,
          t: ($scope.layout.props.xAxisPosition == 'top') ? $scope.layout.props.marginTop + 80 : $scope.layout.props.marginTop + 10,
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
  };
});
