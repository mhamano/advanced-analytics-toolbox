define([
  '../chart/tree_chart',
  '../../vendor/d3.min',
  '../util/utils',
  'ng!$q',
], (tree, d3, utils, $q) => {
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
      let params = `${utils.validateMeasure(layout.props.measures[0])} as mea0, ${utils.validateMeasure(layout.props.measures[1])} as mea1`;
      let meaList = 'mea0 ~ mea1';
      let dataType = 'SS';

      // Array to replace param names (q$meaX) to a measure label on tree chart
      $scope.paramNames = ['mea0', 'mea1'];
      $scope.measureLabels = [layout.props.measures[0].label, layout.props.measures[1].label];

      for (let i = 2; i < meaLen; i++) {
        const mea = utils.validateMeasure(layout.props.measures[i]);
        if (mea.length > 0) {
          const param = `,${mea} as mea${i}`;
          params += param;
          meaList += ` + mea${i}`;
          dataType += 'S';

          $scope.paramNames.push(`mea${i}`);
          $scope.measureLabels.push(layout.props.measures[i].label);
        }
      }

      // Split dataset into training and test datasets
      const splitData = utils.splitData(true, layout.props.splitPercentage, meaLen);

      // type in predict method for regression tree is 'vector' not 'anova'
      let predictType = 'class';
      let MAE = ''; // Calculate mean absolute error for regression tree
      if (layout.props.rpartMethod === 'anova') {
        predictType = 'vector';
        MAE = ',mean(abs(test_data$mea0-pred))'
      }

      // Debug mode - set R dataset name to store the q data.
      utils.displayDebugModeMessage(layout.props.debugMode);
      const saveRDataset = utils.getDebugSaveDatasetScript(layout.props.debugMode, 'debug_decision_tree_predict.rda');

      const defMea1 = `R.ScriptEvalExStr('${dataType}','${saveRDataset} library(rpart);library(jsonlite);set.seed(10);
              q<-lapply(q, function(x){ ifelse(!is.na(as.numeric(x)), as.numeric(x), x) }); ${splitData}
              res<-rpart(${meaList}, data=training_data, method="${layout.props.rpartMethod}", control=list(minsplit=${layout.props.minSplit}, minbucket=${layout.props.minBucket}, cp=${layout.props.cp}, maxdepth=${layout.props.maxDepth}));
              pred <- predict(res, test_data, type="${predictType}"); conf.mat <- table(pred, test_data$mea0);
              json<-toJSON(list(list(attributes(conf.mat)$dimnames[[1]], attributes(conf.mat)$dimnames[[2]]), unname(split(conf.mat, seq(nrow(conf.mat)))), c(length(training_data$mea0), length(test_data$mea0))${MAE})); json;',${params})`;

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

          const rowLabels = result[0][0];
          const columnLabels = result[0][1];
          const data = result[1];
          const numOfRows = result[2];

          // Helper to round Number
          const roundWithDecimals = (n, decimals) => {
            return Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals);
          };

          // Set table header for cunfusion matrix
          let html = `
            <h2>Confusion matrix:</h2>
            <table class="simple" >
              <thead>
                <tr>
                  <th rowspan="2" style="border-right:none;"></th><th rowspan="2"></th><th colspan="${columnLabels.length + 1}" style="text-align:center">Actual class</th>
                </tr>
                <tr>
                  `;

          for (let i = 0; i < columnLabels.length; i++) {
            html += `<th>${columnLabels[i]}</th>`;
          }

          html += `<th>Precision</th></tr>
            </thead>
            <tbody>`;

          // Set table body for cunfusion matrix
          let accuracyDenominator = 0;
          let accuracyNumerator = 0;
          const precisions = [];
          const recallDenominator = [];
          const recallNumerator = [];
          const recalls = [];

          // Initialize recallDenominator and recallNumerator with zeros
          for (let j = 0; j < columnLabels.length; j++) {
            recallDenominator[j] = 0;
            recallNumerator[j] = 0;
          }

          // Repeat evey row
          for (let i = 0; i < rowLabels.length; i++) {
            if (i === 0) {
              html += `<tr><td rowspan="${rowLabels.length + 1}" style="font-weight:bold; white-space:nowrap; width:20px">Predicted class</td><td style="font-weight:bold">${rowLabels[i]}</td>`;
            } else {
              html += `<tr><td style="font-weight:bold">${rowLabels[i]}</td>`;
            }

            let precisionDenominator = 0;
            let precisionNumerator = 0;
            // Repease evey column
            for (let j = 0; j < columnLabels.length; j++) {
              accuracyNumerator += data[i][j];
              precisionNumerator += data[i][j];
              recallNumerator[j] += data[i][j];
              if (rowLabels[i] === columnLabels[j]) {
                accuracyDenominator += data[i][j];
                precisionDenominator += data[i][j];
                recallDenominator[j] += data[i][j];
              }
              html += `<td>${data[i][j]}</td>`;
            }
            precisions.push(precisionDenominator / precisionNumerator);
            // Set precisions
            if (layout.props.rpartMethod === 'class') {
              html += `<td>${roundWithDecimals((precisionDenominator / precisionNumerator) * 100, 3)}%</td></tr>`;
            } else {
              html += '<td>-</td></tr>';
            }
          }

          // Set recalls
          html += '<tr><td style="font-weight:bold;">Recall</td>';
          for (let j = 0; j < recallDenominator.length; j++) {
            if (layout.props.rpartMethod === 'class') {
              html += `<td>${roundWithDecimals((recallDenominator[j] / recallNumerator[j]) * 100, 3)}%</td>`;
            } else {
              html += '<td>-</td>';
            }
            recalls.push(recallDenominator[j] / recallNumerator[j]);
          }
          html += '<td></td></tr>';

          html += `</tbody>
                  </table>`;

          // Helpers for calculating performance measures
          const sum = (arr) => {
            return arr.reduce((prev, current, i, arr) => {
              return prev + current;
            });
          };

          const average = (arr, fn) => {
            return sum(arr, fn) / arr.length;
          };

        if (layout.props.rpartMethod === 'anova') {
          // Set performance measures
          html += `<h2>Performance measures:</h2>
                  <table class="simple" style="table-layout:fixed;">
                    <thead>
                      <tr>
                        <th>Measures</th><th>Results</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>Mean absolute error (MAE)</td><td>${result[3]}</td></tr>
                    </tbody>
                  </table>
                `;

        } else {
          // Set performance measures
          html += `<h2>Performance measures:</h2>
                  <table class="simple" style="table-layout:fixed;">
                    <thead>
                      <tr>
                        <th>Measures</th><th>Results</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>Accuracy</td><td>${(layout.props.rpartMethod === 'class') ? roundWithDecimals((accuracyDenominator / accuracyNumerator) * 100, 3) + '%' : '-'}</td></tr>
                      <tr><td>Average precision</td><td>${(layout.props.rpartMethod === 'class') ? roundWithDecimals((average(precisions) * 100), 3) + '%' : '-'}</td></tr>
                      <tr><td>Average recall</td><td>${(layout.props.rpartMethod === 'class') ? roundWithDecimals(average(recalls) * 100, 3) + '%' : '-'}</td></tr>
                    </tbody>
                  </table>
                `;
          }


          // Set number of rows
          html += `<h2>Number of rows:</h2>
                  <table class="simple" style="table-layout:fixed;">
                    <thead>
                      <tr>
                        <th>Datasets</th><th>Number of rows</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>Training data</td><td>${numOfRows[0]}</td></tr>
                      <tr><td>Test data</td><td>${numOfRows[1]}</td></tr>
                      <tr><td>Total</td><td>${numOfRows[0] + numOfRows[1]}</td></tr>
                    </tbody>
                  </table>
                `;

          // Set HTML element for chart
          $(`.advanced-analytics-toolsets-${$scope.extId}`).html(html);
        }
        return defer.resolve();
      });
      return defer.promise;
    },
  };
});
