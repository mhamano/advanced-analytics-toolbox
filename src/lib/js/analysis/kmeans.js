define([
  '../chart/bubble_chart',
  '../util/utils',
  'ng!$q',
], (bubbleChart, utils, $q) => {
  return {
    /**
     * createCube - create HyperCubes
     *
     * @param {Object} app    reference to app
     * @param {Object} $scope angular $scope
     *
     * @return {Null} null
     */
    createCube(app, $scope) {
      const layout = $scope.layout;

      // Display loader
      // utils.displayLoader($scope.extId);

      const numberOfClusters = layout.props.numberOfClusters;

      // Set definitions for dimensions and measures
      const dimension = utils.validateDimension(layout.props.dimensions[0]);
      const dimensions = [
        {
          qDef: {
            qFieldDefs: [dimension],
            // qSortCriterias: layout.qHyperCubeDef.qDimensions[0].qDef.qSortCriterias
          },
        },
      ];
      const meaLen = layout.props.measures.length;
      let params = `${utils.validateMeasure(layout.props.measures[0])} as mea0`;
      let meaList = 'q$mea0';

      for (let i = 1; i < meaLen; i++) {
        const mea = utils.validateMeasure(layout.props.measures[i]);
        if (mea.length > 0) {
          const param = `,${mea} as mea${i}`;
          params += param;
          meaList += `,q$mea${i}`;
        }
      }

      const measure1 = utils.validateMeasure(layout.props.measures[0]);
      const measure2 = utils.validateMeasure(layout.props.measures[1]);
      const measures = [
        {
          qDef: {
            qDef: measure1,
            // qSortBy: layout.qHyperCubeDef.qMeasures[0].qSortBy, // Sort definition
          },
        },
        {
          qDef: {
            qDef: measure2,
            // qSortBy: layout.qHyperCubeDef.qMeasures[1].qSortBy, // Sort definition
          },
        },
        {
          qDef: {
            qDef: `R.ScriptEval('set.seed(1);kmeans(cbind(${meaList}),${numberOfClusters})$cluster', ${params})`,
          },
        },
        {
          qDef: {
            qLabel: '-',
            qDef: '', // Dummy
          },
        },
        {
          qDef: {
            qLabel: '-',
            qDef: '', // Dummy
          },
        },
      ];

      $scope.backendApi.applyPatches([
        {
          qPath: '/qHyperCubeDef/qDimensions',
          qOp: 'replace',
          qValue: JSON.stringify(dimensions),
        },
        {
          qPath: '/qHyperCubeDef/qMeasures',
          qOp: 'replace',
          qValue: JSON.stringify(measures),
        },
      ], false);

      $scope.patchApplied = true;
      return null;
    },
    /**
     * drawChart - draw chart with updated data
     *
     * @param {Object} $scope angular $scope
     *
     * @return {Object} Promise object
     */
    drawChart($scope, app) {
      const defer = $q.defer();
      const layout = $scope.layout;

      const dimension = utils.validateDimension(layout.props.dimensions[0]);
      const requestPage = [{
        qTop: 0,
        qLeft: 0,
        qWidth: 6,
        qHeight: 1500,
      }];

      $scope.backendApi.getData(requestPage).then((dataPages) => {
        const measureInfo = $scope.layout.qHyperCube.qMeasureInfo;

        // Display error when all measures' grand total return NaN.
        if (isNaN(measureInfo[2].qMin) && isNaN(measureInfo[2].qMax)) {
          utils.displayConnectionError($scope.extId);
        } else {
          const palette = utils.getOneHundredColors();

          // Create containers for storing bubble data
          const bubbleData = [];
          for (let i = 1; i <= layout.props.numberOfClusters; i++) {
            bubbleData[i] = [];
            bubbleData[i].text = [];
            bubbleData[i].x = [];
            bubbleData[i].y = [];
          }

          $.each(dataPages[0].qMatrix, (key, value) => {
            bubbleData[value[3].qNum].text.push(value[0].qText);
            bubbleData[value[3].qNum].x.push(value[1].qNum);
            bubbleData[value[3].qNum].y.push(value[2].qNum);
          });

          const chartData = [];
          for (let i = 1; i <= layout.props.numberOfClusters; i++) {
            chartData.push({
              x: bubbleData[i].x,
              y: bubbleData[i].y,
              text: bubbleData[i].text,
              name: `cluster ${i}`,
              mode: 'markers',
              type: 'scatter',
              marker: {
                color: `rgba(${palette[i - 1]},0.7)`,
                size: layout.props.bubbleSize,
              },
            });
          }

          // Set HTML element for chart
          $(`.advanced-analytics-toolsets-${$scope.extId}`).html(`<div id="aat-chart-${$scope.extId}" style="width:100%;height:100%;"></div>`);

          const chart = bubbleChart.draw($scope, app, chartData, `aat-chart-${$scope.extId}`, null);
          bubbleChart.setEvents(chart, $scope, app);
          $(`#aat-chart-${$scope.extId} .legend .traces .legendtoggle`).css('display', 'none');
          $(`#aat-chart-${$scope.extId} g.traces`).on('click', (data) => {
            console.log(bubbleData[data.currentTarget.childNodes[1].textContent.replace('cluster ','')].text)
            const selected = bubbleData[data.currentTarget.childNodes[1].textContent.replace('cluster ','')].text;
            const fields = selected.map((d) => {
              return parseInt(d, 10);
            });
            app.field($scope.layout.props.dimensions[0].expression).selectValues(fields, true, true);
          });
        }
        return defer.resolve();
      });
      return defer.promise;
    },
  };
});
