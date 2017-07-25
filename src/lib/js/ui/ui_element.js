define([
  'text!./element/frontPage.ng.html',
  'text!./element/listAnalysisCategoriesElement.ng.html',
  'text!./element/listAnalysisTypesElement.ng.html',
  'text!./element/listDimensionElement.ng.html',
  'text!./element/listMeasureElement.ng.html',
  'text!./element/listAggrMeasureElement.ng.html',
], (
  frontPage,
  listAnalysisCategoriesElement,
  listAnalysisTypesElement,
  listDimensionElement,
  listMeasureElement,
  listAggrMeasureElement,
) => {
  return {
    frontPage,
    listAnalysisCategoriesElement,
    listAnalysisTypesElement,
    listDimensionElement,
    listMeasureElement,
    listAggrMeasureElement,
  };
});
