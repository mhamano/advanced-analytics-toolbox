define([
  './ui_element',
  '../../vendor/leonardo-ui.min',
], (uiElement, leonardoui) => {
  return {
    registerEvents($scope, $compile) {

      // Popover of Analysis Categories
      let listAnalysisCategoriesPopover = null;
      $scope.listAnalysisCategoriesButton = {};
      $scope.listAnalysisCategories = ($event) => {
        if ($scope.listAnalysisCategoriesButton.active) {
          // popover.close();
          $scope.listAnalysisCategoriesButton.active = false;
        } else {
          $scope.listAnalysisCategoriesButton.active = true;
          const element = $event.currentTarget;
          listAnalysisCategoriesPopover = leonardoui.popover({
            content: uiElement.listAnalysisCategoriesElement,
            closeOnEscape: true,
            dock: 'right',
            alignTo: element,
            onClose() {
              $scope.$apply((scope) => {
                scope.listAnalysisCategoriesButton.active = false;
              });
            },
          });
          $compile($('div.lui-popover__body'))($scope);
        }
      };

      // Drill down analysis category event
      $scope.drilldownAnalysisCategory = (selectedAnalysisCategoryId) => {
        $scope.selectedAnalysisCategoryId = selectedAnalysisCategoryId;

        $('div.lui-popover').html(uiElement.listAnalysisTypesElement);
        $compile($('div.lui-popover'))($scope);
      };

      // Go back to analysis categories list event
      $scope.goBackAnalysisCategory = () => {
        $('div.lui-popover').replaceWith(uiElement.listAnalysisCategoriesElement);
        $compile($('div.lui-popover'))($scope);
      };

      // Selet analysis type
      $scope.selectAnalysisType = (selectedAnalysisCategoryId, analysisTypeId) => {
        $scope.backendApi.applyPatches([
          {
            qPath: '/props/analysisCategoryId',
            qOp: 'replace',
            qValue: JSON.stringify(selectedAnalysisCategoryId),
          },
          {
            qPath: '/props/analysisTypeId',
            qOp: 'replace',
            qValue: JSON.stringify(analysisTypeId),
          },
        ], false);

        listAnalysisCategoriesPopover.close();
      };

      // Remove analysis type
      $scope.removeAnalysisTypeSelection = () => {
        $scope.backendApi.applyPatches([
          {
            qPath: '/props/analysisCategoryId',
            qOp: 'replace',
            qValue: JSON.stringify(-1),
          },
          {
            qPath: '/props/analysisTypeId',
            qOp: 'replace',
            qValue: JSON.stringify(-1),
          },
        ], false);
      };
    },
  };
});
