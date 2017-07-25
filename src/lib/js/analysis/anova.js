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
      const dimensions = [{ qDef: { qFieldDefs: [dimension] } }];

      // Set definitions for dimensions and measures
      const params = `${utils.validateMeasure(layout.props.measures[0])} as mea0, ${utils.validateDimension(layout.props.dimensions[1])} as dim1`;
      const meaList = 'q$mea0 ~ q$dim1';
      $scope.dataTitle = utils.validateDimension(layout.props.dimensions[1]);

      // Set first and seasonal differences to acf and pacf
      const dataType = 'NS';

      const measures = [
        {
          qDef: {
            qLabel: 'Results',
            qDef: `R.ScriptEvalExStr('${dataType}','library(jsonlite); res<-summary(aov(${meaList})); json<-toJSON(res[[1]]); json;', ${params})`,
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

      const dimension = utils.validateDimension(layout.props.dimensions[1]);
      const requestPage = [{
        qTop: 0,
        qLeft: 0,
        qWidth: 6,
        qHeight: 1,
      }];

      $scope.backendApi.getData(requestPage).then((dataPages) => {
        const qMatrix = dataPages[0].qMatrix;
        const measureInfo = $scope.layout.qHyperCube.qMeasureInfo;

        // Display error when all measures' grand total return NaN.
        if (dataPages[0].qMatrix[0][1].qText.length === 0 || dataPages[0].qMatrix[0][1].qText == '-') {
          utils.displayConnectionError($scope.extId);
        } else {
          const result = JSON.parse(dataPages[0].qMatrix[0][1].qText);

          let html = `
            <h2>ANOVA - Single factor</h2>
            <table>
              <thead>
                <tr>
                  </th><th><th>Df</th><th>Sum Sq</th><th>Mean Sq</th><th>F value</th><th>Pr(>F)</th><th></th>
                </tr>
              </thead>
              </tbody>
         `;

          const items = [dimension, 'Residuals'];

          for (let i = 0; i < items.length; i++) {
            html += `
              <tr><td>${items[i]}</td><td>${result[i].Df}</td><td>${result[i]['Sum Sq']}</td><td>${result[i]['Mean Sq']}</td><td>${(typeof result[i]['F value'] != 'undefined') ? result[i]['F value'] : ''}</td><td>${(typeof result[i]['Pr(>F)'] != 'undefined') ? result[i]['Pr(>F)'] : ''}</td>
              <td>${(result[i]['Pr(>F)'] < 0.001) ? '<span class="lui-icon  lui-icon--star"></span><span class="lui-icon  lui-icon--star"></span><span class="lui-icon  lui-icon--star"></span>' : (result[i]['Pr(>F)'] < 0.01) ? '<span class="lui-icon  lui-icon--star"></span><span class="lui-icon  lui-icon--star"></span>' : (result[i]['Pr(>F)'] < 0.05) ? '<span class="lui-icon  lui-icon--star"></span>' : (result[i]['Pr(>F)'] < 0.1) ? '.' : ''}</td>
              </tr>`;
          }


          html += `
              </tbody>
            </table>
            <div>Signif. codes: 0 ‘***’ 0.001 ‘**’ 0.01 ‘*’ 0.05 ‘.’ 0.1 ‘ ’ 1</div>
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
