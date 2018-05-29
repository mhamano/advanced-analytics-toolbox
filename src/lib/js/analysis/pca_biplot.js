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

      // Set definitions for dimensions and measures
      const dimension = utils.validateDimension(layout.props.dimensions[0]);
      const dimensions = [{
        qNullSuppression: true,
        qDef: {
          qFieldDefs: [dimension]
        },
      }];

      const meaLen = layout.props.measures.length;
      $scope.rowsLabel = [utils.validateMeasure(layout.props.measures[0])]; // Label for dimension values
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

          $scope.rowsLabel.push(utils.validateMeasure(layout.props.measures[i]));
        }
      }

      // Debug mode - set R dataset name to store the q data.
      utils.displayDebugModeMessage(layout.props.debugMode);
      const saveRDataset = utils.getDebugSaveDatasetScript(layout.props.debugMode, 'debug_pca_biplot.rda');

      const defMea1 = `R.ScriptEvalExStr('${dataType}','${saveRDataset} library(jsonlite); pca_result<-prcomp(data.frame(${meaList}), scale = TRUE); json<-toJSON(list(summary(pca_result)$x, summary(pca_result)$rotation)); json;',${params})`;

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
        qHeight: 1500,
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

          // Get dimension
          const elemNum = [];
          const dim1 = [];

          $.each(dataPages[0].qMatrix, (key, value) => {
            elemNum.push(value[0].qElemNumber);
            dim1.push(value[0].qText);
          });

          // Get PCA result
          const result = JSON.parse(dataPages[0].qMatrix[0][1].qText);
          const x = result[0];
          const rotation = result[1];

          // Draw plot for pca_result$x
          const mea1 = [];
          const mea2 = [];
          const allMea1 = [];
          const allMea2 = [];

          $.each(x, (key, value) => {
            mea1.push(value[0]);
            mea2.push(value[1]);
            allMea1.push(Math.abs(value[0]));
            allMea2.push(Math.abs(value[1]));
          });

          const maxValMea1 = Math.max.apply(null, allMea1);
          const maxValMea2 = Math.max.apply(null, allMea2);

          const chartData = [
            {
              x: mea1,
              y: mea2,
              xaxis: 'x2',
              yaxis: 'y2',
              text: dim1,
              elemNum,
              name: dimension,
              mode: 'markers',
              type: 'scatter',
              marker: {
                color: (layout.props.colors) ? `rgba(${palette[3]},0.8)` : `rgba(${utils.getConversionRgba(layout.props.colorForMain.color, 0.8)})`,
                size: layout.props.bubbleSize,
              },
            },
          ];

          // Draw annotation line for pca_result$rotation
          const arrowX = [];
          const arrowY = [];
          const allArrowX = [];
          const allArrowY = [];

          $.each(rotation, (key, value) => {
            arrowX.push(value[0]);
            arrowY.push(value[1]);
            allArrowX.push(Math.abs(value[0]));
            allArrowY.push(Math.abs(value[1]));
          });

          const maxValArrowX = Math.max.apply(null, allArrowX);
          const maxValArrowY = Math.max.apply(null, allArrowY);

          const customOptions = {
            xaxis: {
              title: 'PC1',
              titlefont: {color: 'rgb(148, 103, 189)'},
              showgrid: $scope.layout.props.xScale,
              tickfont: {color: 'rgb(148, 103, 189)'},
              overlaying: 'x',
              side: 'bottom',
              range: [(maxValArrowX) * -1 * 1.1, maxValArrowX * 1.1],
            },
            yaxis: {
              title: 'PC2',
              showgrid: $scope.layout.props.yScale,
              titlefont: {color: 'rgb(148, 103, 189)'},
              tickfont: {color: 'rgb(148, 103, 189)'},
              overlaying: 'y',
              side: 'left',
              range: [(maxValArrowY) * -1 * 1.1, maxValArrowY * 1.1],
            },
            xaxis2: {
              titlefont: {color: 'rgb(148, 103, 189)'},
              tickfont: {color: 'rgb(148, 103, 189)'},
              overlaying: 'x',
              side: 'top',
              range: [(maxValMea1) * -1 * 1.1, maxValMea1 * 1.1],
            },
            yaxis2: {
              titlefont: {color: 'rgb(148, 103, 189)'},
              tickfont: {color: 'rgb(148, 103, 189)'},
              overlaying: 'y',
              side: 'right',
              range: [(maxValMea2) * -1 * 1.1, maxValMea2 * 1.1],
            },
            margin: {
              r: ($scope.layout.props.yAxisPosition == 'right') ? $scope.layout.props.marginRight + 70 : $scope.layout.props.marginRight,
              l: ($scope.layout.props.yAxisPosition == 'left') ? $scope.layout.props.marginLeft + 70 : $scope.layout.props.marginLeft,
              t: ($scope.layout.props.xAxisPosition == 'top') ? $scope.layout.props.marginTop + 70 : $scope.layout.props.marginTop,
              b: ($scope.layout.props.xAxisPosition == 'bottom') ? $scope.layout.props.marginBottom + 70 : $scope.layout.props.marginBottom,
            },
            annotations: [
            ],
          }

          for (let i = 0; i < $scope.rowsLabel.length; i++) {
            customOptions.annotations.push(
              {
                x: arrowX[i],
                y: arrowY[i],
                xref: 'x',
                yref: 'y',
                ax: 0,
                ay: 0,
                axref: 'x',
                ayref: 'y',
                showarrow: true,
                arrowcolor: (layout.props.colors) ? `rgba(${palette[7]}, 1)` : `rgba(${utils.getConversionRgba(layout.props.colorForSub.color, 1)})`,
                arrowhead: 3,
              },
              {
                x: arrowX[i],
                y: arrowY[i],
                text: $scope.rowsLabel[i],
                font: {
                  color: (layout.props.colors) ? `rgba(${palette[7]}, 1)` : `rgba(${utils.getConversionRgba(layout.props.colorForSub.color, 1)})`,
                },
                showarrow: false,
              }
            );
          }


          // Set HTML element for chart
          $(`.advanced-analytics-toolsets-${$scope.extId}`).html(`<div id="aat-chart-${$scope.extId}" style="width:100%;height:100%;"></div>`);

          const chart = bubbleChart.draw($scope, app, chartData, `aat-chart-${$scope.extId}`, customOptions);
          bubbleChart.setEvents(chart, $scope, app);
        }
        return defer.resolve();
      });
      return defer.promise;
    },
  };
});
