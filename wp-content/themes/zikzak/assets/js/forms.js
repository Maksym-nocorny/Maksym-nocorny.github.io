/**
 * The enquiry forms.
 *
 * Four forms, one contract (inc/forms.php): `quote` in the overlay footer.php prints on every
 * page, `calc` in the calculator overlay of a case or an article, `service` in the card on
 * What we do and `vacancy` in the CV overlay on Careers. Each is a `<form data-zz-form="...">`
 * whose `action` is the ZIKZAK Core endpoint, printed by rest_url() so the /ua/ prefix of a
 * Ukrainian page can never end up in it.
 *
 * What this file does, in the order it appears below:
 *
 *   1. the country code picker of the telephone row, and the full number it produces;
 *   2. the urgency slider of the calculator;
 *   3. the file row of the CV form;
 *   4. errors: beside a field, above the button, and for a screen reader;
 *   5. sending: XMLHttpRequest + FormData, one request at a time, what each answer means, and the
 *      thank-you address the old site moved to after a success;
 *   6. the overlays: closing the calculator, focus that stays in an open overlay and comes back
 *      to what opened it, the vacancy a CV form was opened from.
 *
 * The contract's answers: 200 `{ok:true, message}` is a request the studio has (the thank-you
 * overlay shows `message`); 422 `{code:"invalid", errors}` puts each error beside its field;
 * 400 `bad_token` and 429 `rate_limited` put the server's text above the button. Anything else -
 * a 500, a page that is not JSON - is a request that did not arrive, and the visitor is told so in
 * words from inc/forms.php and keeps everything they typed. No answer at all is told apart by
 * whether the whole request had left the page: see section 5.
 *
 * Without XMLHttpRequest or FormData nothing here runs and the forms post natively to the same
 * endpoint (see inc/forms.php). No build step and no dependencies, like theme.js.
 */
