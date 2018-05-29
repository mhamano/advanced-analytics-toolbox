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

      let sendJson = `json<-toJSON(list(res[,1], res[,2], res[,3], coef(summary(lm_result))[,"Estimate"]));`;

      if (layout.props.extendLine) {
        sendJson = `by<-q$Dimension[length(q$Dimension)]-q$Dimension[length(q$Dimension)-1]; from<-q$Dimension[length(q$Dimension)]+by;
                    data<-seq(from=from, by=by, length.out=${layout.props.extendDurations}); newdata <-data.frame(Dimension=data); pred_res<-predict(lm_result,newdata, interval="${layout.props.interval}", level=${layout.props.confidenceLevel});
                    json<-toJSON(list(res[,1], res[,2], res[,3], coef(summary(lm_result))[,"Estimate"], pred_res[,1], pred_res[,2], pred_res[,3]));`;
      }

      // Debug mode - set R dataset name to store the q data.
      utils.displayDebugModeMessage(layout.props.debugMode);
      const saveRDataset = utils.getDebugSaveDatasetScript(layout.props.debugMode, 'debug_simple_linear_line.rda');

      const defMea1 = `R.ScriptEvalExStr('NN','${saveRDataset} library(jsonlite); lm_result <- lm(Measure~Dimension, data=q);res<-predict(lm_result, interval="${layout.props.interval}", level=${layout.props.confidenceLevel});
      ${sendJson} json;',${dimension} as Dimension, ${measure} as Measure)`;

      // Debug mode - display R Scripts to console
      utils.displayRScriptsToConsole(layout.props.debugMode, [defMea1]);

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
        let result = null;
        const qMatrix = dataPages[0].qMatrix;

        // Check the result returned from R
        if (qMatrix[0][2].qText.length === 0 || qMatrix[0][2].qText == '-') {
          for (let i = 0; i < qMatrix.length; i++) {
            if (qMatrix[i][2].qText.length !== 0 && qMatrix[i][2].qText !== '-') {
              result = JSON.parse(qMatrix[i][2].qText);
            }
          }
        } else {
          result = JSON.parse(qMatrix[0][2].qText);
        }

        if (result == null) {
          utils.displayConnectionError($scope.extId);
        } else {
          // Debug mode - display returned dataset to console
          utils.displayReturnedDatasetToConsole(layout.props.debugMode, dataPages[0]);

          const palette = utils.getDefaultPaletteColor();

          const mean = result[0];
          const lower = result[1];
          const upper = result[2];
          const coef = result[3];
          const predMean = result[4];
          const predLower = result[5];
          const predUpper = result[6];

          // Get equation
          let equation = `y=${coef[1]}x`;
          if (coef[0] < 0) {
            equation += `${coef[0]}`;
          } else {
            equation += `+${coef[0]}`;
          }

          // Chart mode
          if (typeof $scope.layout.props.displayTable == 'undefined' || $scope.layout.props.displayTable == false) {
            const elemNum = [];
            const dim1 = []; // Dimension
            const mea1 = [];

            $.each(dataPages[0].qMatrix, (key, value) => {
              elemNum.push(value[0].qElemNumber);
              dim1.push(value[0].qText);
              mea1.push(value[1].qNum);
            });

            // Extend lines
            if (layout.props.extendLine) {
              $.merge(mean, predMean);
              $.merge(lower, predLower);
              $.merge(upper, predUpper);
              for (let i = 0; i < layout.props.extendDurations; i++) {
                dim1.push(`+${i + 1}`); // Forecast period is displayed as +1, +2, +3...
                mea1.push('');
              }
            }

            const chartData = [
              {
                x: dim1,
                y: mea1,
                elemNum,
                name: 'Observed',
                mode: 'lines+markers',
                fill:  layout.props.line,
                fillcolor: (layout.props.colors) ? `rgba(${palette[3]},0.3)` : `rgba(${utils.getConversionRgba(layout.props.colorForMain.color, 1)})`,
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
                y: mean,
                name: 'Fit',
                line: {
                  color: (layout.props.colors) ? `rgba(${palette[7]}, 1)` : `rgba(${utils.getConversionRgba(layout.props.colorForSub.color, 1)})`,
                },
              },
              {
                x: dim1,
                y: lower,
                name: 'Lower',
                fill: 'tonexty',
                fillcolor: (layout.props.colors) ? `rgba(${palette[7]},0.3)` : `rgba(${utils.getConversionRgba(layout.props.colorForSub.color, 0.3)})`,
                type: 'scatter',
                mode: 'none',
              },
              {
                x: dim1,
                y: upper,
                name: 'Upper',
                fill: 'tonexty',
                fillcolor: (layout.props.colors) ? `rgba(${palette[7]},0.3)` : `rgba(${utils.getConversionRgba(layout.props.colorForSub.color, 0.3)})`,
                type: 'scatter',
                mode: 'none',
              },
            ];

            // Add equation as an annotation
            const position = Math.floor(dim1.length/2);
            const annotationPosX = dim1[position];
            const annotationPosY = mean[position];
            const customOptions = {
              annotations: [],
            };

            if (layout.props.displayFormula) {
              customOptions.annotations.push(
                {
                  x: annotationPosX,
                  y: annotationPosY,
                  text: equation,
                  xref: 'x',
                  yref: 'y',
                  ax: -30,
                  ay: -40,
                  showarrow: true,
                  arrowhead: 3,
                }
              );
            }

            // Display ARIMA parameters
            $(`.advanced-analytics-toolsets-${$scope.extId}`).html(`<div id="aat-chart-${$scope.extId}" style="width:100%;height:100%;"></div>`);
            const chart = lineChart.draw($scope, chartData, `aat-chart-${$scope.extId}`, customOptions);
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
                locale.format(numberFormat)(mean[key]).replace(/G/, 'B'),
                locale.format(numberFormat)(lower[key]).replace(/G/, 'B'),
                locale.format(numberFormat)(upper[key]).replace(/G/, 'B'),
              ]);
            });

            // Extend lines
            if (layout.props.extendLine) {
              for (let i = 0; i < layout.props.forecastingPeriods; i++) {
                dataset.push([
                  '',
                  `+${i + 1}`, // Forecast period is displayed as +1, +2, +3...
                  '',
                  locale.format(numberFormat)(predMean[i]).replace(/G/, 'B'),
                  locale.format(numberFormat)(predLower[i]).replace(/G/, 'B'),
                  locale.format(numberFormat)(predUpper[i]).replace(/G/, 'B'),
                ]);
              }
            }

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
