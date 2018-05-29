define([
  './ui_element',
  '../../vendor/leonardo-ui.min',
], (uiElement, leonardoui) => {
  return {
    registerEvents($scope, $compile) {
      // Dimension List
      let listDimensionListPopover = null;
      $scope.isDimensionListOpened = [];
      $scope.openDimensionList = ($event, dimensionId) => {
        if ($scope.isDimensionListOpened[dimensionId]) {
          // popover.close();
          $scope.isDimensionListOpened[dimensionId] = false;
        } else {
          $scope.isDimensionListOpened[dimensionId] = true;
          const element = $event.currentTarget;
          listDimensionListPopover = leonardoui.popover({
            content: uiElement.listDimensionElement.replace('<dimensionId>', `${dimensionId}`),
            closeOnEscape: true,
            dock: 'right',
            alignTo: element,
            onClose() {
              $scope.$apply((scope) => {
                scope.isDimensionListOpened[dimensionId] = false;
                scope.dimSearchString = '';
              });
            },
          });
          $compile($('div.lui-popover'))($scope);
        }
      };

      $scope.selectDimension = (dimensionId, expression) => {
        for (let i = dimensionId; i >= 0; i--) {
          if (typeof $scope.layout.props.dimensions[i] == 'undefined') {
            dimensionId = i;
          }
        }

        // When expression includes whitespace, add square brankets
        if (/\s/.test(expression)) {
          expression = `[${expression}]`;
        }
        $scope.backendApi.applyPatches([
          {
            qPath: `/props/dimensions/${dimensionId}`,
            qOp: 'add',
            qValue: JSON.stringify({ label: expression, expression: expression }),
          },
        ], false);

        listDimensionListPopover.close();
      };

      $scope.removeDimension = (dimensionId) => {
        $scope.backendApi.applyPatches([
          {
            qPath: `/props/dimensions/${dimensionId}`,
            qOp: 'remove',
          },
        ], false);
      };
    },
  };
});
