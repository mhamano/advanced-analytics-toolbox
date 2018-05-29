define([
  '../chart/heatmap',
  '../util/utils',
  'ng!$q',
], (heatmap, utils, $q) => {
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

      // Set definitions for dimensions and measures
      const dimension = utils.validateDimension(layout.props.dimensions[0]);
      const dimensions = [{
        qNullSuppression: true,
        qDef: {
          qFieldDefs: [dimension]
        },
      }];

      const meaLen = layout.props.measures.length;
      $scope.rowsLabel = [layout.props.measures[0].label]; // Label for dimension values
      let params = `${utils.validateMeasure(layout.props.measures[0])} as mea0`;
      let meaList = 'q$mea0';
      let dataType = 'N'

      for (let i = 1; i < meaLen; i++) {
        const mea = utils.validateMeasure(layout.props.measures[i]);
        if (mea.length > 0) {
          const param = `,${mea} as mea${i}`;
          params += param;
          meaList += `, q$mea${i}`;
          dataType += 'N';

          //$scope.rowsLabel.push(utils.validateMeasure(layout.props.measures[i]));
          $scope.rowsLabel.push(layout.props.measures[i].label);
        }
      }

      // Debug mode - set R dataset name to store the q data.
      utils.displayDebugModeMessage(layout.props.debugMode);
      const saveRDataset = utils.getDebugSaveDatasetScript(layout.props.debugMode, 'debug_correlation_heatmap.rda');

      const defMea1 = `R.ScriptEvalExStr('${dataType}','${saveRDataset} library(jsonlite);res<-cor(data.frame(${meaList}));json<-toJSON(res);json;',${params})`;

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
    drawChart($scope) {
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
        const measureInfo = $scope.layout.qHyperCube.qMeasureInfo;

        // Display error when all measures' grand total return NaN.
        if (dataPages[0].qMatrix[0][1].qText.length === 0 || dataPages[0].qMatrix[0][1].qText == '-') {
          utils.displayConnectionError($scope.extId);
        } else {
          // Debug mode - display returned dataset to console
          utils.displayReturnedDatasetToConsole(layout.props.debugMode, dataPages[0]);

          const palette = utils.getDefaultPaletteColor();

          const correlation = JSON.parse(dataPages[0].qMatrix[0][1].qText);

          const chartData = [{
            x: $scope.rowsLabel,
            y: $scope.rowsLabel,
            z: correlation,
            type: 'heatmap',
            showscale: true,
          }];

          const customOptions = [];
          customOptions.annotations = [];

          for (let i = 0; i <  $scope.rowsLabel.length; i++) {
            for (let j = 0; j < $scope.rowsLabel.length; j++) {
              const result = {
                xref: 'x1',
                yref: 'y1',
                x: $scope.rowsLabel[j],
                y: $scope.rowsLabel[i],
                text: correlation[i][j],
                showarrow: false,
                font: {
                  color: 'white',
                },
              };
              customOptions.annotations.push(result);
            }
          }

          // Set HTML element for chart
          $(`.advanced-analytics-toolsets-${$scope.extId}`).html(`<div id="aat-chart-${$scope.extId}" style="width:100%;height:100%;"></div>`);

          heatmap.draw($scope, chartData, `aat-chart-${$scope.extId}`, customOptions);
        }
        return defer.resolve();
      });
      return defer.promise;
    },
  };
});
