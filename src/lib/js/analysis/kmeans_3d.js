define([
  '../chart/bubble_3d_chart',
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
          qNullSuppression: true,
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

      let data = `cbind(${meaList})`;
      if (layout.props.scaleData) {
        data = `scale(cbind(${meaList}))`;
      }

      const measure1 = utils.validateMeasure(layout.props.measures[0]);
      const measure2 = utils.validateMeasure(layout.props.measures[1]);
      const measure3 = utils.validateMeasure(layout.props.measures[2]);

      // Debug mode - set R dataset name to store the q data.
      utils.displayDebugModeMessage(layout.props.debugMode);
      const saveRDataset = utils.getDebugSaveDatasetScript(layout.props.debugMode, 'debug_kmeans_3d.rda');

      const defMea1 = `R.ScriptEval('${saveRDataset} set.seed(1);kmeans(${data},${numberOfClusters})$cluster', ${params})`;

      // Debug mode - display R Scripts to console
      utils.displayRScriptsToConsole(layout.props.debugMode, [defMea1]);

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
            qDef: measure3,
            // qSortBy: layout.qHyperCubeDef.qMeasures[1].qSortBy, // Sort definition
          },
        },
        {
          qDef: {
            qDef: defMea1,
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

      utils.pageExtensionData($scope, (dataPages) => {
        const measureInfo = $scope.layout.qHyperCube.qMeasureInfo;

        // Display error when all measures' grand total return NaN.
        if (isNaN(measureInfo[3].qMin) && isNaN(measureInfo[3].qMax)) {
          utils.displayConnectionError($scope.extId);
        } else {
          // Debug mode - display returned dataset to console
          utils.displayReturnedDatasetToConsole(layout.props.debugMode, dataPages);

          const palette = utils.getOneHundredColors();

          // Create containers for storing bubble data
          const bubbleData = [];
          for (let i = 1; i <= layout.props.numberOfClusters; i++) {
            bubbleData[i] = [];
            bubbleData[i].text = [];
            bubbleData[i].x = [];
            bubbleData[i].y = [];
            bubbleData[i].z = [];
          }

          $.each(dataPages, (key, value) => {
            bubbleData[value[4].qNum].text.push(value[0].qText);
            bubbleData[value[4].qNum].x.push(value[1].qNum);
            bubbleData[value[4].qNum].y.push(value[2].qNum);
            bubbleData[value[4].qNum].z.push(value[3].qNum);
          });

          const chartData = [];
          for (let i = 1; i <= layout.props.numberOfClusters; i++) {
            chartData.push({
              x: bubbleData[i].x,
              y: bubbleData[i].y,
              z: bubbleData[i].z,
              text: bubbleData[i].text,
              name: `cluster ${i}`,
              mode: 'markers',
              type: 'scatter3d',
              marker: {
                color: `rgba(${palette[i - 1]},0.7)`,
                size: layout.props.bubbleSize,
                opacity: 0.8,
                line: {
                  color: `rgba(${palette[i - 1]}, 1)`,
                  // color: 'rgba(217, 217, 217, 0.14)',
                  width: 1
                }
              },
            });
          }

          // Set HTML element for chart
          $(`.advanced-analytics-toolsets-${$scope.extId}`).html(`<div id="aat-chart-${$scope.extId}" style="width:100%;height:100%;"></div>`);

          bubbleChart.draw($scope, app, chartData, `aat-chart-${$scope.extId}`, null);
        }
        return defer.resolve();
      });
      return defer.promise;
    },
  };
});
