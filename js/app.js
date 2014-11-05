window.gitdRomeHotels = window.gitdRomeHotels || {};

(function( app ) {

  'use strict';

  app.main = (function() {

    return {

      init: function( data ) {
        app.chart.setup( data );
      }

    };

  })();



  // ----------------- Utilities -----------------

  function fixTouchEvents() {
    FastClick.attach( document.body );
  }



  // ----------------- Data Loading and Startup -----------------

  document.addEventListener( 'DOMContentLoaded', function() {

    fixTouchEvents();

    d3.csv( 'data/hotels.csv', function( data ) {

      var parsedData = [],
        totalArrivals, c;

      data.map(function( d ) {

        c = {};
        for ( var p in d ) {
          c[ p ] = ( p !== 'country' && p !== 'code' )? +d[ p ] : d[ p ];
        }

        if ( c.code === 'total' ) {
          totalArrivals = c.arrivals_total;
        }

        // Stars
        c.stars = ( c.arrivals_1 / c.arrivals_total ) +
          ( c.arrivals_2 / c.arrivals_total ) * 2 +
          ( c.arrivals_3 / c.arrivals_total ) * 3 +
          ( c.arrivals_4 / c.arrivals_total ) * 4 +
          ( c.arrivals_5 / c.arrivals_total ) * 5;

        // Stays
        c.stays = c.stays_total / c.arrivals_total;

        // Size
        c.size = c.arrivals_total / totalArrivals;

        if ( c.code !== 'total' ) {
          parsedData.push( c );
        }
      });

      // Sort by size, to avoid overlapping issues
      parsedData.sort(function( a, b ){
        if ( a.size < b.size ) {
          return 1;
        }
        if ( a.size > b.size ) {
          return -1;
        }
        return 0;
      });

      app.main.init( parsedData );

    });

  });

})( window.gitdRomeHotels );