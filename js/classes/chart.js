window.gitdRomeHotels = window.gitdRomeHotels || {};

(function( app ) {

  'use strict';

  app.chart = (function() {

    var data,
      marginX = 40,
      marginY = 25,
      width,
      height = 400 - marginY * 2,
      xScale, yScale, sizeScale,
      dotRadius = 15,
      flagSize = 512,
      tooltipWidth = 170,
      maxDotSize = 4,
      minDotSize = 0.4,
      tooltip, trendLine, dot, svg, chart,
      chartXAxis, chartYAxis,
      xMetric, yMetric,
      showSizes = false,
      axisLabels = {
        'gini': 'Country Inequality',
        'distance': 'Distance from Rome',
        'gdp_procapita': 'Income per capita',
        'stars': 'Hotel Stars',
        'stays': 'Length of Stay'
      };



    // ----------------- Scatterplot -----------------

    function setupSize() {

      width = window.innerWidth - marginX * 2;

      xScale = d3.scale.linear().range( [ 0, width ] );
      yScale = d3.scale.linear().range( [ height, 0 ] );

      svg.attr( 'width', width + marginX * 2 )
        .attr( 'height', height + marginY * 2 );

    }

    function getTooltip( d ) {
      var label = '<h2>' + d.country + '</h2>';
      if ( showSizes ) {
        label += '<p>Tourists per year<strong>' + formatNumber( d.arrivals_total ) + '</strong></p>';
      }
      label += '<p>Average ' + ( xMetric === 'stays'? 'stay' : ' hotel stars' ) + '<strong>' + Math.floor( d[ xMetric ] * 10 ) / 10 + ( xMetric === 'stays'? ' <span>nights</span>' : '' ) + '</strong></p>';
      if ( yMetric === 'gini' ) {
        label += '<p>Inequality ( Gini ) index<strong>' + Math.floor( d.gini ) + '</strong></p>';
      } else if ( yMetric === 'distance' ) {
        label += '<p>Distance from Rome<strong>' + formatNumber( d.distance ) + ' <span>Km</span></strong></p>';
      } else if ( yMetric === 'gdp_procapita' ) {
        label += '<p>Income per capita<strong>' + formatNumber( d.gdp_procapita ) + ' <span>$ / year</span></strong></p>';
      }
      return label;
    }

    function createChart() {

      // SVG area

      svg = d3.selectAll( '#chart' ).append( 'svg' );

      chart = svg.append( 'g' )
        .attr( 'transform', 'translate(' + marginX + ',' + marginY + ')' );

      chart.append( 'clipPath' )
        .attr( 'id', 'circle_mask' )
        .append( 'circle' )
        .attr( 'r', flagSize / 2 );

      // Size Setup

      setupSize();

      sizeScale = d3.scale.sqrt().range( [ minDotSize, maxDotSize ] );
      sizeScale.domain( [ d3.min( data, function( d ) { return d.size; } ), d3.max( data, function( d ) { return d.size; } ) ] );

      // Trend line

      trendLine = chart.append( 'line' )
        .attr( 'class', 'regression-line' )
        .attr( 'x1', 0 )
        .attr( 'y1', height )
        .attr( 'x2', 0 )
        .attr( 'y2', height );

      // Dots

      dot = chart.selectAll( '.dot' )
        .data( data, function( d ) { return d.code; } )
        .enter().append( 'g' )
        .attr( 'class', 'dot' );

      // Flags

      dot.append( 'image' )
        .attr( 'xlink:href', function( d ) { return 'flags/' + d.code + '.svg'; })
        .attr( 'x', -flagSize / 2 )
        .attr( 'y', -flagSize / 2 )
        .attr( 'width', flagSize )
        .attr( 'height', flagSize )
        .attr( 'transform', 'scale( ' + ( dotRadius / flagSize * 2 ) + ' )' )
        .attr( 'clip-path', 'url(#circle_mask)' );

      // Tooltips

      tooltip = d3.select( '.chart-area').append( 'div' )
        .attr( 'class', 'tooltip' )
        .style( 'opacity', 0 );

      dot.on( 'mouseover', function( d ) {

        var targetCoords = d3.transform( d3.select( d3.event.target.parentElement ).attr( 'transform' ) ).translate;

        tooltip.transition()
         .duration( 200 )
         .style( 'opacity', 1 );

        tooltip.html( getTooltip( d ) )
         .style( 'top',  ( targetCoords[ 1 ] + dotRadius * 3 + marginY ) + 'px')
         .classed( 'tooltip-right', false )
         .classed( 'tooltip-left', false );

        if ( targetCoords[ 0 ] < 50 ) {
          tooltip.classed( 'tooltip-right', true )
            .style( 'left', ( targetCoords[ 0 ] - tooltipWidth / 2 + marginX + 50 ) + 'px' );
        } else if ( targetCoords[ 0 ] > width - 50 ) {
          tooltip.classed( 'tooltip-left', true )
            .style( 'left', ( targetCoords[ 0 ] - tooltipWidth / 2 + marginX - 50 ) + 'px' );
        } else {
          tooltip.style( 'left', ( targetCoords[ 0 ] - tooltipWidth / 2 + marginX ) + 'px' );
        }

      })
      .on( 'mouseout', function( d ) {

        tooltip.transition()
         .duration( 500 )
         .style( 'opacity', 0 );

      });

    }

    function updateChart( xM, yM ) {

      if ( xM !== undefined && yM !== undefined ) {
        xMetric = xM;
        yMetric = yM;
      }

      // Scales

      var xValue = function( d ) { return d[ xMetric ]; },
        yValue = function( d ) { return d[ yMetric ]; },
        dotData = function( d ) { return 'translate(' + xScale( xValue( d ) ) + ',' + yScale( yValue( d ) ) + '), scale(' + ( showSizes? sizeScale( d.size ) : 1 ) + ')'; };

      xScale.domain( [ d3.min( data, xValue ), d3.max( data, xValue ) ] );
      yScale.domain( [ d3.min( data, yValue ), d3.max( data, yValue ) ] );

      // Trend line

      var trendX = data.map( function( d ) { return d[ yMetric ]; } ),
        trendY = data.map( function( d ) { return d[ xMetric ]; } ),
        trendLR = linearRegression( trendX, trendY ),
        trendMax = d3.max( data, function( d ) { return d[ xMetric ]; } );

      trendLine.transition().duration( 1000 )
        .attr( 'x1', marginX + xScale( 0 ) )
        .attr( 'y1', yScale( trendLR.intercept ) )
        .attr( 'x2', marginX + xScale( trendMax ) )
        .attr( 'y2', yScale( ( trendMax * trendLR.slope ) + trendLR.intercept ) );

      // Dots

      dot = chart.selectAll( '.dot' )
        .data( data, function( d ) { return d.code; } )
        .each(function( d, i ) {

          var dotCoords = d3.transform( d3.select( this ).attr( 'transform' ) ).translate,
            duration = 1000;
          if ( dotCoords[ 0 ] === 0 && dotCoords[ 1 ] === 0 ) {
            d3.select( this )
              .attr( 'transform', function( d ) { return 'translate(' + xScale( xValue( d ) ) + ',' + ( height + marginY * 2 + dotRadius ) + ')'; } );
            duration = 1600;
          }

          d3.select( this )
            .transition().duration( duration )
            .attr( 'transform', dotData );

        });

        // Axis

        chartXAxis.textContent = axisLabels[ xMetric ];
        chartYAxis.textContent = axisLabels[ yMetric ];

    }



    // ----------------- Helpers -----------------

    function linearRegression( y, x ) {

      var lr = {},
        n = y.length,
        sum_x = 0,
        sum_y = 0,
        sum_xy = 0,
        sum_xx = 0,
        sum_yy = 0,
        i;

      for ( i = 0; i < n; i++ ) {
        sum_x  += x[ i ];
        sum_y  += y[ i ];
        sum_xy += ( x[ i ] * y[ i ] );
        sum_xx += ( x[ i ] * x[ i ] );
        sum_yy += ( y[ i ] * y[ i ] );
      }

      lr.slope = ( n * sum_xy - sum_x * sum_y ) / ( n * sum_xx - sum_x * sum_x );
      lr.intercept = ( sum_y - lr.slope * sum_x ) / n;
      lr.r2 = Math.pow( ( n * sum_xy - sum_x * sum_y ) / Math.sqrt( ( n * sum_xx - sum_x * sum_x ) * ( n * sum_yy - sum_y * sum_y ) ), 2 );

      return lr;
    }

    function formatNumber( n ) {

      if ( n < 1000 ) {
        return '< 1.000';
      } else if ( n < 5000 ) {
        return ( Math.round( n / 100 ) / 10 ).toFixed( 1 ) + '00';
      } else if ( n < 1000000 ) {
        return Math.floor( n / 1000 ) + '.000';
      } else {
        return ( Math.floor( n / 100000 ) / 10 ).toFixed( 1 ) + '00.000';
      }

    }

    function setSelectedMetrics( btn ) {
      Array.prototype.forEach.call( document.querySelectorAll( '.chart-metrics-btn' ), function( el, i ){
        el.classList.remove( 'selected' );
      });
      btn.classList.add( 'selected' );
    }



    // ----------------- Resize listener -----------------

    var resizeEndTimeout;

    function setupResizeListener() {
      window.addEventListener( 'resize', function() {
        clearTimeout( resizeEndTimeout );
        resizeEndTimeout = setTimeout( resize, 500 );
      });
    }

    function resize() {
      setupSize();
      updateChart();
    }



    // ----------------- Public Methods -----------------

    return {

      setup: function( d ) {

        chartXAxis = document.querySelector( '#chartXAxis' );
        chartYAxis = document.querySelector( '#chartYAxis' );

        data = d;
        createChart();
        setSelectedMetrics( document.querySelector( '#btnGDPStays' ) );
        updateChart( 'stays', 'gdp_procapita' );

        document.querySelector( '#btnDistanceStars' ).addEventListener( 'click', function() {
          setSelectedMetrics( this );
          updateChart( 'stars', 'distance' );
        });

        document.querySelector( '#btnDistanceStays' ).addEventListener( 'click', function() {
          setSelectedMetrics( this );
          updateChart( 'stays', 'distance' );
        });

        document.querySelector( '#btnGDPStays' ).addEventListener( 'click', function() {
          setSelectedMetrics( this );
          updateChart( 'stays', 'gdp_procapita' );
        });

        document.querySelector( '#btnGiniStars' ).addEventListener( 'click', function() {
          setSelectedMetrics( this );
          updateChart( 'stars', 'gini' );
        });

        document.querySelector( '#btnSizes' ).addEventListener( 'click', function() {
          var btn = this;
          if ( btn.classList.contains( 'selected' ) ) {
            btn.classList.remove( 'selected' );
            showSizes = false;
          } else {
            btn.classList.add( 'selected' );
            showSizes = true;
          }
          updateChart();
        });

        setupResizeListener();

      }

    };

  })();

})( window.gitdRomeHotels );