/**
* FieldList
*/
define(['backbone'], function ( Backbone ) {
    return Backbone.Collection.extend({
        constructor: function FieldList() {
            Backbone.Collection.prototype.constructor.apply(this, arguments);
        },
        model: my.Field
    });
});
