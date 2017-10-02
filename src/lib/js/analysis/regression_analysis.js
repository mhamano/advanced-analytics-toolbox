define([
  '../util/utils',
  'ng!$q',
], (utils, $q) => {
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
      $scope.rowsLabel = ['(Intercept)', (layout.props.measures[1].label != '') ? layout.props.measures[1].label : utils.validateMeasure(layout.props.measures[0]) ]; // Label for dimension values
      let params = `${utils.validateMeasure(layout.props.measures[0])} as mea0, ${utils.validateMeasure(layout.props.measures[1])} as mea1`;
      let meaList = 'q$mea0 ~ q$mea1';
      let dataType = 'NN';

      for (let i = 2; i < meaLen; i++) {
        const mea = utils.validateMeasure(layout.props.measures[i]);
        if (mea.length > 0) {
          const param = `,${mea} as mea${i}`;
          params += param;
          meaList += ` + q$mea${i}`;
          dataType += 'N';

          $scope.rowsLabel.push(utils.validateMeasure(layout.props.measures[i]));
        }
      }

      // Debug mode - set R dataset name to store the q data.
      utils.displayDebugModeMessage(layout.props.debugMode);
      const saveRDataset = utils.getDebugSaveDatasetScript(layout.props.debugMode, 'debug_regression_analysis.rda');

      const defMea1 = `R.ScriptEvalExStr('${dataType}','${saveRDataset} library(jsonlite); lm_result <- lm(${meaList});lm_summary <- summary(lm_result);
      json <- toJSON(list(coef(lm_summary)[,"Estimate"], coef(lm_summary)[,"Std. Error"], coef(lm_summary)[,"t value"], coef(lm_summary)[,"Pr(>|t|)"],
      as.double(summary(lm_result$residuals)), summary(lm_result)$sigma, summary(lm_result)$df, lm_summary$r.squared, lm_summary$adj.r.squared,
      summary(lm_result)$fstatistic, extractAIC(lm_result)[2])); json;',${params})`;

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
        qWidth: 2,
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

          const result = JSON.parse(dataPages[0].qMatrix[0][1].qText);

          const estimate = result[0];
          const stdError = result[1];
          const tValue = result[2];
          const pr = result[3];
          const minPr = Math.max.apply(null, pr);

          const residuals = result[4];

          const sigma = result[5];
          const df = result[6];

          const rSquared = result[7];
          const adjRSquared = result[8];

          const fstatistic = result[9];
          const aic = result[10];

          // Set table header
          let html = `
            <h2>Residuals:</h2>
            <table class="simple">
              <thead>
                <tr>
                  <th>Min</th><th>1Q</th><th>Median</th><th>3Q</th><th>Max</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${residuals[0]}</td><td>${residuals[1]}</td><td>${residuals[2]}</td><td>${residuals[4]}</td><td>${residuals[5]}</td>
                </tr>
             </tbody>
            </table>

            <h2>Coefficients:</h2>
            <table class="simple">
              <thead>
                <tr>
                  <th></th><th>Estimate</th><th>Std.Error</th><th>t value</th><th>Pr(>|t|)</th><th>Signif</th>
                </tr>
              </thead>
              <tbody>
          `;

          // Set regression analysis results to table
          for (let i = 0; i < $scope.rowsLabel.length; i++) {
            html += `<tr><td>${$scope.rowsLabel[i]}</td><td>${estimate[i]}</td><td>${stdError[i]}</td><td>${tValue[i]}</td><td>${pr[i]}</td>
                      <td>${(pr[i] < 0.001) ? '<span class="lui-icon  lui-icon--star"></span><span class="lui-icon  lui-icon--star"></span><span class="lui-icon  lui-icon--star"></span>' : (pr[i] < 0.01) ? '<span class="lui-icon  lui-icon--star"></span><span class="lui-icon  lui-icon--star"></span>' : (pr[i] < 0.05) ? '<span class="lui-icon  lui-icon--star"></span>' : (pr[i] < 0.1) ? '.' : ''}</td>
                    </tr>`;
          }

          // Set table footer and other results
          html += `
              </tbody>
            </table>
            <div>Signif. codes: 0 ‘***’ 0.001 ‘**’ 0.01 ‘*’ 0.05 ‘.’ 0.1 ‘ ’ 1</div>

            <h2>Others:</h2>
            <table class="simple">
              <thead>
                <tr>
                  <th>Item</th><th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Residual standard error</td><td>${sigma[0]} on ${df[1]} degrees of freedom</td></tr>
                <tr><td>Multiple R-squared</td><td>${rSquared[0]}</td></tr>
                <tr><td>Adjusted R-squared</td><td>${adjRSquared[0]}</td></tr>
                <tr><td>F-statistic</td><td> ${fstatistic[0]} on ${fstatistic[1]} and ${fstatistic[2]} DF,  p-value: < ${minPr}</td></tr>
                <tr><td>AIC</td><td>${aic[0]}</td></tr>
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
