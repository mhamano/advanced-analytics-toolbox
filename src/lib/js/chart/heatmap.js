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
        }
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
