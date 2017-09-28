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
      const saveRDataset = utils.getDebugSaveDatasetScript(layout.props.debugMode, 'debug_pca.rda');

      const defMea1 = `R.ScriptEvalExStr('${dataType}','${saveRDataset} library(jsonlite); pca_result<-prcomp(data.frame(${meaList}), center = TRUE, scale = TRUE); json<-toJSON(list(summary(pca_result)$importance, summary(pca_result)$rotation)); json;',${params})`;

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
          const importance = result[0];
          const rotation = result[1];

          // Table header
          let header = '<table class="simple"><thead><tr><th></th>';
          for(let i = 0; i < importance[0].length; i++) {
            header += `<th>PC${i + 1}</th>`;
          }
          header += '</tr></thead><tbody>';

          // Table body for importance
          let importanceBody = '';
          $.each(importance, (key, value) => {
            importanceBody += '<tr><td>'
            importanceBody += (key == 0) ? 'Standard deviation' : (key == 1) ? 'Proportion of Variance' : (key == 2) ? 'Cumulative Proportion' : '';
            importanceBody += '</td>';
            $.each(value, (subKey, subValue) => {
              importanceBody += `<td>${subValue}</td>`;
            });
            importanceBody += '</tr>';
          });

          // Table body for rotation
          let rotationBody = '';
          $.each(rotation, (key, value) => {
            rotationBody += `<tr><td>${$scope.rowsLabel[key]}`;
            $.each(value, (subKey, subValue) => {
              rotationBody += `<td>${subValue}</td>`;
            });
            rotationBody += '</tr>';
          });

          // Set table footer and other results
          const footer = '</tbody></table>';

          const importanceHTML = '<h2>Importance of components:</h2>' + header + importanceBody + footer;
          const rotationHTML = '<h2>Rotation:</h2>' + header + rotationBody + footer;
          const html = importanceHTML + rotationHTML;

          // Set HTML element for chart
          $(`.advanced-analytics-toolsets-${$scope.extId}`).html(html);
        }
        return defer.resolve();
      });
      return defer.promise;
    },
  };
});
