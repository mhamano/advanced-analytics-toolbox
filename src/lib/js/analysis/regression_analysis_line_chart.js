define([
  '../chart/line_chart',
  '../util/utils',
  'ng!$q',
], (lineChart, utils, $q) => {
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

      const dimension = utils.validateDimension(layout.props.dimensions[0]);

      const dimensions = [
        {
          qNullSuppression: true,
          qDef: {
            qFieldDefs: [dimension],
            qSortCriterias: [{
              qSortByExpression: layout.props.dimSort || !layout.props.dimSortByExpression ? 0 : layout.props.dimSortByExpressionAsc,
              qSortByNumeric: (layout.props.dimSort) ? 1 : (!layout.props.dimSortByNum) ? 0 : layout.props.dimSortByNumAsc,
              qSortByAscii: layout.props.dimSort || !layout.props.dimSortByAlph ? 0 : layout.props.dimSortByAlphAsc,
              qExpression: {
                qv: layout.props.dimSortByExpressionString,
              },
            }],
          },
        },
      ];

      const meaLen = layout.props.measures.length;
      $scope.rowsLabel = ['(Intercept)', utils.validateMeasure(layout.props.measures[1])]; // Label for dimension values
      let params = `${utils.validateMeasure(layout.props.measures[0])} as mea0, ${utils.validateMeasure(layout.props.measures[1])} as mea1`;
      let meaList = 'q$mea0 ~ q$mea1';

      for (let i = 2; i < meaLen; i++) {
        const mea = utils.validateMeasure(layout.props.measures[i]);
        if (mea.length > 0) {
          const param = `,${mea} as mea${i}`;
          params += param;
          meaList += ` + q$mea${i}`;

          $scope.rowsLabel.push(utils.validateMeasure(layout.props.measures[i]));
        }
      }

      // Debug mode - set R dataset name to store the q data.
      utils.displayDebugModeMessage(layout.props.debugMode);
      const saveRDataset = utils.getDebugSaveDatasetScript(layout.props.debugMode, 'debug_regression_analysis_line_chart.rda');

      const defMea1 = `R.ScriptEval('${saveRDataset} lm_result <- lm(${meaList});predict(lm_result, interval="${layout.props.interval}", level=${layout.props.confidenceLevel})[,1]',${params})`;
      const defMea2 = `R.ScriptEval('lm_result <- lm(${meaList});predict(lm_result, interval="${layout.props.interval}", level=${layout.props.confidenceLevel})[,2]',${params})`;
      const defMea3 = `R.ScriptEval('lm_result <- lm(${meaList});predict(lm_result, interval="${layout.props.interval}", level=${layout.props.confidenceLevel})[,3]',${params})`

      // Debug mode - display R Scripts to console
      utils.displayRScriptsToConsole(layout.props.debugMode, [defMea1, defMea2, defMea3]);

      const measure = utils.validateMeasure(layout.props.measures[0]);
      const measures = [
        {
          qDef: {
            qDef: measure,
          },
        },
        {
          qDef: {
            qDef: defMea1,
          },
        },
        {
          qDef: {
            qDef: defMea2,
          },
        },
        {
          qDef: {
            qDef: defMea3,
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
        if (isNaN(measureInfo[1].qMin) && isNaN(measureInfo[1].qMax)
          && isNaN(measureInfo[2].qMin) && isNaN(measureInfo[2].qMax)
          && isNaN(measureInfo[3].qMin) && isNaN(measureInfo[3].qMax)
        ) {
          utils.displayConnectionError($scope.extId);
        } else {
          // Debug mode - display returned dataset to console
          utils.displayReturnedDatasetToConsole(layout.props.debugMode, dataPages[0]);

          const palette = utils.getDefaultPaletteColor();

          const elemNum = [];
          const dim1 = []; // Dimension
          const mea1 = [];
          const mea2 = [];
          const mea3 = [];
          const mea4 = [];

          $.each(dataPages[0].qMatrix, (key, value) => {
            elemNum.push(value[0].qElemNumber);
            dim1.push(value[0].qText);
            mea1.push(value[1].qNum);
            mea2.push(value[2].qNum);
            mea3.push(value[3].qNum);
            mea4.push(value[4].qNum);
          });

          const chartData = [
            {
              x: dim1,
              y: mea1,
              elemNum,
              name: 'Observed',
              mode: 'lines+markers',
              fill:  layout.props.line,
              fillcolor: (layout.props.colors) ? `rgba(${palette[3]},0.3)` : `rgba(${utils.getConversionRgba(layout.props.colorForMain.color, 0.3)})`,
              marker: {
                color: (layout.props.colors) ? `rgba(${palette[3]},1)` : `rgba(${utils.getConversionRgba(layout.props.colorForMain.color, 1)})`,
                size: (layout.props.datapoints) ? layout.props.pointRadius : 1,
              },
              line: {
                width: layout.props.borderWidth,
              },
            },
            {
              x: dim1,
              y: mea2,
              name: 'Fit',
              line: {
                color: (layout.props.colors) ? `rgba(${palette[7]}, 1)` : `rgba(${utils.getConversionRgba(layout.props.colorForSub.color, 1)})`,
              },
            },
            {
              x: dim1,
              y: mea3,
              name: 'Lower',
              fill: 'tonexty',
              fillcolor: (layout.props.colors) ? `rgba(${palette[7]},0.3)` : `rgba(${utils.getConversionRgba(layout.props.colorForSub.color, 0.3)})`,
              type: 'scatter',
              mode: 'none',
            },
            {
              x: dim1,
              y: mea4,
              name: 'Upper',
              fill: 'tonexty',
              fillcolor: (layout.props.colors) ? `rgba(${palette[7]},0.3)` : `rgba(${utils.getConversionRgba(layout.props.colorForSub.color, 0.3)})`,
              type: 'scatter',
              mode: 'none',
            },
          ];

          // Set HTML element for chart
          $(`.advanced-analytics-toolsets-${$scope.extId}`).html(`<div id="aat-chart-${$scope.extId}" style="width:100%;height:100%;"></div>`);

          const chart = lineChart.draw($scope, chartData, `aat-chart-${$scope.extId}`, null);
          lineChart.setEvents(chart, $scope, app);
        }
        return defer.resolve();
      });
      return defer.promise;
    },
  };
});
