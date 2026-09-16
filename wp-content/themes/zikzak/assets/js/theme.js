/**
 * The theme's own script.
 *
 * Everything that draws the site is CSS; this file only ever adds and removes the class names
 * that stylesheet is already waiting for. Nothing here builds markup, and the one library the
 * site needs (slick, for the carousels) is loaded per template by zz_use_slick() and driven from
 * assets/js/sliders.js.
 *
 * Seven jobs, in the order they appear below:
 *
 *   1. release the opacity gate on `.content`;
 *   2. animate `[data-aos]` elements into view when the AOS library is not on the page;
 *   3. hide and show the fixed header while the visitor scrolls;
 *   4. open and close the full screen menu, with its background photographs;
 *   5. open and close the quote and thank-you overlays;
 *   6. swap a video poster for its player on click;
 *   7. make the `role="button"` elements the recovered markup uses answer the keyboard.
 *
 * No build step and no dependencies. Written to run as it is, in the browsers the site supports.
 */
( function () {
	'use strict';

	var doc  = document;
	var html = doc.documentElement;

	/* -----------------------------------------------------------------
	 * 1. The page starts invisible
	 *
	 * The recovered CSS sets `opacity: 0` on `.content` and waits for the class `show`. On the
	 * old site the preloader added it; the preloader was already switched off in the last
	 * production build, so the release happens here. Visitors without scripts are covered by
	 * assets/css-src/99-safety.css, which lifts the same gate when `zz-js` is missing.
	 * -------------------------------------------------------------- */

	function revealContent() {
		var panels = doc.querySelectorAll( '.content' );
		for ( var i = 0; i < panels.length; i++ ) {
			panels[ i ].classList.add( 'show' );
		}
	}

	/* -----------------------------------------------------------------
	 * 2. Appearance on scroll
	 *
	 * `.aos-hidden, [data-aos] { visibility: hidden }` is unconditional in the recovered CSS, and
	 * `[data-aos].aos-animate { visibility: visible }` is what lets an element in. A page that
	 * calls zz_use_aos() gets the real library and this does nothing; a page that does not would
	 * otherwise fall back to the safety net in 99-safety.css, which shows those elements but
	 * kills the transition with them. So the same two classes are added here, from an
	 * IntersectionObserver, and the animation survives without the library.
	 *
	 * The `zz-no-aos` class comes off only once this has taken charge, because that class is what
	 * keeps the elements visible in the meantime. Anything with no layout box at that moment - a
	 * `display: none` column, the overlay menu scaled to zero - is marked animated on the spot
	 * rather than observed: an element with no box never intersects anything, and one that could
	 * never be shown again is worse than one that never animates.
	 * -------------------------------------------------------------- */

	var revealObserver = null;

	function animate( el ) {
		el.classList.add( 'aos-init', 'aos-animate' );
	}

	function startReveal() {
		var targets = doc.querySelectorAll( '[data-aos]' );

		if ( ! targets.length || window.AOS ) {
			return;
		}

		if ( ! ( 'IntersectionObserver' in window ) ) {
			for ( var n = 0; n < targets.length; n++ ) {
				animate( targets[ n ] );
			}
			html.classList.remove( 'zz-no-aos' );
			return;
		}

		revealObserver = new IntersectionObserver(
			function ( entries ) {
				for ( var i = 0; i < entries.length; i++ ) {
					if ( entries[ i ].isIntersecting ) {
						animate( entries[ i ].target );
						revealObserver.unobserve( entries[ i ].target );
					}
				}
			},
			{ rootMargin: '0px 0px -80px 0px' }
		);

		for ( var j = 0; j < targets.length; j++ ) {
			if ( targets[ j ].getClientRects().length ) {
				revealObserver.observe( targets[ j ] );
			} else {
				animate( targets[ j ] );
			}
		}

		html.classList.remove( 'zz-no-aos' );

		/*
		 * The sweep, and why it is not paranoia.
		 *
		 * An IntersectionObserver reports against a viewport the browser is drawing. A document
		 * that was opened in a background tab is not being drawn, so the first callback can say
		 * that nothing intersects anything - and since these elements are `visibility: hidden`
		 * until they are marked, the visitor who switches to that tab an hour later would find a
		 * page with no content on it. Browsers do re-deliver once the tab is shown, but the cost
		 * of not relying on that is two event listeners and a rectangle comparison.
		 *
		 * It runs when the page has finished loading and again whenever the tab becomes visible,
		 * and it only marks what should already have been seen: anything whose top edge is above
		 * the bottom of the window. Everything further down is still the observer's job.
		 */
		window.addEventListener( 'load', sweep );

		/*
		 * The end of the page. The observer waits until an element is 80px inside the window, and
		 * `custom-fade` holds an element 50px below its place (translate3d(0,50px) scaleY(1.3) in
		 * animations.css) until it is marked. So the last row of a page can sit lower than the
		 * window will ever scroll and stay hidden for good - measured on 2026-09-16 at 1440 x 900
		 * and 1920 x 1080, that was `.footer__bottom` (the year, the legal links and the social
		 * links) on every page that has it. Once the window cannot go any further, sweep() lets
		 * everything still waiting in.
		 */
		var ticking = false;
		window.addEventListener(
			'scroll',
			function () {
				if ( ticking ) {
					return;
				}
				ticking = true;
				window.requestAnimationFrame( function () {
					ticking = false;
					if ( atEnd() ) {
						sweep();
					}
				} );
			},
			{ passive: true }
		);
		doc.addEventListener(
			'visibilitychange',
			function () {
				if ( ! doc.hidden ) {
					sweep();
				}
			}
		);
	}

	/** True when the window shows the last pixel of the document and cannot scroll further. */
	function atEnd() {
		return window.pageYOffset + window.innerHeight >= doc.documentElement.scrollHeight - 2;
	}

	/** Marks everything that is already within the window, whether or not the observer said so.
	 *  At the end of the document that is everything: nothing further down will ever scroll in. */
	function sweep() {
		var remaining = doc.querySelectorAll( '[data-aos]:not(.aos-animate)' );
		var limit     = atEnd() ? Infinity : window.innerHeight;

		for ( var i = 0; i < remaining.length; i++ ) {
			if ( remaining[ i ].getBoundingClientRect().top < limit ) {
				animate( remaining[ i ] );
				if ( revealObserver ) {
					revealObserver.unobserve( remaining[ i ] );
				}
			}
		}
	}

	/** Shows everything inside a container at once. Used when the menu opens: its rows sit in an
	 *  element scaled to zero until then, so the observer has never seen them. */
	function revealInside( container ) {
		if ( ! container ) {
			return;
		}
		var hidden = container.querySelectorAll( '[data-aos]:not(.aos-animate)' );
		for ( var i = 0; i < hidden.length; i++ ) {
			animate( hidden[ i ] );
			if ( revealObserver ) {
				revealObserver.unobserve( hidden[ i ] );
			}
		}
	}

	/* -----------------------------------------------------------------
	 * 3. The header
	 *
	 * Three states, all of them in the recovered CSS. At the top of the page the header is in the
	 * flow of the document and carries nothing. Past its own height it becomes fixed: scrolling
	 * down hides it (`h_fixed_hide`), scrolling up brings it back (`h_fixed_show`).
	 * `addBgMobileHeader` paints the strip behind it on a phone, where the header is fixed from
	 * the start and would otherwise sit on top of the page's own first image.
	 * -------------------------------------------------------------- */

	var HEADER_HEIGHT = 88;

	function initHeader() {
		var header = doc.querySelector( '.h' );
		if ( ! header ) {
			return;
		}

		var last    = window.pageYOffset;
		var waiting = false;

		function update() {
			waiting = false;
			var y = window.pageYOffset;

			if ( y <= HEADER_HEIGHT ) {
				header.classList.remove( 'h_fixed_show', 'h_fixed_hide' );
			} else if ( y > last ) {
				header.classList.add( 'h_fixed_hide' );
				header.classList.remove( 'h_fixed_show' );
			} else if ( y < last ) {
				header.classList.add( 'h_fixed_show' );
				header.classList.remove( 'h_fixed_hide' );
			}

			header.classList.toggle( 'addBgMobileHeader', y > 10 );
			last = y;
		}

		/*
		 * Throttled to one pass per frame. The timer beside the frame callback is not belt and
		 * braces, it is the release valve: a browser does not run frame callbacks in a hidden
		 * tab, so without it one scroll in a background tab would leave `waiting` stuck on and
		 * the header frozen for the rest of the visit. Whichever of the two arrives first clears
		 * the flag and the other finds nothing to do.
		 */
		function onScroll() {
			if ( waiting ) {
				return;
			}
			waiting = true;
			window.requestAnimationFrame( update );
			window.setTimeout(
				function () {
					if ( waiting ) {
						update();
					}
				},
				200
			);
		}

		window.addEventListener( 'scroll', onScroll, { passive: true } );

		update();
	}

	/* -----------------------------------------------------------------
	 * 4. The full screen menu
	 * -------------------------------------------------------------- */

	var menu       = null;
	var burger     = null;
	var toggle     = null;
	var menuIsOpen = false;

	function loadMenuBackgrounds() {
		var images = menu ? menu.querySelectorAll( 'img[data-src]' ) : [];
		for ( var i = 0; i < images.length; i++ ) {
			images[ i ].src = images[ i ].getAttribute( 'data-src' );
			images[ i ].removeAttribute( 'data-src' );
		}
	}

	function setMenu( open ) {
		if ( ! menu ) {
			return;
		}

		menuIsOpen = open;
		menu.classList.toggle( 'menu_open', open );

		if ( burger ) {
			burger.classList.toggle( 'b_active', open );
		}
		if ( toggle ) {
			toggle.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
		}

		var header = doc.querySelector( '.h' );
		if ( header ) {
			// Hides the logo and the desktop links behind the overlay, which has its own.
			header.classList.toggle( 'h_fixed_super', open );
		}

		lockScroll( open );

		if ( open ) {
			loadMenuBackgrounds();
			revealInside( menu );
		}
	}

	function initMenu() {
		menu   = doc.getElementById( 'zz-menu' );
		burger = doc.querySelector( '.b' );
		toggle = doc.querySelector( '[data-zz-menu-toggle]' );

		if ( ! menu || ! toggle ) {
			return;
		}

		toggle.addEventListener( 'click', function () {
			setMenu( ! menuIsOpen );
		} );

		// One background photograph per row, cross faded by the row the pointer is over. Rows
		// that have no photograph (News, Career - the overlay only shows them below desktop)
		// carry no data-zz-bg and simply leave the last one in place.
		var backgrounds = menu.querySelectorAll( '.menu__bg' );
		var rows        = menu.querySelectorAll( '.menu__row' );

		function showBackground( index ) {
			for ( var i = 0; i < backgrounds.length; i++ ) {
				backgrounds[ i ].classList.toggle( 'menu__bg_active', i === index );
			}
		}

		for ( var r = 0; r < rows.length; r++ ) {
			( function ( row ) {
				var index = row.getAttribute( 'data-zz-bg' );
				if ( null === index ) {
					return;
				}
				row.addEventListener( 'mouseenter', function () {
					showBackground( parseInt( index, 10 ) );
				} );
				row.addEventListener( 'focus', function () {
					showBackground( parseInt( index, 10 ) );
				} );
			}( rows[ r ] ) );
		}

		menu.addEventListener( 'mouseleave', function () {
			showBackground( -1 );
		} );
	}

	/* -----------------------------------------------------------------
	 * 5. The overlays
	 *
	 * `.calc` holds the quote form and `.thanks` the acknowledgement; `calc_active` and
	 * `thanks_active` are the state classes the recovered CSS animates.
	 *
	 * Sending the forms is not this file's job: assets/js/forms.js submits every
	 * `[data-zz-form]` to the ZIKZAK Core endpoint and calls ZZ.thanks() when the request has
	 * been accepted. It also closes the overlays this file does not know by name (the case
	 * calculator), the way inc/vpages.php closes the CV overlay on Careers.
	 * -------------------------------------------------------------- */

	var scrollWasLocked = '';

	function lockScroll( lock ) {
		if ( lock ) {
			if ( '' === scrollWasLocked ) {
				scrollWasLocked = html.style.overflow || 'auto';
				html.style.overflow = 'hidden';
			}
			return;
		}
		if ( '' !== scrollWasLocked && ! menuIsOpen && ! doc.querySelector( '.calc_active, .thanks_active' ) ) {
			html.style.overflow = 'auto' === scrollWasLocked ? '' : scrollWasLocked;
			scrollWasLocked = '';
		}
	}

	function modal( name ) {
		return doc.querySelector( '[data-zz-modal="' + name + '"]' );
	}

	function setModal( name, open ) {
		var el = modal( name );
		if ( ! el ) {
			return;
		}
		el.classList.toggle( name === 'thanks' ? 'thanks_active' : 'calc_active', open );
		el.setAttribute( 'aria-hidden', open ? 'false' : 'true' );
		if ( open ) {
			el.removeAttribute( 'inert' );
		} else {
			el.setAttribute( 'inert', '' );
		}
		lockScroll( open );

		if ( open ) {
			revealInside( el );

			// Moving focus into the dialog is the point of opening it, but not in the same tick:
			// the element is still `visibility: hidden` until the browser has applied the class
			// that was set two lines ago, and focus() on a hidden element does nothing at all.
			window.setTimeout(
				function () {
					var first = el.querySelector( 'input, button, [tabindex]' );
					if ( first ) {
						first.focus();
					}
				},
				0
			);
		}
	}

	function closeEverything() {
		setModal( 'quote', false );
		setModal( 'thanks', false );
		setMenu( false );
	}

	function initModals() {
		doc.addEventListener( 'click', function ( event ) {
			var opener = event.target.closest ? event.target.closest( '[data-zz-open]' ) : null;
			if ( opener ) {
				setModal( opener.getAttribute( 'data-zz-open' ), true );
				setMenu( false );
				return;
			}

			var closer = event.target.closest ? event.target.closest( '[data-zz-close]' ) : null;
			if ( closer ) {
				closeEverything();
				return;
			}

			// A click on the dimmed area around the modal closes it; a click inside does not.
			var backdrop = event.target.closest ? event.target.closest( '[data-zz-modal]' ) : null;
			if ( backdrop && event.target === backdrop ) {
				closeEverything();
			}
		} );

		doc.addEventListener( 'keydown', function ( event ) {
			if ( 'Escape' === event.key || 'Esc' === event.key ) {
				closeEverything();
			}
		} );

		// The forms themselves are wired by assets/js/forms.js, see the note above.
	}

	/* -----------------------------------------------------------------
	 * 6. Video blocks (constructor block type_8)
	 *
	 * The player is parked in a `<template>`, which the browser parses and does not load, so a
	 * page with a video on it does not pull the provider's iframe, scripts and cookies until
	 * somebody asks for them.
	 * -------------------------------------------------------------- */

	function playVideo( card ) {
		var holder = card.querySelector( '[data-zz-embed]' );
		if ( ! holder ) {
			return;
		}
		card.appendChild( holder.content.cloneNode( true ) );
		holder.remove();

		var poster = card.querySelector( '.card__img' );
		if ( poster ) {
			poster.remove();
		}
		card.removeAttribute( 'data-zz-video' );
		card.removeAttribute( 'role' );
		card.removeAttribute( 'tabindex' );
	}

	function initVideos() {
		doc.addEventListener( 'click', function ( event ) {
			var card = event.target.closest ? event.target.closest( '[data-zz-video]' ) : null;
			if ( card ) {
				playVideo( card );
			}
		} );
	}

	/* -----------------------------------------------------------------
	 * 7. Keyboard
	 *
	 * The recovered markup uses `<div>` for several controls, because the old site's stylesheet
	 * draws them and a real `<button>` brings a font and a background of its own that would show
	 * through it. They carry `role="button"` and a tab stop, and this is the other half of that
	 * bargain: Enter and Space have to do what a click does.
	 * -------------------------------------------------------------- */

	function initKeyboard() {
		doc.addEventListener( 'keydown', function ( event ) {
			if ( 'Enter' !== event.key && ' ' !== event.key && 'Spacebar' !== event.key ) {
				return;
			}
			var target = event.target;
			if ( ! target.getAttribute || 'button' !== target.getAttribute( 'role' ) ) {
				return;
			}
			event.preventDefault();
			target.click();
		} );
	}

	/* -----------------------------------------------------------------
	 * The public handles, for the templates and for whatever wires the form up.
	 * -------------------------------------------------------------- */

	window.ZZ = {
		openQuote: function () {
			setModal( 'quote', true );
		},
		thanks: function () {
			setModal( 'quote', false );
			setModal( 'thanks', true );
		},
		close: closeEverything,
		reveal: revealInside
	};

	function start() {
		revealContent();
		startReveal();
		initHeader();
		initMenu();
		initModals();
		initVideos();
		initKeyboard();
	}

	if ( 'loading' === doc.readyState ) {
		doc.addEventListener( 'DOMContentLoaded', start );
	} else {
		start();
	}
}() );
