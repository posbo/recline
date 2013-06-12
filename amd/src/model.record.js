define(['backbone'], function ( Backbone ) {
    // ## <a id="record">A Record</a>
    // A single record (or row) in the dataset
    return Backbone.Model.extend({
        constructor: function Record() {
            Backbone.Model.prototype.constructor.apply(this, arguments);
        },
        /**
        * Create a Record, you usually will not do this directly but will have
        * records created by Dataset e.g. in query method. Certain methods
        * require presence of a fields attribute (identical to that on Dataset)
        */
        initialize: function() {
            _.bindAll(this, 'getFieldValue');
        },
        /**
        * For the provided Field get the corresponding rendered computed data value
        * for this record.
        *
        * @param {object} field
        */
        getFieldValue: function(field) {
            var val = this.getFieldValueUnrendered(field);
            if (field && !_.isUndefined(field.renderer)) {
                val = field.renderer(val, field, this.toJSON());
            }
            return val;
        },
        /**
        * For the provided Field get the corresponding computed data value
        * for this record.
        *
        * @param {object} field
        */
        getFieldValueUnrendered: function(field) {
            if (!field) { return; }

            var val = this.get(field.id);

            if (field.deriver) {
                val = field.deriver(val, field, this);
            }

            return val;
        },
        /**
        * Get a simple html summary of this record in form of key/value list
        *
        */
        summary: function(record) {
            var html = '<div class="recline-record-summary">';

            this.fields.each( function( field ) {
                if (field.id !== 'id') {
                    html += '<div class="' + field.id + '"><strong>' + field.get('label') + '</strong>: ' + this.getFieldValue(field) + '</div>';
                }
            }, this);

            html += '</div>';

            return html;
        },
        /**
        * Override Backbone save, fetch and destroy so they do nothing.
        * Instead, Dataset object that created this Record should take care of
        * handling these changes (discovery will occur via event notifications)
        * WARNING: these will not persist *unless* you call save on Dataset
        */
        fetch: function() {},
        save: function() {},
        destroy: function() {
            this.trigger('destroy', this);
        }
    });
});
