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

      $scope.dataTitle = '';
      let params = '';

      const analysisTypeId = layout.props.analysisTypeId;

      switch (analysisTypeId) {
        case 3:
          $scope.dataTitle = 'Two sample t-test:';
          params = ',var.equal=T';
          break;
        case 4:
          $scope.dataTitle = 'Welch two sample t-test:';
          params = ',var.equal=F';
          break;
        case 5:
          $scope.dataTitle = 'Paired t-test:';
          params = ',paired=T';
          break;
        default:
          break;
      }

      const measure1 = utils.validateMeasure(layout.props.measures[0]);
      const measure2 = utils.validateMeasure(layout.props.measures[1]);

      // Debug mode - set R dataset name to store the q data.
      utils.displayDebugModeMessage(layout.props.debugMode);
      const saveRDataset = utils.getDebugSaveDatasetScript(layout.props.debugMode, 'debug_t_test.rda');

      const defMea1 = `R.ScriptEvalExStr('NN','${saveRDataset} library(jsonlite); res<-t.test(q$SampleA, q$SampleB, conf.level=${layout.props.confidenceLevel}${params}); json<-toJSON(list(as.double(res$statistic),as.double(res$parameter),res$p.value,res$conf.int[1],res$conf.int[2],as.double(res$estimate))); json;', ${measure1} as SampleA, ${measure2} as SampleB)`;

      // Debug mode - display R Scripts to console
      utils.displayRScriptsToConsole(layout.props.debugMode, [defMea1]);

      const measures = [
        {
          qDef: {
            qLabel: 'Results',
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
        qWidth: 6,
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

          const t = result[0][0];
          const df = result[1][0];
          const pValue = result[2][0];
          const lower = result[3][0];
          const upper = result[4][0];
          const estimates = result[5];

          let html = `
            <h2>${$scope.dataTitle}</h2>
            <table class="simple">
              <thead>
                <tr>
                  <th>Item</th><th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>t</td><td>${t}</td></tr>
                <tr><td>df</td><td>${df}</td></tr>
                <tr><td>p-value</td><td>${pValue}</td></tr>
                <tr><td>${layout.props.confidenceLevel * 100}% confidence interval</td><td>${lower}, ${upper}</td></tr>
          `;
          const analysisTypeId = layout.props.analysisTypeId;

          if (analysisTypeId === 3 || analysisTypeId === 4) {
            html += `<tr><td>Sample estimates</td><td>mean of x: ${estimates[0]}, mean of y: ${estimates[1]}</td></tr>`;
          } else if (analysisTypeId === 5) {
            html += `<tr><td>Sample estimates</td><td>mean of the differences: ${estimates[0]}</td></tr>`;
          } else {
            // do nothing
          }

          html += `</tbody></table>
          <div>* alternative hypothesis: true difference in means is not equal to 0</div>`;

          // Set HTML element for chart
          $(`.advanced-analytics-toolsets-${$scope.extId}`).html(html);
        }
        return defer.resolve();
      });
      return defer.promise;
    },
  };
});
