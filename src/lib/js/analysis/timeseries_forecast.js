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

      // Set definitions for dimensions and measures
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

      let expression = '';
      if (layout.props.autoARIMA) {
        expression = `fit<-auto.arima(data);`;
      } else {
        expression = `fit<-arima(data, order=c(${layout.props.AROrder},${layout.props.DegreeOfDifferencing},${layout.props.MAOrder})
                      ,seasonal=list(order=c(${layout.props.SeasonalAROrder},${layout.props.SeasonalDegreeOfDifferencing},${layout.props.SeasonalMAOrder}), period=${layout.props.frequency}));`;
      }

      let frequency = '';
      if (layout.props.frequency > 0) {
        frequency = `,frequency=${layout.props.frequency}`;
      }

      // Debug mode - set R dataset name to store the q data.
      utils.displayDebugModeMessage(layout.props.debugMode);
      const saveRDataset = utils.getDebugSaveDatasetScript(layout.props.debugMode, 'debug_timeseries_forecast.rda');

      const defMea1 = `R.ScriptEvalExStr('N', '${saveRDataset} library(jsonlite);library(dplyr);library(forecast);data<-ts(na.omit(q$Measure) ${frequency});${expression}
      res<-forecast(fit, level=${layout.props.confidenceLevel}, h=${layout.props.forecastingPeriods});
      json<-toJSON(list(as.double(res$mean),as.double(res$upper),as.double(res$lower),arimaorder(fit))); json;', ${measure} as Measure)`;

      // Debug mode - display R Scripts to console
      utils.displayRScriptsToConsole(layout.props.debugMode, [defMea1]);

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
          const upper = result[1];
          const lower = result[2];
          const arimaorder = result[3];
          // const for reference line
          const mylimit = layout.props.limit;

          // Chart mode
          if (typeof $scope.layout.props.displayTable == 'undefined' || $scope.layout.props.displayTable == false) {
            const datasets = {};

            // Store actual values to datasets
            const dataLength = dataPages[0].qMatrix.length;
            const elemNum = [];
            const dim1 = []; // Dimension
            const mea1 = []; // Actual values

            $.each(dataPages[0].qMatrix, (key, value) => {
              elemNum.push(value[0].qElemNumber);
              dim1.push(value[0].qText);
              mea1.push(value[1].qNum);
            });
            datasets.elemNum = elemNum;
            datasets.dim1 = dim1;
            datasets.mea1 = mea1;

            // Store forecast values to datasets
            const mea2 = new Array(dataLength); // Forecast (mean)
            const mea3 = new Array(dataLength); // Forecast (upper)
            const mea4 = new Array(dataLength); // Forecast (lower)
            const mea5 = new Array(dataLength); // Forecast - Reference Line

            for (let i = 0; i < layout.props.forecastingPeriods; i++) {
              datasets.dim1.push(`+${i + 1}`); // Forecast period is displayed as +1, +2, +3...
              mea2.push(mean[i]);
              mea3.push(upper[i]);
              mea4.push(lower[i]);
              mea5.push(mylimit);
            }
            datasets.mea2 = mea2;
            datasets.mea3 = mea3;
            datasets.mea4 = mea4;
            datasets.mea5 = mea5;

            // Calculate ARIMA order
            let arima = '';
            if (0 < arimaorder.length && arimaorder.length <= 3) {
              arima = `(${arimaorder[0]},${arimaorder[1]},${arimaorder[2]})`;
            } else if (arimaorder.length <= 6) {
              arima = `(${arimaorder[0]},${arimaorder[1]},${arimaorder[2]})(${arimaorder[3]},${arimaorder[4]},${arimaorder[5]})`;
            } else if (6 < arimaorder.length) {
              arima = `(${arimaorder[0]},${arimaorder[1]},${arimaorder[2]})(${arimaorder[3]},${arimaorder[4]},${arimaorder[5]})[${arimaorder[6]}]`;
            } else {
              // do nothing
            }

            const chartData = [
              {
                x: datasets.dim1,
                y: datasets.mea1,
                elemNum: datasets.elemNum,
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
              },
              {
                x: datasets.dim1,
                y: datasets.mea2,
                name: 'Fit',
                mode: 'lines+markers',
                marker: {
                  color: (layout.props.colors) ? `rgba(${palette[7]},1)` : `rgba(${utils.getConversionRgba(layout.props.colorForSub.color, 1)})`,
                  size: (layout.props.datapoints) ? layout.props.pointRadius : 1,
                },
                line: {
                  width: layout.props.borderWidth,
                  //color: `rgba(${palette[layout.props.colorForSub]},1)`,
                },
              },
              {
                x: datasets.dim1,
                y: datasets.mea3,
                name: 'Upper',
                fill: 'tonexty',
                fillcolor: (layout.props.colors) ? `rgba(${palette[7]},0.3)` : `rgba(${utils.getConversionRgba(layout.props.colorForSub.color, 0.3)})`,
                type: 'scatter',
                mode: 'none',
              },
              {
                x: datasets.dim1,
                y: datasets.mea4,
                name: 'Lower',
                fill: 'tonexty',
                fillcolor: (layout.props.colors) ? `rgba(${palette[7]},0.3)` : `rgba(${utils.getConversionRgba(layout.props.colorForSub.color, 0.3)})`,
                type: 'scatter',
                mode: 'none',
              },
            //Reference line
            {
              x: datasets.dim1,
              y: datasets.mea5,
              name: layout.props.limitlabel,
              mode: 'lines',
              marker: {
                color: `rgba(${utils.getConversionRgba(layout.props.limitcolor.color, 1)})`,
                size: (layout.props.datapoints) ? layout.props.pointRadius : 1,
              },
              line: {
                dash: layout.props.limitstyle,
                width: layout.props.limitwidth,
               },
           },
            ];

            const customOptions = {
              xaxis: {
                type: 'category',
                title: $scope.layout.props.xLabelsAndTitle ? $scope.layout.props.dimensions[0].label : '',
                showgrid: $scope.layout.props.xScale,
                side: $scope.layout.props.xAxisPosition,
              },
            };

            if (layout.props.displayARIMAParams) {
              // Display ARIMA parameters
              $(`.advanced-analytics-toolsets-${$scope.extId}`)
              .html(`
                <div style="width:100%;height:5%;text-align:right;">ARIMA${arima}</div>
                <div id="aat-chart-${$scope.extId}" style="width:100%;height:95%;"></div>
              `);
            } else {
              // Hide ARIM parameters
              $(`.advanced-analytics-toolsets-${$scope.extId}`).html(`<div id="aat-chart-${$scope.extId}" style="width:100%;height:100%;"></div>`);
            }
            const chart = lineChart.draw($scope, chartData, `aat-chart-${$scope.extId}`, customOptions);
            lineChart.setEvents(chart, $scope, app);

          // Table display mode
          } else {
            // Get locale info
            const locale = utils.getLocale($scope, 0);

            // Get number format
            const numberFormat = utils.getNumberFormat($scope, 0);

            // Store actual values to datasets
            const dataLength = dataPages[0].qMatrix.length;
            const dataset = [];

            $.each(dataPages[0].qMatrix, (key, value) => {
              dataset.push([
                value[0].qElemNumber,
                value[0].qText,
                locale.format(numberFormat)(value[1].qNum).replace(/G/, 'B'),
                '',
                '',
                '',
              ]);
            });

            for (let i = 0; i < layout.props.forecastingPeriods; i++) {
              dataset.push([
                '',
                `+${i + 1}`, // Forecast period is displayed as +1, +2, +3...
                '',
                locale.format(numberFormat)(mean[i]).replace(/G/, 'B'),
                locale.format(numberFormat)(upper[i]).replace(/G/, 'B'),
                locale.format(numberFormat)(lower[i]).replace(/G/, 'B'),
              ]);
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
