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

      // Set definitions for dimensions and measures
      const dimension = utils.validateDimension(layout.props.dimensions[0]);
      const dimensions = [{
        qNullSuppression: true,
        qDef: {
          qFieldDefs: [dimension],
          qSortCriterias: [{
            qSortByNumeric: 1,
          }],
        },
      }];

      const measure = utils.validateMeasure(layout.props.measures[0]);

      // Set  first and seasonal differences to observed value
      let observed = null;
      if (layout.props.differencing === 1) {
        observed = `R.ScriptEval('diff(na.omit(q$Measure),  ${layout.props.seasonalDifferences})', ${measure} as Measure)`;
      } else if (layout.props.differencing === 2) {
        observed = `R.ScriptEval('diff(diff(na.omit(q$Measure), ${layout.props.seasonalDifferences}), ${layout.props.firstDifferences})', ${measure} as Measure)`;
      } else {
        observed = measure;
      }

      // Lag Max
      let lagMax = '';

      if (layout.props.lagMax === false) {
        lagMax = `, lag.max=${layout.props.lagMaxValue} `;
      }

      // Set first and seasonal differences to acf and pacf
      const commands = ['acf', 'pacf'];
      const expressions = [];

      $.each(commands, (key, value) => {
        if (layout.props.differencing === 1) {
          expressions[value] = `${value}(diff(na.omit(q$Measure), ${layout.props.seasonalDifferences}),plot=FALSE ${lagMax})$acf`;
        } else if (layout.props.differencing === 2) {
          expressions[value] = `${value}(diff(diff(na.omit(q$Measure), ${layout.props.seasonalDifferences}), ${layout.props.firstDifferences}),plot=FALSE ${lagMax})$acf`;
        } else {
          expressions[value] = `${value}(na.omit(q$Measure),plot=FALSE ${lagMax})$acf`;
        }
      });

      // Debug mode - set R dataset name to store the q data.
      utils.displayDebugModeMessage(layout.props.debugMode);
      const saveRDataset = utils.getDebugSaveDatasetScript(layout.props.debugMode, 'debug_autocorrelation.rda');

      const defMea1 = `R.ScriptEval('${saveRDataset} ${expressions.acf}', ${measure} as Measure)`;
      const defMea2 = `R.ScriptEval('${expressions.pacf}', ${measure} as Measure)`;
      const defMea3 = `R.ScriptEval('high<-qnorm((1 + 0.95)/2)/sqrt(length(q$Measure));low<-qnorm((1 - 0.95)/2)/sqrt(length(q$Measure));c(high, low)', ${measure} as Measure)`;

      // Debug mode - display R Scripts to console
      utils.displayRScriptsToConsole(layout.props.debugMode, [defMea1, defMea2, defMea3]);

      const measures = [
        {
          qDef: {
            qDef: observed,
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
        if (isNaN(measureInfo[0].qMin) && isNaN(measureInfo[0].qMax)
          && isNaN(measureInfo[1].qMin) && isNaN(measureInfo[1].qMax)
          && isNaN(measureInfo[2].qMin) && isNaN(measureInfo[2].qMax)
          && isNaN(measureInfo[3].qMin) && isNaN(measureInfo[3].qMax)
        ) {
          utils.displayConnectionError($scope.extId);
        } else {
          // Debug mode - display returned dataset to console
          utils.displayReturnedDatasetToConsole(layout.props.debugMode, dataPages[0]);

          const palette = utils.getDefaultPaletteColor();

          const high = dataPages[0].qMatrix[0][4].qNum;
          const low = dataPages[0].qMatrix[1][4].qNum;

          // Line Chart
          const elemNum = [];
          const dim1 = [];
          const mea1 = [];

          $.each(dataPages[0].qMatrix, (key, value) => {
            elemNum.push(value[0].qElemNumber);
            dim1.push(value[0].qText);
            mea1.push(value[1].qNum);
          });

          // Delete records from dim1 for differencing
          if (layout.props.differencing === 1 || layout.props.differencing === 2) {
            for (let i = 0; i < layout.props.seasonalDifferences; i++) {
              dim1.shift();
            }
          }
          if (layout.props.differencing === 2) {
            for (let i = 0; i < layout.props.firstDifferences; i++) {
              dim1.shift();
            }
          }

          // Draw chart
          const chartData = [{
            x: dim1,
            y: mea1,
            elemNum,
            name: 'Observed',
            mode: 'lines+markers',
            fill: layout.props.line,
            fillcolor: (layout.props.colors) ? `rgba(${palette[3]},0.3)` : `rgba(${utils.getConversionRgba(layout.props.colorForMain.color, 1)})`,
            marker: {
              color: (layout.props.colors) ? `rgba(${palette[3]},1)` : `rgba(${utils.getConversionRgba(layout.props.colorForMain.color, 1)})`,
              size: (layout.props.datapoints) ? layout.props.pointRadius : 1,
            },
            line: {
              width: layout.props.borderWidth,
            },
            xaxis: 'x',
            yaxis: 'y',
          }];

          let b_dim1, b_mea1, highLine, lowLine, b_chartData;

          const id = [];
          id[2] = 2;
          id[3] = 4;
          // Loop to draw two bar charts for Autocorrelation and Partial Autocorrelation
          for (let i = 2; i < 4; i++) {
            b_dim1 = [];
            b_mea1 = [];
            highLine = [];
            lowLine = [];
            b_chartData = {};

            let j = i - 2; // acf starts from 0, and pacf starts from 1
            $.each(dataPages[0].qMatrix, (key, value) => {
              if (value[i].qText === '-') { return false; }
              b_dim1.push(j);
              b_mea1.push(value[i].qNum);
              highLine.push(high);
              lowLine.push(low);
              j++;
            });

            // Draw chart
            chartData.push(
              {
                x: b_dim1,
                y: b_mea1,
                name: (i === 2) ? 'Autocorrelation' : 'Partial Autocorrelation',
                marker: {
                  color: (layout.props.colors) ? `rgba(${palette[3]}, 1)` : `rgba(${utils.getConversionRgba(layout.props.colorForMain.color, 1)})`,
                },
                type: 'bar',
                width: 0.3,
                xaxis: 'x' + i,
                yaxis: 'y' + i,
              },
            );
            chartData.push(
              {
                x: b_dim1,
                y: highLine,
                name: 'Upper',
                type: 'scatter',
                line: {
                  color: (layout.props.colors) ? `rgba(${palette[7]}, 1)` : `rgba(${utils.getConversionRgba(layout.props.colorForSub.color, 1)})`,
                  dash: 'dash',
                },
                marker: {
                  size: 1,
                },
                xaxis: 'x' + i,
                yaxis: 'y' + i,
              },
            );
            chartData.push(
              {
                x: b_dim1,
                y: lowLine,
                name: 'Lower',
                type: 'scatter',
                line: {
                  color: (layout.props.colors) ? `rgba(${palette[7]}, 1)` : `rgba(${utils.getConversionRgba(layout.props.colorForSub.color, 1)})`,
                  dash: 'dash',
                },
                marker: {
                  size: 1,
                },
                xaxis: 'x' + i,
                yaxis: 'y' + i,
              },
            );
          } // end of for loop

          const customOptions = {
            xaxis: {
              zeroline: false,
              showgrid: $scope.layout.props.xScale,
            },
            yaxis: {
              domain: [0.65, 1],
              tickformat: utils.getTickFormat($scope, 0),
              tickprefix: utils.getPrefix($scope, 0),
              ticksuffix: utils.getSuffix($scope, 0),
              showgrid: $scope.layout.props.yScale,
            },
            xaxis2: {
              domain: [0, 0.45],
              anchor: 'y2',
              showgrid: $scope.layout.props.xScale,
            },
            yaxis2: {
              domain: [0, 0.45],
              anchor: 'x2',
              showgrid: $scope.layout.props.yScale,
            },
            xaxis3: {
              domain: [0.55, 1],
              anchor: 'y3',
              showgrid: $scope.layout.props.xScale,
            },
            yaxis3: {
              domain: [0, 0.45],
              anchor: 'x3',
              showgrid: $scope.layout.props.yScale,
            },
          };

          // Set HTML element for chart
          $(`.advanced-analytics-toolsets-${$scope.extId}`).html(`<div id="aat-chart-${$scope.extId}" class="simple" style="width:100%;height:100%;"></div>`);

          const chart = lineChart.draw($scope, chartData, `aat-chart-${$scope.extId}`, customOptions);
          lineChart.setEvents(chart, $scope, app);

        } // end of if condition
        return defer.resolve();
      }); // end of backend API callback
      return defer.promise;
    }, // end of drawChart function
  };
});
