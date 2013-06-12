define(['backbone','src/collection.facetList'], function ( Backbone, FacetList ) {
    return Backbone.Model.extend({
        constructor: function Field() {
            Backbone.Model.prototype.constructor.apply(this, arguments);
        },
        defaults: {
            label: null,
            type: 'string',
            format: null,
            is_derived: false
        },
        /**
        * Initialize
        *
        * @param {Object} data: standard Backbone model attributes
        * @param {Object} options: renderer and/or deriver functions.
        */
        initialize: function(data, options) {
            // if a hash not passed in the first argument throw error
            if ('0' in data) {
                throw new Error('Looks like you did not pass a proper hash with id to Field constructor');
            }

            if (this.attributes.label === null) {
                this.set({label: this.id});
            }
            if (this.attributes.type.toLowerCase() in this._typeMap) {
                this.attributes.type = this._typeMap[this.attributes.type.toLowerCase()];
            }
            if (options) {
                this.renderer = options.renderer;
                this.deriver = options.deriver;
            }

            if (!this.renderer) {
                this.renderer = this.defaultRenderers[this.get('type')];
            }

            this.facets = new FacetList();
        },
        _typeMap: {
            'text': 'string',
            'double': 'number',
            'float': 'number',
            'numeric': 'number',
            'int': 'integer',
            'datetime': 'date-time',
            'bool': 'boolean',
            'timestamp': 'date-time',
            'json': 'object'
        },
        defaultRenderers: {
            object    : function(val, field, doc) {
                return JSON.stringify(val); 
            },
            geo_point : function(val, field, doc) {
                return JSON.stringify(val); 
            },
            'number': function (val, field, doc) {
                var format = field.get('format');
                if (format === 'percentage') {
                    return val + '%';
                }
                return val;
            },
            'string': function(val, field, doc) {
                var format = field.get('format');

                if (format === 'markdown') {
                    if (typeof Showdown !== 'undefined') {
                        var showdown = new Showdown.converter();

                        return showdown.makeHtml(val);
                    } else {
                        return val;
                    }
                } else if (format === 'plain') {
                    return val;
                } else {
                    // as this is the default and default type is string may get things
                    // here that are not actually strings
                    if (val && typeof val === 'string') {
                        val = val.replace(/(https?:\/\/[^ ]+)/g, '<a href="$1">$1</a>');
                    }
                    return val;
                }
            }
        }
    });
});
