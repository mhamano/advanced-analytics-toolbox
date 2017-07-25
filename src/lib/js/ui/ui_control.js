define([
  '../analysis/analysis',
  './ui_element',
  './ui_fieldlist',
  './ui_analysistype',
  './ui_dimension',
  './ui_measure',
], (analysis, uiElement, uiFieldList, uiAnalysistype, uiDimension, uiMeasure) => {
  return {
    createHtmlElements($scope, $compile, app) {
      const extId = $scope.layout.qInfo.qId;

      if ($scope.screen == 1) {

        // Filter the selected analysis type
        $scope.selectedAnalysisType = analysis.analysisTypes.filter((d) => {
          return d.id === $scope.layout.props.analysisTypeId;
        });

        // Set if selected analysis type allows to add measures
        $scope.allowAddMea = $scope.selectedAnalysisType[0].allowAddMea;

        // Set minDims and minmMeas.
        $scope.minDims = $scope.selectedAnalysisType[0].minDims;
        $scope.minMeas = $scope.selectedAnalysisType[0].minMeas;

        // Set file name
        $scope.file = $scope.selectedAnalysisType[0].file;

        // Set customMinMeas
        if (typeof $scope.customMinMeas == 'undefined') {
          $scope.customMinMeas = [];
        }
        if (typeof $scope.customMinMeas[$scope.layout.props.analysisTypeId] == 'undefined') {
          $scope.customMinMeas[$scope.layout.props.analysisTypeId] = $scope.minMeas;
        }

        // Overwrite minMeas when # of defined measure on property panel > minMeas
        if ($scope.layout.props.measures.length > $scope.customMinMeas[$scope.layout.props.analysisTypeId]) {
          $scope.customMinMeas[$scope.layout.props.analysisTypeId] = $scope.layout.props.measures.length;
        }
      }

      // Initialize extension html element
      $(`.advanced-analytics-toolsets-${extId}`).html(uiElement.frontPage);
      $compile($(`div.advanced-analytics-toolsets-${extId}`))($scope);

      // Get analysisCategories and analysisTypes
      $scope.analysisCategories = analysis.analysisCategories;
      $scope.analysisTypes = analysis.analysisTypes;

      // Get fieldList
      uiFieldList.createFieldList(app).then((reply) => {
        $scope.fieldList = reply;
      });

      // Register analysis type selection events
      uiAnalysistype.registerEvents($scope, $compile);

      // Register dimension events
      uiDimension.registerEvents($scope, $compile);

      // Register measure events
      uiMeasure.registerEvents($scope, $compile);

      // This helper funcition is used in ng.html to create arrays with supplied array length
      $scope.createArray = (arrayLength) => {
        const arr = [];
        for (let i = 0; i < arrayLength; ++i) {
          arr.push(i);
        }
        return arr;
      };
    },
  };
});
