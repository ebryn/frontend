/* global window */
import Ember from 'ember';

var customHelpers = function(app) {
  Ember.Test.registerHelper('pickOption', function(app, selector, optionText, assert){
    assert.equal(find(selector).length, 1, selector + ' is a valid selector');
    find(selector).find('option').filter(function() {
      return this.text === optionText;
    }).prop('selected', true);
    return triggerEvent(selector, 'change');
  });
  Ember.Test.registerHelper('getElementText', function(app, element){
    return element.text().replace(/[\t\n\s]+/g, "");
  });
  Ember.Test.registerHelper('getText', function(app, string){
    return string.replace(/[\t\n\s]+/g, "");
  });
}();

export default customHelpers;
