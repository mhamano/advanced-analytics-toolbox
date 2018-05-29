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

      // Debug mode - set R dataset name to store the q data.
      utils.displayDebugModeMessage(layout.props.debugMode);
      const saveRDataset = utils.getDebugSaveDatasetScript(layout.props.debugMode, 'debug_timeseries_decomposition.rda');

      const defMea1 = `R.ScriptEval('${saveRDataset} library(dplyr);data<-ts(q$Measure,frequency=${layout.props.frequency});(decompose(data, type="${layout.props.seasonal}")$trend);', ${measure} as Measure)`;
      const defMea2 = `R.ScriptEval('library(dplyr);data<-ts(q$Measure,frequency=${layout.props.frequency});(decompose(data, type="${layout.props.seasonal}")$seasonal);', ${measure} as Measure)`;
      const defMea3 = `R.ScriptEval('library(dplyr);data<-ts(q$Measure,frequency=${layout.props.frequency});(decompose(data, type="${layout.props.seasonal}")$random);', ${measure} as Measure)`

      // Debug mode - display R Scripts to console
      utils.displayRScriptsToConsole(layout.props.debugMode, [defMea1, defMea2, defMea3]);

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

          let elemNum;
          let dim;
          let mea;
          const palette = utils.getDefaultPaletteColor();

          const chartData = [];
          for (let i = 1; i < 5; i++) {
            elemNum = [];
            dim = [];
            mea = [];

            $.each(dataPages[0].qMatrix, (key, value) => {
              elemNum.push(value[0].qElemNumber);
              dim.push(value[0].qText);
              mea.push(value[i].qNum);
            });
            const dataset = {
              x: dim,
              y: mea,
              elemNum,
              name: (i === 1) ? 'Observed' : (i === 2) ? 'Trend' : (i === 3) ? 'Seasonal' : (i === 4) ? 'Random' : '',
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
            };

            if (layout.props.decomposeInFourCharts && i != 4) {
              dataset.xaxis = 'x';
              dataset.yaxis = 'y' + (5 - i);
            }

            chartData.push(dataset);
          } // end of for loop

          // Set HTML element for chart
          $(`.advanced-analytics-toolsets-${$scope.extId}`).html(`<div id="aat-chart-${$scope.extId}" style="width:100%;height:100%;"></div>`);

          let chart = '';
          if (layout.props.decomposeInFourCharts) {
            const customOptions = {
              showlegend: $scope.layout.props.showLegend,
              xaxis: {
                showgrid: $scope.layout.props.xScale,
              },
              yaxis: {
                title: 'Random',
                domain: [0, 0.24],
                showgrid: $scope.layout.props.yScale,
                tickformat: utils.getTickFormat($scope, 0),
                tickprefix: utils.getPrefix($scope, 0),
                ticksuffix: utils.getSuffix($scope, 0),
              },
              yaxis2: {
                title: 'Seasonal',
                domain: [0.25, 0.49],
                anchor: 'x2',
                showgrid: $scope.layout.props.yScale,
                tickformat: utils.getTickFormat($scope, 0),
                tickprefix: utils.getPrefix($scope, 0),
                ticksuffix: utils.getSuffix($scope, 0),
              },
              yaxis3: {
                title: 'Trend',
                domain: [0.5, 0.74],
                anchor: 'x3',
                showgrid: $scope.layout.props.yScale,
                tickformat: utils.getTickFormat($scope, 0),
                tickprefix: utils.getPrefix($scope, 0),
                ticksuffix: utils.getSuffix($scope, 0),
              },
              yaxis4: {
                title: 'Observed',
                domain: [0.74, 1],
                anchor: 'x4',
                showgrid: $scope.layout.props.yScale,
                tickformat: utils.getTickFormat($scope, 0),
                tickprefix: utils.getPrefix($scope, 0),
                ticksuffix: utils.getSuffix($scope, 0),
              },
              dragmode: 'select',
              margin: {
                r: ($scope.layout.props.yAxisPosition == 'right') ? $scope.layout.props.marginRight + 70 : $scope.layout.props.marginRight,
                l: ($scope.layout.props.yAxisPosition == 'left') ? $scope.layout.props.marginLeft + 70 : $scope.layout.props.marginLeft,
                t: ($scope.layout.props.xAxisPosition == 'top') ? $scope.layout.props.marginTop + 70 : $scope.layout.props.marginTop,
                b: ($scope.layout.props.xAxisPosition == 'bottom') ? $scope.layout.props.marginBottom + 70 : $scope.layout.props.marginBottom,
              },
            }
            chart = lineChart.draw($scope, chartData, `aat-chart-${$scope.extId}`, customOptions);
          } else {
            chart = lineChart.draw($scope, chartData, `aat-chart-${$scope.extId}`, null);
          }
          lineChart.setEvents(chart, $scope, app);
        }
        return defer.resolve();
      });
      return defer.promise;
    },
  };
});
