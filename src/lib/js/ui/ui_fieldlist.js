define([
  '../analysis/analysis',
  './ui_element',
  '../../vendor/leonardo-ui.min',
  'ng!$q',
], (analysisTypes, uiElement, leonardoui, $q) => {
  return {
    createFieldList(app) {
      const fieldList = [];
      const defer = $q.defer();

      app.createGenericObject({
        qInfo: {
          qType: 'FieldList',
        },
        qFieldListDef: {
          qShowSystem: false,
          qShowHidden: false,
          qShowDerivedFields: true,
          qShowSemantic: true,
          qShowSrcTables: true,
          qShowImplicit: true,
        },
      }, function(reply) {
        var items = reply.qFieldList.qItems;

        // Sort items
        items = items.sort((a, b) => {
          a = a.qName.toString().toLowerCase();
          b = b.qName.toString().toLowerCase();
          if (a < b) {
            return -1;
          } else if (a > b) {
            return 1;
          }
          return 0;
        });

        $.each(items, (key, value) => {
          fieldList.push({ label: value.qName, value: value.qName, autocalendar: (typeof value.qDerivedFieldData != 'undefined' ), derivedField: false })
          if (typeof value.qDerivedFieldData != 'undefined' ) {
            var derivedItems = value.qDerivedFieldData.qDerivedFieldLists[0].qFieldDefs;
            // Sort derivedItems in alphabetical order
            derivedItems = derivedItems.sort((a, b) => {
              a = a.qMethod.toString().toLowerCase();
              b = b.qMethod.toString().toLowerCase();
              if (a < b) {
                return -1;
              } else if (a > b) {
                return 1;
              }
              return 0;
            });
            $.each(derivedItems, (key, value) => {
              fieldList.push({ label: value.qMethod, value: value.qName, autocalendar: false, derivedField: true })
            });
          }
        });
        app.destroySessionObject(reply.qInfo.qId);
        return defer.resolve(fieldList);
      });
      return defer.promise;
    },
  };
});
