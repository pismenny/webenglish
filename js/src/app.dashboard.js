	/*
	 * Dashboard slider component
	 */
	(function() {
		if ( !$('.js-cost').length )
			return;

		var	_cost = $('.js-cost').unselectable(),
			_plus = $('.js-plus', _cost),
			_minus = $('.js-minus', _cost),
			_value = $('.js-cost-value', _cost),
			_slider = $('.js-slider', _cost),
			_sliderBar = $('.js-slider-bar', _slider),
			_sliderButton = $('.js-slider-button', _slider),
			url = _cost.data('url'),
			cost = _cost.data('cost'),
			maxCost = _cost.data('maxcost'),
			minCost = _cost.data('mincost'),
			maxLeft = _sliderBar.width() - _sliderButton.width(),
			left = 0,
			step = 0.1;

		function format(value, euro) {
			value = value.toFixed(1);
			value = value.toString();
			value = value.replace('.', ',');
			return (euro ? '&euro;' : '') + value;
		}

		_plus.click(function() {
			cost = Math.min(maxCost, cost + step);
			_value
				.add(_slider)
				.trigger('update');
			return false;
		});

		_minus.click(function() {
			cost = Math.max(minCost, cost - step);
			_value
				.add(_slider)
				.trigger('update');
			return false;
		});

		_value.on('update', function(e, fade) {
			_value.html( format(cost, true) );

			$.ajax(url, {
				type: 'POST',
				data: { cost: cost.toFixed(1) },
				complete: function() {
					// Do nothing
				}
			});

			if ( fade ) { // ugly animation
				var	minValue = 0,
					maxValue = 100,
					halfValue = maxValue / 2,
					amplitude = 0.1,
					scale;

				_value
					.css('top', minValue)
					.animate({ top: maxValue }, {
						step: function(i) {
							if ( i < halfValue  )
								scale = amplitude * (i / halfValue);
							else
								scale = amplitude - amplitude * ((i - halfValue) / halfValue);
							scale += 1; 
							_value
								.css('-webkit-transform','scale(' + scale + ')')
								.css('-moz-transform','scale(' + scale + ')')
								.css('-ms-transform','scale(' + scale + ')')
								.css('-o-transform','scale(' + scale + ')')
								.css('transform','scale(' + scale + ')');
						},
						duration: 100
					}, 'swing');
			}
		});

		_slider
			.on('init', function() {
				var	startX, startLeft;
				_sliderButton
					.mousedown(function(e) {
						startX = e.clientX;
						startLeft = left;
						_doc
							.on('mousemove.slider', function(e) {
								var	dX = e.clientX - startX;
								left = startLeft + dX;
								left = Math.min(left, maxLeft);
								left = Math.max(left, 0);
								_slider.trigger('reverse_update');
							})
							.on('mouseup.slider', function(e) {
								_doc.off('.slider');
								_value.trigger('update', true);
							});
					});
			})
			.on('reverse_update', function() {
				cost = minCost + (left / maxLeft) * (maxCost - minCost);
				_sliderButton
					.css('left', left + 'px')
					.html( format(cost) );
			})
			.on('update', function() {
				left = ((cost - minCost) / (maxCost - minCost)) * maxLeft;
				_sliderButton
					.css('left', left + 'px')
					.html( format(cost) );
			})
			.trigger('update')
			.trigger('init');
	})();

	/*
	 * Dashboard queue component
	 */
	(function() {
		if ( !$('.js-queue').length )
			return;

		var	_summary = $('.js-queue-summary'),
			_details = $('.js-queue-details'),
			_position = $('.js-position', _summary),
			_favorites = $('.js-favorites'),
			_favoritesAll = $('.js-favorites-all', _favorites),
			_favoritesOnline = $('.js-favorites-online', _favorites),
			tplQueue = _.template( $('#tpl_queue').html() ),
			summaryUrl = _summary.data('url'),
			detailsUrl = _summary.data('url'),
			opened = false,
			blocked = false;

		_summary
			.add(_details)
			.on('click', '.js-toggle', function() {
				opened = !opened;
				_summary.slideToggle(SLIDE_DURATION);
				_details.slideToggle(SLIDE_DURATION);
				return false;
			});

		_details.on('update', function(e, data) {
			// Set flag 'newprice'
			for (var i = 0, price = 0, item; i < data.translators.length; i++) {
				item = data.translators[i];
				item.price = item.price.toString().replace('.', ',');
				item.newprice = price !== item.price;
				price = item.price;
			}

			// Update queue
			_details
				.find('.js-queue-block')
				.remove();
			_details
				.append( tplQueue(data) );
		});

		_summary.on('update', function(e, data) {
			_position.text(data.position);
		});

		_favorites.on('update', function(e, data) {
			_favoritesAll.text(data.favorites.all);
			_favoritesOnline.text(data.favorites.online);
		});

		setInterval(function() {
			if ( blocked )
				return;

			blocked = true;
			$.ajax(opened ? detailsUrl : summaryUrl, {
				success: function(data) {
					if ( data.translators )
						_details.trigger('update', data);
					if ( data.position )
						_summary.trigger('update', data);
					if ( data.favorites )
						_favorites.trigger('update', data);
				},
				error: function() {
					// @todo
				},
				complete: function() {
					blocked = false;
				}
			});
		}, QUEUE_DELAY);
	})();