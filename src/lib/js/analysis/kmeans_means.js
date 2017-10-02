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
      let dataType = 'N';

      for (let i = 1; i < meaLen; i++) {
        const mea = utils.validateMeasure(layout.props.measures[i]);
        if (mea.length > 0) {
          const param = `,${mea} as mea${i}`;
          params += param;
          meaList += `,q$mea${i}`;
          dataType += 'N';
        }
      }

      let data = `cbind(${meaList})`;
      if (layout.props.scaleData) {
        data = `scale(cbind(${meaList}))`;
      }

      // Debug mode - set R dataset name to store the q data.
      utils.displayDebugModeMessage(layout.props.debugMode);
      const saveRDataset = utils.getDebugSaveDatasetScript(layout.props.debugMode, 'debug_kmeans_means.rda');

      const defMea1 = `R.ScriptEvalExStr('${dataType}', '${saveRDataset} library(jsonlite); set.seed(1); json<-toJSON(kmeans(${data},${numberOfClusters})$centers); json;', ${params})`;

      // Debug mode - display R Scripts to console
      utils.displayRScriptsToConsole(layout.props.debugMode, [defMea1]);

      const measures = [
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
        qHeight: 1,
      }];

      $scope.backendApi.getData(requestPage).then((dataPages) => {
        // Display error when all measures' grand total return NaN.
        if (dataPages[0].qMatrix[0][1].qText.length === 0 || dataPages[0].qMatrix[0][1].qText == '-') {
          utils.displayConnectionError($scope.extId);
        } else {
          // Debug mode - display returned dataset to console
          utils.displayReturnedDatasetToConsole(layout.props.debugMode, dataPages[0]);

          const result = JSON.parse(dataPages[0].qMatrix[0][1].qText);
          const palette = utils.getOneHundredColors();

          const meaLen = layout.props.measures.length;
          const meaList = [];

          for (let i = 0; i < meaLen; i++) {
            meaList.push(layout.props.measures[i].label);
          }

          const chartData = [];
          const customOptions = {
            xaxis: {
              title: $scope.layout.props.xLabelsAndTitle ? 'Variables' : '',
              showgrid: $scope.layout.props.xScale,
              side: $scope.layout.props.xAxisPosition,
            },
            yaxis: {
              title: $scope.layout.props.yLabelsAndTitle ? 'Y' : '',
              showgrid: $scope.layout.props.yScale,
              side: $scope.layout.props.yAxisPosition,
              tickformat: utils.getTickFormat($scope, 0),
              tickprefix: utils.getPrefix($scope, 0),
              ticksuffix: utils.getSuffix($scope, 0),
            },
            barmode: 'group',
          };

          // Divide by variables
          if (typeof $scope.layout.props.dividedBy == 'undefined' || $scope.layout.props.dividedBy ==='variables') {
            $.each(result, (key, value) => {
              chartData.push({
                x: meaList,
                y: value,
                name: `cluster ${key + 1}`,
                type: 'bar',
              });
            });

          // Divide by clusters
          } else {
            // Create list of clusters
            const clusterList = [];
            for (let i = 1; i <= layout.props.numberOfClusters; i++) {
              clusterList.push(`cluster ${i}`);
            }

            // Create containers for storing data
            const variableData = [];
            for (let i = 0; i < meaLen; i++) {
              variableData[i] = [];
            }

            $.each(result, (key, value) => {
              $.each(value, (subkey, subvalue) => {
                variableData[subkey].push(subvalue)
              });
            });

            for (let i = 0; i < meaLen; i++) {
              chartData.push({
                x: clusterList,
                y: variableData[i],
                name: meaList[i],
                type: 'bar',
              });
            }

            customOptions.xaxis.title = $scope.layout.props.xLabelsAndTitle ? 'Clusters' : '';
          }
          // Set HTML element for chart
          $(`.advanced-analytics-toolsets-${$scope.extId}`).html(`<div id="aat-chart-${$scope.extId}" style="width:100%;height:100%;"></div>`);
          bubbleChart.draw($scope, app, chartData, `aat-chart-${$scope.extId}`, customOptions);

          $(`#aat-chart-${$scope.extId} .legend .traces .legendtoggle`).css('display', 'none');
          $(`#aat-chart-${$scope.extId} g.traces`).on('click', (data) => {
            // do nothing
          });
        }
        return defer.resolve();
      });
      return defer.promise;
    },
  };
});
