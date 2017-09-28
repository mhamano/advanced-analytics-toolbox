define([
  '../chart/line_chart',
  '../chart/datatables',
  '../util/utils',
  'ng!$q',
  '../../vendor/d3-format.min',
], (lineChart, datatables, utils, $q, d3) => {
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
      const measure = utils.validateMeasure(layout.props.measures[0]);

      // Debug mode - set R dataset name to store the q data.
      utils.displayDebugModeMessage(layout.props.debugMode);
      const saveRDataset = utils.getDebugSaveDatasetScript(layout.props.debugMode, 'debug_simple_linear_line.rda');

      const defMea1 = `R.ScriptEval('${saveRDataset} lm_result <- lm(q$Measure~q$Dimension);predict(lm_result, interval="${layout.props.interval}", level=${layout.props.confidenceLevel})[,1]',${dimension} as Dimension, ${measure} as Measure)`;
      const defMea2 = `R.ScriptEval('lm_result <- lm(q$Measure~q$Dimension);predict(lm_result, interval="${layout.props.interval}", level=${layout.props.confidenceLevel})[,2]',${dimension} as Dimension, ${measure} as Measure)`;
      const defMea3 = `R.ScriptEval('lm_result <- lm(q$Measure~q$Dimension);predict(lm_result, interval="${layout.props.interval}", level=${layout.props.confidenceLevel})[,3]',${dimension} as Dimension, ${measure} as Measure)`;

      // Debug mode - display R Scripts to console
      utils.displayRScriptsToConsole(layout.props.debugMode, [defMea1, defMea2, defMea3]);

      const measures = [
        {
          qDef: {
            qDef: measure,
            // qSortBy: layout.qHyperCubeDef.qMeasures[0].qSortBy, // Sort definition
          },
        },
        {
          qDef: {
            qLabel: 'Fit',
            qDef: defMea1,
          },
        },
        {
          qDef: {
            qLabel: 'Lower',
            qDef: defMea2,
          },
        },
        {
          qDef: {
            qLabel: 'Upper',
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

      // const dimension = utils.validateDimension(layout.props.dimensions[0]);
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

          // Chart mode
          if (typeof $scope.layout.props.displayTable == 'undefined' || $scope.layout.props.displayTable == false) {
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
                fillcolor: (layout.props.colors) ? `rgba(${palette[3]},0.3)` : `rgba(${palette[layout.props.colorForMain]},0.3)`,
                marker: {
                  color: (layout.props.colors) ? `rgba(${palette[3]},1)` : `rgba(${palette[layout.props.colorForMain]},1)`,
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
                  color: `rgba(${palette[layout.props.colorForSub]},1)`,
                },
              },
              {
                x: dim1,
                y: mea3,
                name: 'Lower',
                fill: 'tonexty',
                fillcolor: `rgba(${palette[layout.props.colorForSub]},0.3)`,
                type: 'scatter',
                mode: 'none',
              },
              {
                x: dim1,
                y: mea4,
                name: 'Upper',
                fill: 'tonexty',
                fillcolor: `rgba(${palette[layout.props.colorForSub]},0.3)`,
                type: 'scatter',
                mode: 'none',
              },
            ];

            // Display ARIMA parameters
            $(`.advanced-analytics-toolsets-${$scope.extId}`).html(`<div id="aat-chart-${$scope.extId}" style="width:100%;height:100%;"></div>`);
            const chart = lineChart.draw($scope, chartData, `aat-chart-${$scope.extId}`, null);
            lineChart.setEvents(chart, $scope, app);

          // Table display mode
          } else {
            // Get locale info
            const locale = utils.getLocale($scope, 0);

            // Get number format
            const numberFormat = utils.getNumberFormat($scope, 0);

            const dataset = [];
            $.each(dataPages[0].qMatrix, (key, value) => {
              dataset.push([
                value[0].qElemNumber,
                value[0].qText,
                locale.format(numberFormat)(value[1].qNum).replace(/G/, 'B'),
                locale.format(numberFormat)(value[2].qNum).replace(/G/, 'B'),
                locale.format(numberFormat)(value[3].qNum).replace(/G/, 'B'),
                locale.format(numberFormat)(value[4].qNum).replace(/G/, 'B'),
              ]);
            });
            const html = `
              <table id="aat-table-${$scope.extId}" class="display">
                <thead>
                  <tr>
                    <th>qElemNumber</th>
                    <th>${$scope.layout.props.dimensions[0].label}</th>
                    <th>${$scope.layout.props.measures[0].label}</th>
                    <th>Fit</th>
                    <th>Lower</th>
                    <th>Upper</th>
                  </tr>
                </thead>
                <tbody>
                </tbody>
              </table>`;

            datatables.draw(app, $scope, `#aat-table-${$scope.extId}`, dataset, html, null).then((table) => {
              datatables.setEvents(table, $scope, app);
            });
          }
        }
        return defer.resolve();
      });
      return defer.promise;
    },
  };
});
