/**
 * The carousels.
 *
 * Loaded only by zz_use_slick(), from a template that renders one, and only after jQuery and
 * slick - which is the library the recovered stylesheet was written for: 49 `.slick-slider` rules
 * against a single stray `.swiper` one, and a local copy in assets/vendor/slick/.
 *
 * The markup slick is given is the unclassed `<div data-zz-slider>` inside `.slider`, because the
 * recovered rules read `.slider .slick-slider` and slick puts that class on the element it is
 * handed. Its arrows are switched off and the two buttons already in the markup drive it instead,
 * so nothing is appended to the DOM and the arrows keep the classes the stylesheet draws.
 */
( function ( $ ) {
	'use strict';

	if ( ! $ || ! $.fn || ! $.fn.slick ) {
		return;
	}

	$( function () {
		$( '[data-zz-slider]' ).each( function () {
			var $track = $( this );
			var $frame = $track.closest( '.slider' );

			if ( $track.hasClass( 'slick-initialized' ) ) {
				return;
			}

			$track.slick( {
				slidesToShow: 1,
				slidesToScroll: 1,
				arrows: false,
				dots: false,
				infinite: true,
				speed: 700,
				fade: false,
				lazyLoad: 'ondemand',
				accessibility: true
			} );

			$frame.find( '[data-zz-slider-left]' ).on( 'click', function () {
				$track.slick( 'slickPrev' );
			} );

			$frame.find( '[data-zz-slider-right]' ).on( 'click', function () {
				$track.slick( 'slickNext' );
			} );
		} );
	} );
}( window.jQuery ) );