( function () {
	'use strict';

	var doc  = document;
	var html = doc.documentElement;

	if ( ! window.XMLHttpRequest || ! window.FormData || ! ( 'closest' in doc.documentElement ) ) {
		return;
	}

	var config = window.zzFormsConfig || {};
	var labels = config.labels || {};
	var lang   = 'ua' === config.lang ? 'ua' : 'en';

	/* -----------------------------------------------------------------
	 * 1. The telephone row
	 *
	 * The country list is the old site's own: vue-phone-number-input shipped it inside its bundle
	 * (round4 archive, _nuxt/efd70b9.js), as ISO code, calling code and English name, and it is
	 * copied here without its native name suffixes and without Russia. On a Ukrainian page the
	 * names come from the browser in Ukrainian (Intl.DisplayNames), with these English names as
	 * the fallback; the search matches both, so the start of the Ukrainian name and "Germ" both
	 * find Germany.
	 *
	 * The three countries the studio has offices in come first.
	 * -------------------------------------------------------------- */

	var COUNTRIES = [
		["AF","93","Afghanistan"], ["AL","355","Albania"], ["DZ","213","Algeria"], ["AS","1684","American Samoa"],
		["AD","376","Andorra"], ["AO","244","Angola"], ["AI","1264","Anguilla"], ["AG","1268","Antigua and Barbuda"],
		["AR","54","Argentina"], ["AM","374","Armenia"], ["AW","297","Aruba"], ["AU","61","Australia"],
		["AT","43","Austria"], ["AZ","994","Azerbaijan"], ["BS","1242","Bahamas"], ["BH","973","Bahrain"],
		["BD","880","Bangladesh"], ["BB","1246","Barbados"], ["BY","375","Belarus"], ["BE","32","Belgium"],
		["BZ","501","Belize"], ["BJ","229","Benin"], ["BM","1441","Bermuda"], ["BT","975","Bhutan"],
		["BO","591","Bolivia"], ["BA","387","Bosnia and Herzegovina"], ["BW","267","Botswana"], ["BR","55","Brazil"],
		["IO","246","British Indian Ocean Territory"], ["VG","1284","British Virgin Islands"], ["BN","673","Brunei"], ["BG","359","Bulgaria"],
		["BF","226","Burkina Faso"], ["BI","257","Burundi"], ["KH","855","Cambodia"], ["CM","237","Cameroon"],
		["CA","1","Canada"], ["CV","238","Cape Verde"], ["BQ","599","Caribbean Netherlands"], ["KY","1345","Cayman Islands"],
		["CF","236","Central African Republic"], ["TD","235","Chad"], ["CL","56","Chile"], ["CN","86","China"],
		["CX","61","Christmas Island"], ["CC","61","Cocos (Keeling) Islands"], ["CO","57","Colombia"], ["KM","269","Comoros"],
		["CD","243","Congo"], ["CG","242","Congo"], ["CK","682","Cook Islands"], ["CR","506","Costa Rica"],
		["CI","225","C\u00f4te d\u2019Ivoire"], ["HR","385","Croatia"], ["CU","53","Cuba"], ["CW","599","Cura\u00e7ao"],
		["CY","357","Cyprus"], ["CZ","420","Czech Republic"], ["DK","45","Denmark"], ["DJ","253","Djibouti"],
		["DM","1767","Dominica"], ["DO","1","Dominican Republic"], ["EC","593","Ecuador"], ["EG","20","Egypt"],
		["SV","503","El Salvador"], ["GQ","240","Equatorial Guinea"], ["ER","291","Eritrea"], ["EE","372","Estonia"],
		["ET","251","Ethiopia"], ["FK","500","Falkland Islands"], ["FO","298","Faroe Islands"], ["FJ","679","Fiji"],
		["FI","358","Finland"], ["FR","33","France"], ["GF","594","French Guiana"], ["PF","689","French Polynesia"],
		["GA","241","Gabon"], ["GM","220","Gambia"], ["GE","995","Georgia"], ["DE","49","Germany"],
		["GH","233","Ghana"], ["GI","350","Gibraltar"], ["GR","30","Greece"], ["GL","299","Greenland"],
		["GD","1473","Grenada"], ["GP","590","Guadeloupe"], ["GU","1671","Guam"], ["GT","502","Guatemala"],
		["GG","44","Guernsey"], ["GN","224","Guinea"], ["GW","245","Guinea-Bissau"], ["GY","592","Guyana"],
		["HT","509","Haiti"], ["HN","504","Honduras"], ["HK","852","Hong Kong"], ["HU","36","Hungary"],
		["IS","354","Iceland"], ["IN","91","India"], ["ID","62","Indonesia"], ["IR","98","Iran"],
		["IQ","964","Iraq"], ["IE","353","Ireland"], ["IM","44","Isle of Man"], ["IL","972","Israel"],
		["IT","39","Italy"], ["JM","1876","Jamaica"], ["JP","81","Japan"], ["JE","44","Jersey"],
		["JO","962","Jordan"], ["KZ","7","Kazakhstan"], ["KE","254","Kenya"], ["KI","686","Kiribati"],
		["XK","383","Kosovo"], ["KW","965","Kuwait"], ["KG","996","Kyrgyzstan"], ["LA","856","Laos"],
		["LV","371","Latvia"], ["LB","961","Lebanon"], ["LS","266","Lesotho"], ["LR","231","Liberia"],
		["LY","218","Libya"], ["LI","423","Liechtenstein"], ["LT","370","Lithuania"], ["LU","352","Luxembourg"],
		["MO","853","Macau"], ["MK","389","Macedonia"], ["MG","261","Madagascar"], ["MW","265","Malawi"],
		["MY","60","Malaysia"], ["MV","960","Maldives"], ["ML","223","Mali"], ["MT","356","Malta"],
		["MH","692","Marshall Islands"], ["MQ","596","Martinique"], ["MR","222","Mauritania"], ["MU","230","Mauritius"],
		["YT","262","Mayotte"], ["MX","52","Mexico"], ["FM","691","Micronesia"], ["MD","373","Moldova"],
		["MC","377","Monaco"], ["MN","976","Mongolia"], ["ME","382","Montenegro"], ["MS","1664","Montserrat"],
		["MA","212","Morocco"], ["MZ","258","Mozambique"], ["MM","95","Myanmar"], ["NA","264","Namibia"],
		["NR","674","Nauru"], ["NP","977","Nepal"], ["NL","31","Netherlands"], ["NC","687","New Caledonia"],
		["NZ","64","New Zealand"], ["NI","505","Nicaragua"], ["NE","227","Niger"], ["NG","234","Nigeria"],
		["NU","683","Niue"], ["NF","672","Norfolk Island"], ["KP","850","North Korea"], ["MP","1670","Northern Mariana Islands"],
		["NO","47","Norway"], ["OM","968","Oman"], ["PK","92","Pakistan"], ["PW","680","Palau"],
		["PS","970","Palestine"], ["PA","507","Panama"], ["PG","675","Papua New Guinea"], ["PY","595","Paraguay"],
		["PE","51","Peru"], ["PH","63","Philippines"], ["PL","48","Poland"], ["PT","351","Portugal"],
		["PR","1","Puerto Rico"], ["QA","974","Qatar"], ["RE","262","R\u00e9union"], ["RO","40","Romania"],
		["RW","250","Rwanda"], ["BL","590","Saint Barth\u00e9lemy"], ["SH","290","Saint Helena"], ["KN","1869","Saint Kitts and Nevis"],
		["LC","1758","Saint Lucia"], ["MF","590","Saint Martin"], ["PM","508","Saint Pierre and Miquelon"], ["VC","1784","Saint Vincent and the Grenadines"],
		["WS","685","Samoa"], ["SM","378","San Marino"], ["ST","239","S\u00e3o Tom\u00e9 and Pr\u00edncipe"], ["SA","966","Saudi Arabia"],
		["SN","221","Senegal"], ["RS","381","Serbia"], ["SC","248","Seychelles"], ["SL","232","Sierra Leone"],
		["SG","65","Singapore"], ["SX","1721","Sint Maarten"], ["SK","421","Slovakia"], ["SI","386","Slovenia"],
		["SB","677","Solomon Islands"], ["SO","252","Somalia"], ["ZA","27","South Africa"], ["KR","82","South Korea"],
		["SS","211","South Sudan"], ["ES","34","Spain"], ["LK","94","Sri Lanka"], ["SD","249","Sudan"],
		["SR","597","Suriname"], ["SJ","47","Svalbard and Jan Mayen"], ["SZ","268","Swaziland"], ["SE","46","Sweden"],
		["CH","41","Switzerland"], ["SY","963","Syria"], ["TW","886","Taiwan"], ["TJ","992","Tajikistan"],
		["TZ","255","Tanzania"], ["TH","66","Thailand"], ["TL","670","Timor-Leste"], ["TG","228","Togo"],
		["TK","690","Tokelau"], ["TO","676","Tonga"], ["TT","1868","Trinidad and Tobago"], ["TN","216","Tunisia"],
		["TR","90","Turkey"], ["TM","993","Turkmenistan"], ["TC","1649","Turks and Caicos Islands"], ["TV","688","Tuvalu"],
		["VI","1340","U.S. Virgin Islands"], ["UG","256","Uganda"], ["UA","380","Ukraine"], ["AE","971","United Arab Emirates"],
		["GB","44","United Kingdom"], ["US","1","United States"], ["UY","598","Uruguay"], ["UZ","998","Uzbekistan"],
		["VU","678","Vanuatu"], ["VA","39","Vatican City"], ["VE","58","Venezuela"], ["VN","84","Vietnam"],
		["WF","681","Wallis and Futuna"], ["EH","212","Western Sahara"], ["YE","967","Yemen"], ["ZM","260","Zambia"],
		["ZW","263","Zimbabwe"], ["AX","358","\u00c5land Islands"]
	];

	var PREFERRED = [ 'UA', 'CY', 'AE' ];

	/* Where a national number keeps its leading zero after the country code. Everywhere else a
	   single leading zero is the trunk prefix and is dropped: 067... behind +380 is +380 67... */
	var KEEPS_ZERO = [ 'IT', 'SM', 'VA' ];

	/*
	 * How many digits follow the calling code, [fewest, most], where that is known for certain: the
	 * three countries the studio has offices in, the North American plan (+1 and ten digits, which
	 * for the +1xxx islands is the three digit code and seven more) and +7 (ten). It tells a number
	 * typed WITH its calling code but without the "+" ("380671234567") from a national number that
	 * merely starts with the same digits, the way the old widget's libphonenumber did. Anywhere else
	 * the code is taken off only when at least nine digits remain.
	 */
	var NATIONAL_DIGITS = { UA: [ 9, 9 ], CY: [ 8, 8 ], AE: [ 8, 9 ] };

	function nationalDigits( country ) {
		if ( NATIONAL_DIGITS[ country.iso ] ) {
			return NATIONAL_DIGITS[ country.iso ];
		}
		if ( '1' === country.dial.charAt( 0 ) ) {
			return 1 === country.dial.length ? [ 10, 10 ] : [ 7, 7 ];
		}
		if ( '7' === country.dial ) {
			return [ 10, 10 ];
		}
		return [ 9, 14 ];
	}

	/**
	 * The national part of what was typed with no "+" in front, for the chosen country: its calling
	 * code taken off when the digits start with it and the rest has the right length, then one trunk
	 * zero. A Ukrainian number in the old long distance form, 8 0XX XXX XX XX, loses the 8 as well.
	 */
	function nationalPart( digits, country ) {
		var range = nationalDigits( country );
		var keeps = KEEPS_ZERO.indexOf( country.iso ) >= 0;

		if ( 0 === digits.indexOf( country.dial ) ) {
			var rest = digits.slice( country.dial.length );
			if ( rest.length >= range[ 0 ] && rest.length <= range[ 1 ] ) {
				return rest;
			}
			if ( ! keeps && '0' === rest.charAt( 0 ) && rest.length - 1 >= range[ 0 ] && rest.length - 1 <= range[ 1 ] ) {
				return rest.slice( 1 );
			}
		}

		if ( 'UA' === country.iso && /^80\d{9}$/.test( digits ) ) {
			digits = digits.slice( 1 );
		}

		return keeps ? digits : digits.replace( /^0/, '' );
	}

	var regionNames = null;
	try {
		if ( 'ua' === lang && window.Intl && Intl.DisplayNames ) {
			regionNames = new Intl.DisplayNames( [ 'uk' ], { type: 'region' } );
		}
	} catch ( e ) {
		regionNames = null;
	}

	var collator = window.Intl && Intl.Collator ? new Intl.Collator( 'ua' === lang ? 'uk' : 'en' ) : null;

	/** Lower case, no accents, no apostrophes: what a search compares. */
	function fold( text ) {
		var out = String( text ).toLowerCase();
		if ( out.normalize ) {
			out = out.normalize( 'NFD' ).replace( /[\u0300-\u036f]/g, '' );
		}
		return out.replace( /['\u2019\u02bc]/g, '' );
	}

	function countryByIso( iso ) {
		for ( var i = 0; i < COUNTRIES.length; i++ ) {
			if ( COUNTRIES[ i ][ 0 ] === iso ) {
				return { iso: COUNTRIES[ i ][ 0 ], dial: COUNTRIES[ i ][ 1 ], en: COUNTRIES[ i ][ 2 ] };
			}
		}
		return null;
	}

	function localName( iso, english ) {
		if ( regionNames ) {
			try {
				var name = regionNames.of( iso );
				if ( name && name !== iso ) {
					return name;
				}
			} catch ( e ) {
				return english;
			}
		}
		return english;
	}

	var listCount = 0;

	function initPhone( line ) {
		var box      = line.querySelector( '[data-zz-country]' );
		var selector = line.querySelector( '.country-selector' );
		var combo    = line.querySelector( '.country-selector__input' );
		var list     = line.querySelector( '.country-selector__list' );
		var tel      = line.querySelector( 'input[type="tel"]' );

		if ( ! box || ! selector || ! combo || ! list || ! tel ) {
			return null;
		}

		var fallback = countryByIso( line.getAttribute( 'data-zz-default-country' ) || '' );
		var selected = fallback;
		var options  = [];
		var visible  = [];
		var active   = null;
		var moved    = false;
		var empty    = null;
		var built    = false;
		var baseId   = list.id || 'zz-countries-' + ( ++listCount );

		/*
		 * The library's positioning survived in the recovered CSS, its list geometry did not: it
		 * set the height of the panel and of each row inline, and so does this.
		 */
		list.style.maxHeight = '217px';
		list.style.textAlign = 'left';
		list.style.lineHeight = '30px';
		if ( selector.classList.contains( 'is-dark' ) ) {
			list.style.backgroundColor = 'var(--zz-ink)';
		}

		function build() {
			var rows = [];
			for ( var i = 0; i < COUNTRIES.length; i++ ) {
				var row = COUNTRIES[ i ];
				rows.push( {
					iso: row[ 0 ],
					dial: row[ 1 ],
					en: row[ 2 ],
					name: localName( row[ 0 ], row[ 2 ] ),
					rank: PREFERRED.indexOf( row[ 0 ] )
				} );
			}
			rows.sort( function ( a, b ) {
				var ra = a.rank < 0 ? 99 : a.rank;
				var rb = b.rank < 0 ? 99 : b.rank;
				if ( ra !== rb ) {
					return ra - rb;
				}
				return collator ? collator.compare( a.name, b.name ) : ( a.name < b.name ? -1 : 1 );
			} );

			for ( var j = 0; j < rows.length; j++ ) {
				var li   = doc.createElement( 'li' );
				var code = doc.createElement( 'span' );

				li.id        = baseId + '-' + rows[ j ].iso;
				li.className = 'country-selector__list__item';
				li.setAttribute( 'role', 'option' );
				li.setAttribute( 'aria-selected', 'false' );
				li.setAttribute( 'data-iso', rows[ j ].iso );

				code.className     = 'country-selector__list__item__calling-code';
				code.style.display = 'inline-block';
				code.textContent   = '+' + rows[ j ].dial;

				li.appendChild( code );
				li.appendChild( doc.createTextNode( rows[ j ].name ) );
				list.appendChild( li );

				options.push( {
					el: li,
					iso: rows[ j ].iso,
					dial: rows[ j ].dial,
					name: fold( rows[ j ].name ),
					en: fold( rows[ j ].en )
				} );
			}

			empty = doc.createElement( 'li' );
			empty.className = 'country-selector__list__item';
			empty.setAttribute( 'role', 'option' );
			empty.setAttribute( 'aria-disabled', 'true' );
			empty.textContent = labels.noCountry || '';
			empty.hidden = true;
			list.appendChild( empty );

			built = true;
			markSelected();
		}

		function markSelected() {
			for ( var i = 0; i < options.length; i++ ) {
				options[ i ].el.setAttribute( 'aria-selected', selected && options[ i ].iso === selected.iso ? 'true' : 'false' );
			}
		}

		function showSelected() {
			combo.value = selected ? '+' + selected.dial : '';
		}

		function setActive( option ) {
			if ( active ) {
				active.el.classList.remove( 'keyboard-selected' );
			}
			active = option || null;
			if ( ! active ) {
				combo.removeAttribute( 'aria-activedescendant' );
				return;
			}
			active.el.classList.add( 'keyboard-selected' );
			combo.setAttribute( 'aria-activedescendant', active.el.id );

			var top    = active.el.offsetTop;
			var bottom = top + active.el.offsetHeight;
			if ( top < list.scrollTop ) {
				list.scrollTop = top;
			} else if ( bottom > list.scrollTop + list.clientHeight ) {
				list.scrollTop = bottom - list.clientHeight;
			}
		}

		/*
		 * A query of digits (with or without its "+") matches the start of a calling code; words
		 * match the English or the local name, those that start with the query first.
		 */
		function filter( query ) {
			var raw    = String( query || '' ).trim();
			var digits = /^\+?\d+$/.test( raw ) ? raw.replace( /\D/g, '' ) : '';
			var words  = digits ? '' : fold( raw );
			var ranked = [];

			for ( var i = 0; i < options.length; i++ ) {
				var o     = options[ i ];
				var score = -1;

				if ( '' === raw ) {
					score = 0;
				} else if ( digits ) {
					score = 0 === o.dial.indexOf( digits ) ? 0 : -1;
				} else if ( 0 === o.name.indexOf( words ) || 0 === o.en.indexOf( words ) ) {
					score = 0;
				} else if ( o.name.indexOf( ' ' + words ) >= 0 || o.en.indexOf( ' ' + words ) >= 0 ) {
					score = 1;
				} else if ( o.name.indexOf( words ) >= 0 || o.en.indexOf( words ) >= 0 ) {
					score = 2;
				}

				o.el.hidden = score < 0;
				if ( score >= 0 ) {
					ranked.push( { option: o, score: score, order: i } );
				}
			}

			ranked.sort( function ( a, b ) {
				return a.score - b.score || a.order - b.order;
			} );

			visible = [];
			for ( var j = 0; j < ranked.length; j++ ) {
				visible.push( ranked[ j ].option );
				list.insertBefore( ranked[ j ].option.el, empty );
			}
			empty.hidden = visible.length > 0;

			var start = null;
			if ( '' === raw && selected ) {
				for ( var k = 0; k < visible.length; k++ ) {
					if ( visible[ k ].iso === selected.iso ) {
						start = visible[ k ];
					}
				}
			}
			list.scrollTop = 0;
			setActive( start || visible[ 0 ] || null );
			moved = false;
		}

		function isOpen() {
			return ! list.hidden;
		}

		function open() {
			if ( ! built ) {
				build();
			}
			list.hidden = false;
			selector.classList.add( 'has-list-open' );
			combo.setAttribute( 'aria-expanded', 'true' );
			filter( '' );
		}

		function close() {
			list.hidden = true;
			selector.classList.remove( 'has-list-open' );
			combo.setAttribute( 'aria-expanded', 'false' );
			setActive( null );
			showSelected();
		}

		function choose( option ) {
			selected = option ? { iso: option.iso, dial: option.dial } : selected;
			markSelected();
			close();
		}

		function move( step ) {
			if ( ! visible.length ) {
				return;
			}
			var index = visible.indexOf( active );
			index = index < 0 ? 0 : Math.min( visible.length - 1, Math.max( 0, index + step ) );
			setActive( visible[ index ] );
			moved = true;
		}

		/*
		 * Leaving the list without Enter (Tab, or a click somewhere else). What the visitor pointed
		 * at is kept rather than thrown away: a row reached with the arrows, a code typed in full
		 * ("+971"; for a code several countries share, "+44", any of them gives the same number, and
		 * the country already chosen wins if it is one of them), or a name typed far enough that one
		 * country is left. Anything short of that puts the previous code back.
		 */
		function commit() {
			var raw    = String( combo.value || '' ).trim();
			var digits = /^\+?\d+$/.test( raw ) ? raw.replace( /\D/g, '' ) : '';
			var pick   = null;

			if ( moved && active ) {
				pick = active;
			} else if ( digits ) {
				for ( var i = 0; i < visible.length; i++ ) {
					if ( visible[ i ].dial === digits && ( ! pick || ( selected && visible[ i ].iso === selected.iso ) ) ) {
						pick = visible[ i ];
					}
				}
			} else if ( '' !== raw && 1 === visible.length ) {
				pick = visible[ 0 ];
			}

			if ( pick ) {
				choose( pick );
			} else {
				close();
			}
		}

		combo.addEventListener( 'focus', function () {
			combo.select();
		} );

		combo.addEventListener( 'click', function () {
			if ( ! isOpen() ) {
				open();
				combo.select();
			}
		} );

		combo.addEventListener( 'input', function () {
			if ( ! isOpen() ) {
				open();
			}
			filter( combo.value );
		} );

		/*
		 * Escape is stopped here, before it reaches the document: theme.js closes every overlay on
		 * Escape, and the first Escape in an open list should close the list, not the form.
		 */
		combo.addEventListener( 'keydown', function ( event ) {
			var key = event.key;

			if ( 'ArrowDown' === key || 'Down' === key ) {
				event.preventDefault();
				if ( isOpen() ) {
					move( 1 );
				} else {
					open();
				}
			} else if ( 'ArrowUp' === key || 'Up' === key ) {
				event.preventDefault();
				if ( isOpen() ) {
					move( -1 );
				}
			} else if ( 'Enter' === key ) {
				if ( isOpen() ) {
					event.preventDefault();
					if ( active ) {
						choose( active );
					} else {
						close();
					}
				}
			} else if ( 'Escape' === key || 'Esc' === key ) {
				if ( isOpen() ) {
					event.preventDefault();
					event.stopPropagation();
					close();
				}
			} else if ( 'Tab' === key && isOpen() ) {
				commit();
			}
		} );

		// A press inside the list must not take focus away from the field, or the list closes
		// before the click that chooses a country arrives.
		list.addEventListener( 'mousedown', function ( event ) {
			event.preventDefault();
		} );

		list.addEventListener( 'click', function ( event ) {
			var item = event.target.closest( '[data-iso]' );
			if ( ! item ) {
				return;
			}
			for ( var i = 0; i < options.length; i++ ) {
				if ( options[ i ].el === item ) {
					choose( options[ i ] );
					tel.focus();
					return;
				}
			}
		} );

		var toggle = line.querySelector( '.country-selector__toggle' );
		if ( toggle ) {
			toggle.style.cursor = 'pointer';
			toggle.addEventListener( 'mousedown', function ( event ) {
				event.preventDefault();
			} );
			toggle.addEventListener( 'click', function () {
				if ( isOpen() ) {
					close();
				} else {
					combo.focus();
					open();
				}
			} );
		}

		selector.addEventListener( 'focusout', function ( event ) {
			if ( isOpen() && ( ! event.relatedTarget || ! selector.contains( event.relatedTarget ) ) ) {
				commit();
			}
		} );

		box.hidden = false;
		showSelected();

		return {
			tel: tel,

			/**
			 * The number as it is sent. Typed with "+" or "00": as typed, digits only. Otherwise
			 * the chosen code, a space and the national part (nationalPart(): the code typed again
			 * without its "+" and one trunk zero are taken off). No country chosen: exactly what
			 * was typed.
			 */
			fullNumber: function () {
				var raw = tel.value.trim();
				if ( '' === raw ) {
					return '';
				}
				var digits = raw.replace( /\D/g, '' );
				if ( '' === digits ) {
					return raw;
				}
				if ( '+' === raw.charAt( 0 ) ) {
					return '+' + digits;
				}
				if ( 0 === digits.indexOf( '00' ) && digits.length > 8 ) {
					return '+' + digits.slice( 2 );
				}
				if ( ! selected ) {
					return raw;
				}
				return '+' + selected.dial + ' ' + nationalPart( digits, selected );
			},

			reset: function () {
				selected = fallback;
				if ( built ) {
					markSelected();
				}
				close();
			}
		};
	}

	/* -----------------------------------------------------------------
	 * 2. The urgency slider (calculator)
	 *
	 * The field is a native range input laid transparently over the recovered drawing (see
	 * template-parts/case-calc.php). This moves the drawing: the grey cover shrinks from the
	 * right, the handle travels, its colour runs green, yellow, red on the old component's own
	 * formula, and the counter prints the value.
	 * -------------------------------------------------------------- */

	function initUrgency( row ) {
		var range   = row.querySelector( 'input[type="range"]' );
		var cover   = row.querySelector( '[data-zz-urgency-cover]' );
		var handle  = row.querySelector( '[data-zz-urgency-handle]' );
		var circle  = row.querySelector( '[data-zz-urgency-circle]' );
		var counter = row.querySelector( '[data-zz-urgency-counter]' );

		if ( ! range || ! cover || ! handle || ! circle || ! counter ) {
			return null;
		}

		function paint() {
			var value = Math.max( 0, Math.min( 100, Math.round( Number( range.value ) || 0 ) ) );
			var rest  = 1 - value / 100;
			var r;
			var g;
			var b;
			var n;

			cover.style.transform = 'scaleX(' + ( rest > 0 ? rest.toFixed( 3 ) : 0 ) + ')';
			handle.style.left     = value + '%';

			if ( value <= 50 ) {
				n = Number( ( value / 50 ).toFixed( 1 ) );
				r = 126 * n + 118;
				g = 25 * n + 174;
				b = -50 * n + 83;
			} else {
				n = Number( ( value / 100 ).toFixed( 1 ) );
				r = -29 * n + 244;
				g = -117 * n + 199;
				b = 49 * n + 33;
			}

			var colour = 'rgb(' + Math.round( r ) + ',' + Math.round( g ) + ',' + Math.round( b ) + ')';
			circle.style.background  = colour;
			circle.style.borderColor = colour;

			counter.textContent = value + '%';
			range.setAttribute( 'aria-valuetext', value + '%' );
		}

		range.addEventListener( 'input', paint );
		range.addEventListener( 'change', paint );

		// The range itself is transparent, so its focus is drawn on the handle instead.
		range.addEventListener( 'focus', function () {
			circle.style.boxShadow = 'inset 0 0 0 2px #fff, 0 0 0 2px #474747';
		} );
		range.addEventListener( 'blur', function () {
			circle.style.boxShadow = '';
		} );

		paint();
		return paint;
	}

	/* -----------------------------------------------------------------
	 * 3. The file row (CV form)
	 * -------------------------------------------------------------- */

	function shortName( name ) {
		if ( name.length <= 24 ) {
			return name;
		}
		var dot  = name.lastIndexOf( '.' );
		var ext  = dot > 0 ? name.slice( dot ) : '';
		var base = dot > 0 ? name.slice( 0, dot ) : name;
		return base.slice( 0, 12 ) + '...' + base.slice( -5 ) + ext;
	}

	function initFile( box ) {
		var input  = box.querySelector( 'input[type="file"]' );
		var chosen = box.querySelector( '[data-zz-file-chosen]' );
		var name   = box.querySelector( '[data-zz-file-name]' );
		var remove = box.querySelector( '[data-zz-file-remove]' );

		if ( ! input || ! chosen || ! name ) {
			return null;
		}

		function paint() {
			var file = input.files && input.files[ 0 ];
			chosen.hidden    = ! file;
			name.textContent = file ? shortName( file.name ) : '';
			if ( file ) {
				name.setAttribute( 'title', file.name );
			} else {
				name.removeAttribute( 'title' );
			}
		}

		input.addEventListener( 'change', paint );

		if ( remove ) {
			remove.addEventListener( 'click', function () {
				input.value = '';
				paint();
				clearError( box );
				input.focus();
			} );
		}

		paint();
		return paint;
	}

	/* -----------------------------------------------------------------
	 * 4. Errors
	 *
	 * Beside a field: the row gets `errorfield`, the class the recovered CSS turns the row's
	 * `.form__error` red and visible with, and the field gets `aria-invalid` and an
	 * `aria-describedby` that points at the error for as long as it is showing. Rows that were
	 * printed without an error line (the object type, a message) get one made for the occasion
	 * and lose it again when the error goes.
	 *
	 * Above the button: `[data-zz-form-status]`, a `role="alert"` region, for what is not about
	 * one field. For a screen reader after a rejected submission: focus goes to the first field in
	 * error, which reads its own error out, and the polite `[data-zz-form-summary]` region adds
	 * "please check the highlighted fields" once that is done.
	 * -------------------------------------------------------------- */

	function rowOf( el ) {
		return el ? el.closest( '.form__line, .form__file' ) : null;
	}

	function fieldsOf( form, name ) {
		var found = form.querySelectorAll( '[name]' );
		var out   = [];
		for ( var i = 0; i < found.length; i++ ) {
			if ( found[ i ].getAttribute( 'name' ) === name && 'hidden' !== found[ i ].type ) {
				out.push( found[ i ] );
			}
		}
		return out;
	}

	function describe( el, id, on ) {
		var ids = ( el.getAttribute( 'aria-describedby' ) || '' ).split( /\s+/ ).filter( function ( token ) {
			return token && token !== id;
		} );
		if ( on ) {
			ids.push( id );
		}
		if ( ids.length ) {
			el.setAttribute( 'aria-describedby', ids.join( ' ' ) );
		} else {
			el.removeAttribute( 'aria-describedby' );
		}
	}

	var errorCount = 0;

	/**
	 * Shows an error on the row of a named field. Returns the element to focus, or null when the
	 * form has no such field.
	 */
	function showError( form, name, text ) {
		var fields = fieldsOf( form, name );
		var row    = rowOf( fields[ 0 ] );

		if ( ! fields.length || ! row ) {
			return null;
		}

		var error = row.querySelector( '.form__error' );
		if ( ! error ) {
			error = doc.createElement( 'div' );
			error.className = 'form__error';
			error.setAttribute( 'data-zz-made', '' );
			row.appendChild( error );
		}
		if ( ! error.id ) {
			error.id = 'zz-form-error-' + ( ++errorCount );
		}
		if ( ! error.hasAttribute( 'data-zz-default' ) ) {
			error.setAttribute( 'data-zz-default', error.textContent );
		}
		error.textContent = text || error.getAttribute( 'data-zz-default' );

		row.classList.add( 'errorfield' );

		for ( var i = 0; i < fields.length; i++ ) {
			fields[ i ].setAttribute( 'aria-invalid', 'true' );
			describe( fields[ i ], error.id, true );
		}

		return fields[ 0 ];
	}

	function clearError( row ) {
		if ( ! row || ! row.classList.contains( 'errorfield' ) ) {
			return;
		}
		row.classList.remove( 'errorfield' );

		var error  = row.querySelector( '.form__error' );
		var fields = row.querySelectorAll( '[aria-invalid]' );
		for ( var i = 0; i < fields.length; i++ ) {
			fields[ i ].removeAttribute( 'aria-invalid' );
			if ( error && error.id ) {
				describe( fields[ i ], error.id, false );
			}
		}
		if ( error && error.hasAttribute( 'data-zz-made' ) ) {
			error.parentNode.removeChild( error );
		}
	}

	function setStatus( form, text ) {
		var box = form.querySelector( '[data-zz-form-status]' );
		if ( ! box ) {
			return;
		}
		var line = box.querySelector( '.form__error' ) || box;
		// The server may have printed a thank-you line here with a colour of its own
		// (zz_form_status() in inc/forms.php); whatever is written now is the script's.
		line.removeAttribute( 'style' );
		line.textContent = text || '';
		box.classList.toggle( 'errorfield', !! text );
	}

	function announce( form, text ) {
		var region = form.querySelector( '[data-zz-form-summary]' );
		if ( ! region ) {
			return;
		}
		region.textContent = '';
		window.setTimeout( function () {
			region.textContent = text || '';
		}, 400 );
	}

	function clearAll( form ) {
		var rows = form.querySelectorAll( '.errorfield' );
		for ( var i = 0; i < rows.length; i++ ) {
			if ( rows[ i ].hasAttribute( 'data-zz-form-status' ) ) {
				continue;
			}
			clearError( rows[ i ] );
		}
		setStatus( form, '' );
		var region = form.querySelector( '[data-zz-form-summary]' );
		if ( region ) {
			region.textContent = '';
		}
	}

	function firstInDocument( a, b ) {
		if ( ! a ) {
			return b;
		}
		if ( ! b ) {
			return a;
		}
		return a.compareDocumentPosition( b ) & Node.DOCUMENT_POSITION_PRECEDING ? b : a;
	}

	/*
	 * Before sending, only what the endpoint is known to insist on and the page can tell for
	 * certain: a field printed as required that is empty (the name, the vacancy, and the e-mail of
	 * the quote, calculator and service forms) and a CV over the endpoint's 10 MB. Everything else,
	 * the shape of an e-mail address included, is the endpoint's call, and its 422 says so.
	 */
	function checkBeforeSending( form ) {
		var first    = null;
		var required = form.querySelectorAll( '[required]' );

		for ( var i = 0; i < required.length; i++ ) {
			if ( '' === String( required[ i ].value ).trim() ) {
				first = firstInDocument( first, showError( form, required[ i ].getAttribute( 'name' ), '' ) );
			}
		}

		var limit = ( Number( config.maxFileMb ) || 0 ) * 1024 * 1024;
		var files = form.querySelectorAll( 'input[type="file"]' );
		for ( var j = 0; j < files.length; j++ ) {
			var file = files[ j ].files && files[ j ].files[ 0 ];
			if ( limit && file && file.size > limit ) {
				first = firstInDocument( first, showError( form, files[ j ].getAttribute( 'name' ), labels.fileTooLarge ) );
			}
		}

		return first;
	}

	function focusField( field ) {
		if ( ! field ) {
			return;
		}
		try {
			field.focus( { preventScroll: false } );
		} catch ( e ) {
			field.focus();
		}
	}

	/* -----------------------------------------------------------------
	 * Labels that step aside
	 *
	 * The recovered CSS lifts a label out of its field while the field has focus
	 * (`input:focus + label`) and keeps it lifted while it holds something (`.full`). The old
	 * component toggled `full` from its data; this does it from the field.
	 * -------------------------------------------------------------- */

	function syncLabel( field ) {
		if ( ! field || ! field.closest ) {
			return;
		}
		if ( 'radio' === field.type || 'range' === field.type || 'file' === field.type || 'hidden' === field.type ) {
			return;
		}
		var row = field.closest( '.form__line' );
		if ( ! row || row.hasAttribute( 'data-zz-phone' ) ) {
			return;
		}
		var label = row.querySelector( 'label' );
		if ( label && label.getAttribute( 'for' ) === field.id ) {
			label.classList.toggle( 'full', '' !== field.value );
		}
	}

	function syncLabels( form ) {
		var fields = form.querySelectorAll( 'input' );
		for ( var i = 0; i < fields.length; i++ ) {
			syncLabel( fields[ i ] );
		}
	}

	/* -----------------------------------------------------------------
	 * 5. Sending
	 * -------------------------------------------------------------- */

	/*
	 * HOW LONG A REQUEST MAY TAKE, AND WHAT "NO ANSWER" MEANS.
	 *
	 * There is no deadline for the whole request. A CV of 10 MB takes over a minute to go up on a
	 * weak mobile line, and a fixed timer would cut every such upload off halfway and tell the
	 * visitor there is no connection, on every retry. So the request is watched in two stages:
	 *
	 *   going up    the timer restarts on every byte that leaves (`xhr.upload` progress) and fires
	 *               only when nothing has moved for STALL_MS. The body never reached the server, so
	 *               "not sent" is true, and the words say the connection stopped (labels.stalled).
	 *   answering   the whole body is up; now the server stores the request and sends its e-mail.
	 *               ANSWER_MS is a last resort for a connection that died without saying so. From
	 *               this point a lost answer, a cut connection or a proxy's own error page do NOT
	 *               mean "not sent": the request may be in the admin already, and the visitor is
	 *               asked to wait before sending it again (labels.unsure) instead of sending a copy.
	 *
	 * XMLHttpRequest rather than fetch for exactly this: fetch reports no upload progress.
	 */
	var STALL_MS  = 30000;
	var ANSWER_MS = 180000;

	/*
	 * The token's lower age limit. The endpoint refuses a `zz_token` younger than
	 * `config.tokenMinAge` seconds (3), counted in whole seconds from the moment the page was built.
	 * The page was built before this script started, so a submission is held until that many seconds
	 * plus one have passed since start(): an autofilled form sent at once waits a moment behind its
	 * "Sending..." label instead of being refused. If the endpoint refuses it anyway (a clock that
	 * differs between two servers), a refusal in the first RETRY_WITHIN_MS is retried once, quietly.
	 */
	var TOKEN_WAIT_MS   = ( ( 'number' === typeof config.tokenMinAge ? config.tokenMinAge : 3 ) + 1 ) * 1000;
	var RETRY_WITHIN_MS = 15000;
	var RETRY_AFTER_MS  = 3500;

	var readyAt = 0;

	function clock() {
		return window.performance && performance.now ? performance.now() : Date.now();
	}

	/*
	 * One request per form at a time. The button is marked busy rather than `disabled`: a disabled
	 * button drops the keyboard focus that is sitting on it, and a visitor who pressed Enter would
	 * find focus thrown back to the top of the page. The `busy` flag is what refuses the second
	 * press. While a CV goes up the label carries the share that has left, "Sending 42%".
	 */
	function setBusy( form, busy, percent ) {
		form.zzBusy = busy;
		form.setAttribute( 'aria-busy', busy ? 'true' : 'false' );

		var button = form.querySelector( '.form__btn' );
		if ( ! button ) {
			return;
		}
		button.setAttribute( 'aria-disabled', busy ? 'true' : 'false' );
		button.style.cursor = busy ? 'progress' : '';

		var word  = labels.sending || '';
		var label = 'number' === typeof percent ? word + ' ' + percent + '%' : word + '...';

		var spans = button.querySelectorAll( 'span' );
		for ( var i = 0; i < spans.length; i++ ) {
			if ( ! spans[ i ].hasAttribute( 'data-zz-label' ) ) {
				spans[ i ].setAttribute( 'data-zz-label', spans[ i ].textContent );
			}
			spans[ i ].textContent = busy ? label : spans[ i ].getAttribute( 'data-zz-label' );
		}
	}

	function resetForm( form ) {
		form.reset();
		clearAll( form );
		for ( var i = 0; i < form.zzResets.length; i++ ) {
			form.zzResets[ i ]();
		}
		syncLabels( form );
	}

	/*
	 * THE THANK-YOU ADDRESS.
	 *
	 * The old site showed its thank-you as a page of its own: on success its router moved to
	 * `/contacts-thanks/`, `/thanks/` or `/contacts-thanks-careers/` (inc/forms.php,
	 * zz_form_thanks_path(), has the evidence), and GTM-55Q7QV92 or an ads account may count a
	 * conversion by that address. So while the thank-you overlay is open the address bar says the
	 * same, through history.pushState(), which is also what the tag manager's history trigger and a
	 * pixel's own page view tracking listen to. When the overlay closes, history.back() returns to
	 * the page's own address and leaves no extra step in the history; the Back button while it is
	 * open closes it, the way it left the old thank-you page. `thanksPushed` keeps all of that to
	 * the entry this page made itself.
	 */
	var thanksPushed = false;

	function onThanksAddress() {
		return thanksPushed && !! window.history.state && true === window.history.state.zzThanks;
	}

	function enterThanksAddress( type ) {
		var path = config.thanksPaths && config.thanksPaths[ type ];
		if ( ! path || ! window.history || 'function' !== typeof window.history.pushState ) {
			return;
		}
		try {
			window.history.pushState( { zzThanks: true }, '', path );
			thanksPushed = true;
		} catch ( e ) {
			thanksPushed = false;
		}
	}

	function leaveThanksAddress() {
		if ( onThanksAddress() ) {
			thanksPushed = false;
			window.history.back();
		}
	}

	window.addEventListener( 'popstate', function () {
		if ( ! thanksPushed || onThanksAddress() ) {
			return;
		}
		thanksPushed = false;
		var thanks = modalByName( 'thanks' );
		if ( thanks && thanks.classList.contains( 'thanks_active' ) && window.ZZ && window.ZZ.close ) {
			window.ZZ.close();
		}
	} );

	function thank( form, message ) {
		var type   = form.getAttribute( 'data-zz-form' );
		var modal  = form.closest( '[data-zz-modal]' );
		var text   = doc.querySelector( '[data-zz-thanks-text]' );
		var thanks = modalByName( 'thanks' );

		if ( text ) {
			text.textContent = message || ( config.thanks && config.thanks[ type ] ) || text.textContent;
		}

		if ( window.dataLayer && 'function' === typeof window.dataLayer.push ) {
			window.dataLayer.push( { event: 'zz_form_submit', form: type } );
		}

		// theme.js closes the quote overlay itself when it opens the thank-you one; the others
		// are closed here first, or the thank-you card would open underneath them.
		if ( modal && 'quote' !== modal.getAttribute( 'data-zz-modal' ) ) {
			hideModal( modal );
		}
		if ( ! modal ) {
			returnFocus = form.querySelector( '.form__btn' );
		}

		if ( window.ZZ && 'function' === typeof window.ZZ.thanks ) {
			window.ZZ.thanks();
		}

		// Only with the overlay really open, or nothing would ever take the address back.
		if ( thanks && thanks.classList.contains( 'thanks_active' ) ) {
			enterThanksAddress( type );
		}

		// The old thank-you overlay reported a Lead to the Facebook pixel when it opened. The pixel
		// is only on the page once inc/analytics.php has an id for it.
		if ( 'function' === typeof window.fbq ) {
			window.fbq( 'track', 'Lead' );
		}
	}

	function answer( form, status, json ) {
		var code = json && json.code;

		if ( status >= 200 && status < 300 && json && true === json.ok ) {
			resetForm( form );
			thank( form, json.message );
			return;
		}

		if ( 422 === status || 'invalid' === code ) {
			var errors = ( json && json.errors ) || {};
			var first  = null;
			var loose  = [];
			var names  = Object.keys( errors );

			var shown   = [];

			for ( var i = 0; i < names.length; i++ ) {
				var text  = String( errors[ names[ i ] ] );
				var field = showError( form, names[ i ], text );
				if ( field ) {
					first = firstInDocument( first, field );
					shown.push( text );
				} else {
					loose.push( text );
				}
			}

			/*
			 * An error for a field this form does not print goes above the button - unless the same
			 * sentence is already beside a field. The CV form is the case in point: the endpoint's
			 * "phone or email" rule names both fields, and that form only has the telephone.
			 */
			loose = loose.filter( function ( text, index ) {
				return shown.indexOf( text ) < 0 && loose.indexOf( text ) === index;
			} );

			if ( loose.length || ! first ) {
				setStatus( form, loose.length ? loose.join( ' ' ) : ( ( json && json.message ) || labels.checkFields ) );
			}
			focusField( first );
			announce( form, ( json && json.message ) || labels.checkFields );
			return;
		}

		if ( 'bad_token' === code ) {
			// A token too young to be accepted is the only refusal that can come this early, and
			// waiting is its cure: the visitor keeps their "Sending..." and never sees it.
			if ( ! form.zzRetried && clock() - readyAt < RETRY_WITHIN_MS ) {
				form.zzRetried = true;
				setBusy( form, true );
				window.setTimeout( function () {
					post( form );
				}, RETRY_AFTER_MS );
				return;
			}
			setStatus( form, ( json && json.message ) || labels.badToken );
			return;
		}

		if ( 429 === status || 'rate_limited' === code ) {
			setStatus( form, ( json && json.message ) || labels.rateLimited );
			return;
		}

		// A page that is not the endpoint's JSON, with a 5xx: a proxy that gave up waiting, or a
		// fatal error after the request was stored. The whole body had arrived, so it may be in.
		if ( ! json && status >= 500 ) {
			setStatus( form, labels.unsure );
			return;
		}

		// The endpoint's own 500 (nothing stored), a 404, a 405: the request did not arrive.
		setStatus( form, labels.failed );
	}

	function formData( form ) {
		var data  = new FormData( form );
		var phone = form.querySelector( '[data-zz-phone]' );

		if ( phone && phone.zzPhone ) {
			data.set( 'formdata_phone', phone.zzPhone.fullNumber() );
		}
		data.set( 'page_url', window.location.href );

		// An empty file input still adds an empty part; leave the field out instead.
		var files = form.querySelectorAll( 'input[type="file"]' );
		for ( var i = 0; i < files.length; i++ ) {
			if ( ! files[ i ].files || ! files[ i ].files.length ) {
				data.delete( files[ i ].getAttribute( 'name' ) );
			}
		}

		return data;
	}

	function hasChosenFile( form ) {
		var files = form.querySelectorAll( 'input[type="file"]' );
		for ( var i = 0; i < files.length; i++ ) {
			if ( files[ i ].files && files[ i ].files.length ) {
				return true;
			}
		}
		return false;
	}

	/** Sends the form now. The two stages and their timers are described above STALL_MS. */
	function post( form ) {
		var xhr      = new XMLHttpRequest();
		var withFile = hasChosenFile( form );
		var sent     = false;
		var ended    = false;
		var reason   = '';
		var timer    = null;

		function watch( ms, why ) {
			window.clearTimeout( timer );
			timer = window.setTimeout( function () {
				reason = why;
				xhr.abort();
			}, ms );
		}

		function end() {
			if ( ended ) {
				return false;
			}
			ended = true;
			window.clearTimeout( timer );
			setBusy( form, false );
			return true;
		}

		xhr.upload.addEventListener( 'progress', function ( event ) {
			if ( sent ) {
				return;
			}
			watch( STALL_MS, 'stalled' );
			if ( withFile && event.lengthComputable && event.total > 0 ) {
				setBusy( form, true, Math.min( 99, Math.floor( ( 100 * event.loaded ) / event.total ) ) );
			}
		} );

		xhr.upload.addEventListener( 'load', function () {
			sent = true;
			watch( ANSWER_MS, 'unanswered' );
			if ( withFile ) {
				setBusy( form, true );
			}
		} );

		xhr.addEventListener( 'load', function () {
			if ( ! end() ) {
				return;
			}
			var json = null;
			try {
				json = JSON.parse( xhr.responseText );
			} catch ( e ) {
				json = null;
			}
			answer( form, xhr.status, json );
		} );

		xhr.addEventListener( 'error', function () {
			if ( end() ) {
				setStatus( form, sent ? labels.unsure : labels.network );
			}
		} );

		xhr.addEventListener( 'abort', function () {
			if ( end() ) {
				setStatus( form, 'stalled' === reason ? labels.stalled : labels.unsure );
			}
		} );

		setBusy( form, true );
		xhr.open( 'POST', form.getAttribute( 'action' ) );
		xhr.setRequestHeader( 'Accept', 'application/json' );
		watch( STALL_MS, 'stalled' );
		xhr.send( formData( form ) );
	}

	/** Sends the form once its token is old enough to be accepted (see TOKEN_WAIT_MS). */
	function send( form ) {
		var hold = TOKEN_WAIT_MS - ( clock() - readyAt );

		setBusy( form, true );
		if ( hold > 0 ) {
			window.setTimeout( function () {
				post( form );
			}, hold );
			return;
		}
		post( form );
	}

	function onSubmit( event ) {
		var form = event.currentTarget;
		event.preventDefault();

		if ( form.zzBusy ) {
			return;
		}

		clearAll( form );

		var invalid = checkBeforeSending( form );
		if ( invalid ) {
			focusField( invalid );
			announce( form, labels.checkFields );
			return;
		}

		send( form );
	}

	function onEdit( event ) {
		var field = event.target;
		if ( ! field || ! field.closest ) {
			return;
		}
		clearError( rowOf( field ) );
		syncLabel( field );
	}

	function initForm( form ) {
		if ( form.zzReady ) {
			return;
		}
		form.zzReady  = true;
		form.zzResets = [];

		// The browser's own check is for visitors without this file (inc/forms.php); from here on
		// the errors are the ones section 4 draws.
		form.noValidate = true;

		var phones = form.querySelectorAll( '[data-zz-phone]' );
		for ( var i = 0; i < phones.length; i++ ) {
			phones[ i ].zzPhone = initPhone( phones[ i ] );
			if ( phones[ i ].zzPhone ) {
				form.zzResets.push( phones[ i ].zzPhone.reset );
			}
		}

		var urgency = form.querySelectorAll( '[data-zz-urgency]' );
		for ( var j = 0; j < urgency.length; j++ ) {
			var repaint = initUrgency( urgency[ j ] );
			if ( repaint ) {
				form.zzResets.push( repaint );
			}
		}

		var files = form.querySelectorAll( '[data-zz-file]' );
		for ( var k = 0; k < files.length; k++ ) {
			var refill = initFile( files[ k ] );
			if ( refill ) {
				form.zzResets.push( refill );
			}
		}

		form.addEventListener( 'submit', onSubmit );
		form.addEventListener( 'input', onEdit );
		form.addEventListener( 'change', onEdit );

		syncLabels( form );
	}

	/* -----------------------------------------------------------------
	 * 6. The overlays
	 *
	 * theme.js opens any overlay by name but closes two by name, `quote` and `thanks`
	 * (inc/vpages.php closes the CV one). The calculator is closed here: its class, `aria-hidden`
	 * and `inert` go on the same close controls, dimmed area and Escape that close the others.
	 * These listeners are added when this file runs, before theme.js adds its own on
	 * DOMContentLoaded, so the calculator is already shut when theme.js checks whether anything
	 * is still open and releases the page's scroll.
	 * -------------------------------------------------------------- */

	var CLOSED_BY_THEME = [ 'quote', 'thanks' ];

	function modalByName( name ) {
		return doc.querySelector( '[data-zz-modal="' + name + '"]' );
	}

	function isActive( modal ) {
		return modal.classList.contains( 'calc_active' ) || modal.classList.contains( 'thanks_active' );
	}

	function hideModal( modal ) {
		modal.classList.remove( 'calc_active' );
		modal.setAttribute( 'aria-hidden', 'true' );
		modal.setAttribute( 'inert', '' );
	}

	function anyOpen() {
		return doc.querySelector( '[data-zz-modal].calc_active, [data-zz-modal].thanks_active' );
	}

	function closeOthers() {
		var open    = doc.querySelectorAll( '[data-zz-modal].calc_active' );
		var changed = false;

		for ( var i = 0; i < open.length; i++ ) {
			if ( CLOSED_BY_THEME.indexOf( open[ i ].getAttribute( 'data-zz-modal' ) ) < 0 ) {
				hideModal( open[ i ] );
				changed = true;
			}
		}

		// If theme.js has already run its check, let it run it again now that nothing is open:
		// it keeps its own record of the scroll lock and is the one that should release it.
		if ( changed && ! anyOpen() && 'hidden' === html.style.overflow && window.ZZ && window.ZZ.close ) {
			window.ZZ.close();
		}
	}

	doc.addEventListener( 'click', function ( event ) {
		var target = event.target;
		if ( ! target.closest ) {
			return;
		}
		if ( target.closest( '[data-zz-close]' ) || ( target.hasAttribute( 'data-zz-modal' ) && isActive( target ) ) ) {
			closeOthers();
		}
	} );

	doc.addEventListener( 'keydown', function ( event ) {
		if ( 'Escape' === event.key || 'Esc' === event.key ) {
			closeOthers();
		}
	} );

	/*
	 * Focus. theme.js moves focus into an overlay when it opens, to the first control it finds;
	 * on a phone that is the corner cross the stylesheet hides there, and focus goes nowhere. So
	 * a moment later this checks, and moves it to the first control that is actually shown. While
	 * an overlay is open Tab cycles inside it; when the last one closes, focus goes back to the
	 * control that opened it (after a successful submission, through the thank-you overlay). The same
	 * watch on the overlays' classes gives the address bar back when the thank-you overlay closes.
	 */

	var returnFocus = null;

	function isShown( el ) {
		if ( ! el || ! el.getClientRects().length ) {
			return false;
		}
		var style = window.getComputedStyle( el );
		return 'hidden' !== style.visibility && 'none' !== style.display;
	}

	function focusables( root ) {
		var found = root.querySelectorAll(
			'a[href], button, input:not([type="hidden"]), select, textarea, [tabindex]'
		);
		var out = [];
		for ( var i = 0; i < found.length; i++ ) {
			var el = found[ i ];
			if ( el.tabIndex < 0 || el.disabled || el.closest( '[hidden], [aria-hidden="true"]:not([data-zz-modal])' ) ) {
				continue;
			}
			if ( 'radio' === el.type && ! el.checked && el.form ) {
				var group = el.form.querySelector( 'input[type="radio"][name="' + el.name + '"]:checked' );
				if ( group || el !== el.form.querySelector( 'input[type="radio"][name="' + el.name + '"]' ) ) {
					continue;
				}
			}
			if ( isShown( el ) ) {
				out.push( el );
			}
		}
		return out;
	}

	function topModal() {
		return doc.querySelector( '[data-zz-modal].thanks_active' ) || doc.querySelector( '[data-zz-modal].calc_active' );
	}

	doc.addEventListener( 'click', function ( event ) {
		var opener = event.target.closest ? event.target.closest( '[data-zz-open]' ) : null;
		if ( ! opener ) {
			return;
		}
		returnFocus = opener;
		fillVacancy( opener );

		var modal = modalByName( opener.getAttribute( 'data-zz-open' ) );
		window.setTimeout( function () {
			if ( ! modal || ! isActive( modal ) ) {
				return;
			}
			var current = doc.activeElement;
			if ( current && modal.contains( current ) && isShown( current ) ) {
				return;
			}
			var items = focusables( modal );
			if ( items.length ) {
				items[ 0 ].focus();
			}
		}, 60 );
	} );

	doc.addEventListener( 'keydown', function ( event ) {
		if ( 'Tab' !== event.key ) {
			return;
		}
		var modal = topModal();
		if ( ! modal ) {
			return;
		}
		var items = focusables( modal );
		if ( ! items.length ) {
			return;
		}
		var first   = items[ 0 ];
		var last    = items[ items.length - 1 ];
		var current = doc.activeElement;

		if ( ! modal.contains( current ) ) {
			event.preventDefault();
			first.focus();
		} else if ( event.shiftKey && current === first ) {
			event.preventDefault();
			last.focus();
		} else if ( ! event.shiftKey && current === last ) {
			event.preventDefault();
			first.focus();
		}
	} );

	function watchModals() {
		if ( ! window.MutationObserver ) {
			return;
		}
		var observer = new MutationObserver( function () {
			var thanks = modalByName( 'thanks' );
			if ( ! thanks || ! thanks.classList.contains( 'thanks_active' ) ) {
				leaveThanksAddress();
			}
			if ( anyOpen() || ! returnFocus ) {
				return;
			}
			var target  = returnFocus;
			var current = doc.activeElement;
			returnFocus = null;
			if ( ! isShown( target ) ) {
				return;
			}
			if ( ! current || current === doc.body || current.closest( '[data-zz-modal]' ) ) {
				target.focus();
			}
		} );
		var modals = doc.querySelectorAll( '[data-zz-modal]' );
		for ( var i = 0; i < modals.length; i++ ) {
			observer.observe( modals[ i ], { attributes: true, attributeFilter: [ 'class' ] } );
		}
	}

	/*
	 * The vacancy a CV form was opened from. The "send request" button of each vacancy sits in
	 * the same `.vi` as the vacancy's heading; the band at the foot of the page belongs to no
	 * vacancy and leaves the field as it is.
	 */
	function fillVacancy( opener ) {
		if ( 'resume' !== opener.getAttribute( 'data-zz-open' ) ) {
			return;
		}
		var item    = opener.closest( '.vi' );
		var heading = item ? item.querySelector( '.vi__btn > span' ) : null;
		var field   = doc.querySelector( '[data-zz-modal="resume"] [data-zz-vacancy]' );
		if ( ! heading || ! field ) {
			return;
		}
		field.value = heading.textContent.replace( /\s+/g, ' ' ).trim();
		clearError( rowOf( field ) );
		syncLabel( field );
	}

	/*
	 * `can-hover`, which the form buttons' hover animation needs.
	 *
	 * The old site added it to <body> when the device has a pointer that hovers
	 * (`matchMedia("(hover: none)")`, _nuxt/0e9b892.js). The CSS builder scoped those rules per page
	 * as `body.zz-page-case .can-hover .calc .form__btn:hover ...`, which needs the class on an
	 * element INSIDE body, and nothing in the theme set it at all. The result, measured on a case
	 * page: hovering "Send request" fades its first label out and never brings the second one in,
	 * so the button goes blank under the pointer. Twenty four of the twenty six `.can-hover`
	 * selectors in the bundle are the buttons of these overlays; the other two are the filter
	 * underline on the project catalogue, which the old site animated the same way. #app is the
	 * one element inside body that holds every overlay.
	 */
	function markHover() {
		var app = doc.getElementById( 'app' );
		if ( app && window.matchMedia && ! window.matchMedia( '(hover: none)' ).matches ) {
			app.classList.add( 'can-hover' );
		}
	}

	function start() {
		readyAt = clock();
		markHover();

		var forms = doc.querySelectorAll( 'form[data-zz-form]' );
		for ( var i = 0; i < forms.length; i++ ) {
			initForm( forms[ i ] );
		}
		watchModals();

		// Values a browser restores or autofills after the first paint.
		window.addEventListener( 'load', function () {
			for ( var j = 0; j < forms.length; j++ ) {
				syncLabels( forms[ j ] );
			}
		} );
	}

	if ( 'loading' === doc.readyState ) {
		doc.addEventListener( 'DOMContentLoaded', start );
	} else {
		start();
	}
}() );
