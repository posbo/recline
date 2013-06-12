(function() {
    var config = {
        recline: {
            shim: {
                jquery: { exports: '$' },
                underscore: { exports: '_' }
            },
            paths: {
                jquery: 'vendor/jquery/jquery',
                underscore: 'vendor/lodash/lodash',
                backbone: 'vendpr/backbone-amd/backbone'
            }
        }
    };

    require.config( config );

    require(['src/core','src/models','src/collections'], function ( recline ) {
        return recline;
    });

}());
