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

      // Set definitions for dimensions and measures
      const dimensions = [{ qDef: { qFieldDefs: [dimension] } }];
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

      const measures = [
        {
          qDef: {
            qDef: measure,
          },
        },
        {
          qDef: {
            qDef: `R.ScriptEvalExStr('N', 'library(jsonlite);library(dplyr);library(forecast);data<-ts(na.omit(q$Measure) ${frequency});${expression}
            res<-forecast(fit, level=${layout.props.confidenceLevel}, h=${layout.props.forecastingPeriods});
            json<-toJSON(list(as.double(res$mean),as.double(res$upper),as.double(res$lower),arimaorder(fit))); json;', ${measure} as Measure)`,
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
        if (dataPages[0].qMatrix[0][1].qText.length === 0 || dataPages[0].qMatrix[0][1].qText == '-') {
          utils.displayConnectionError($scope.extId);
        } else {
          const palette = utils.getDefaultPaletteColor();

          const result = JSON.parse(dataPages[0].qMatrix[0][2].qText);

          const mean = result[0];
          const upper = result[1];
          const lower = result[2];
          const arimaorder = result[3];

          const datasets = {};

          // Store actual values to datasets
          const dataLength = dataPages[0].qMatrix.length;
          const dim1 = []; // Dimension
          const mea1 = []; // Actual values

          $.each(dataPages[0].qMatrix, (key, value) => {
            dim1.push(value[0].qText);
            mea1.push(value[1].qNum);
          });

          datasets.dim1 = dim1;
          datasets.mea1 = mea1;

          // Store forecast values to datasets
          const mea2 = new Array(dataLength); // Forecast (mean)
          const mea3 = new Array(dataLength); // Forecast (upper)
          const mea4 = new Array(dataLength); // Forecast (lower)

          for (let i = 0; i < layout.props.forecastingPeriods; i++) {
            datasets.dim1.push(`+${i + 1}`);
            mea2.push(mean[i]);
            mea3.push(upper[i]);
            mea4.push(lower[i]);
          }
          datasets.mea2 = mea2;
          datasets.mea3 = mea3;
          datasets.mea4 = mea4;

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
              x: datasets.dim1,
              y: datasets.mea2,
              name: 'Fit',
              mode: 'lines+markers',
              marker: {
                color: (layout.props.colors) ? `rgba(${palette[7]},1)` : `rgba(${palette[layout.props.colorForSub]},1)`,
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
              fillcolor: `rgba(${palette[layout.props.colorForSub]},0.3)`,
              type: 'scatter',
              mode: 'none',
            },
            {
              x: datasets.dim1,
              y: datasets.mea4,
              name: 'Lower',
              fill: 'tonexty',
              fillcolor: `rgba(${palette[layout.props.colorForSub]},0.3)`,
              type: 'scatter',
              mode: 'none',
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
        }
        return defer.resolve();
      });
      return defer.promise;
    },
  };
});
