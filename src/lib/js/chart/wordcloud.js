define([
  '../util/utils',
  '../../vendor/jqcloud',
  'css!../../vendor/jqcloud.css',
], (utils, jqcloud, cssContent) => {

  $('<style>').html(cssContent).appendTo('head');

  return {

    /**
     * draw - draw wordcloud chart
     *
     * @param {type} dataset dataset for chart
     *
     */
    draw(dataset) {
      $('#aat-chart').jQCloud(dataset, {
        autoResize: true
      });
    },
  };
});
