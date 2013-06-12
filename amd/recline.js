(function() {
    var config = {
        recline: {
            shim: {
                jquery: { exports: '$' },
                underscore: { exports: '_' }
            },
            deps: ['backbone'],
            paths: {
                jquery: 'vendor/jquery/jquery',
                underscore: 'vendor/lodash/lodash',
                backbone: 'vendpr/backbone-amd/backbone-min'
            }
        }
    };

    require.config( config );

    require(['src/core','src/model.dataset'], function ( recline ) {
        return recline;
    });

}());
