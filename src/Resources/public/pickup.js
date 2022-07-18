/**
 * @author    Matthieu Vion
 * @copyright 2018 Magentix
 * @license   https://opensource.org/licenses/MIT MIT License
 * @link      https://github.com/magentix/pickup-plugin
 */

/**
 * Pickup Class
 *
 * @param {Object} options
 */
var pickupClass = function (options) {
    var vars = {};

    /**
     * Constructor
     *
     * @param {Object} options
     */
    this.construct = function (options) {
        var pickup = this;

        pickup.addOptions(options);

        var shippingMethods = $('#sylius-shipping-methods');
        var selected = shippingMethods.find('input.pickup:checked');

        shippingMethods.find('input').change(function () {
            pickup.remove();
        });

        if (selected.hasClass('pickup')) {
            pickup.list(selected, selected.attr('tabindex'), selected.attr('value'), {});
        }

        shippingMethods.find('input.pickup').change(function () {
            pickup.list($(this), $(this).attr('tabindex'), $(this).attr('value'), {});
        });
    };

    /**
     * Add Options
     *
     * @param {Object} options
     */
    this.addOptions = function (options) {
        $.extend(vars, options);
    };

    /**
     * Load Pickup List
     *
     * @param {Element} item
     * @param {int} index
     * @param {string} method
     * @param {Object} params
     */
    this.list = function (item, index, method, params) {
        var pickup = this;
        params.index = index;

        $.ajax({
            url: getUrl(method),
            type: 'post',
            context: this,
            data:params,
            beforeSend: function() {
                pickup.remove();
                pickup.loading(1);
            },
            success: function (response) {
                item.closest('.item').after(response);
                pickup.loading(0);
                pickup.search(item, index, method);
            },
            error: function() {
                pickup.loading(0);
            }
        });
    };

    /**
     * Add loader
     *
     * @param {int} status
     */
    this.loading = function (status) {
        var form = $('form[name="sylius_checkout_select_shipping"]');

        form.removeClass('loading');
        if (status) {
            form.addClass('loading');
        }
    };

    /**
     * Remove Pickup List
     */
    this.remove = function () {
        $('.pickup-form').remove();
    };

    /**
     * Search trigger
     *
     * @param {Element} item
     * @param {int} index
     * @param {string} method
     */
    this.search = function (item, index, method) {
        var pickup = this;
        $('.pickup-address').submit(function (event) {
            event.preventDefault();
            pickup.list(item, index, method, $(this).serialize());
        });
    };

    /**
     * Retrieve Controller URL
     *
     * @param {string} method
     * @returns {string}
     */
    var getUrl = function(method) {
        return vars.url + '/' + method;
    };

    this.construct(options);
};

/**
 * Map OSM Class Class
 *
 * @param {Object} options
 */
var mapOsmClass = function (options) {
    var vars = {
        'mapId': null,
        'map': null,
        'markers': []
    };

    /**
     * Load map
     *
     * @param {Object} options
     */
    this.construct = function (options) {
        this.addOptions(options);

        if (vars.mapId) {
            var map = L.map(vars.mapId, {dragging: !L.Browser.mobile, touchZoom: true});
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}'+ (L.Browser.retina ? '@2x.png' : '.png'), {
                attribution:'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 18,
                id: 'mapbox.streets'
            }).addTo(map);
            map.attributionControl.setPrefix('');
            map.scrollWheelZoom.disable();

            this.addOptions({'map': map});
        }
    };

    /**
     * Add Options
     *
     * @param {Object} options
     */
    this.addOptions = function (options) {
        $.extend(vars, options);
    };

    /**
     * Add locations to map
     *
     * @param {Object.<number, Object>} locations - All points on the map
     */
    this.locations = function (locations) {
        var osmMap = this;

        if (vars.map) {
            var i;
            var bounds = [];
            for (i = 0; i < locations.length; i++) {
                if (typeof locations[i] !== 'undefined') {
                    var latLng = [locations[i][1], locations[i][2]];
                    var marker = L.marker(latLng, {id:locations[i][3]}).addTo(vars.map);
                    marker.on('click', function (e) {
                        osmMap.select(e.sourceTarget.options.id)
                    });
                    marker.bindPopup(locations[i][0]);
                    vars.markers[locations[i][3]] = marker;

                    bounds.push(latLng);
                }
            }

            if (bounds.length) {
                vars.map.fitBounds(bounds);
            }

            if (bounds.length === 1) {
                vars.map.setZoom(15);
            }
        }
    };

    /**
     * Select location in the list
     *
     * @param {string} inputId - Id of input element
     */
    this.select = function (inputId) {
        var input = $('#' + inputId);
        if (input) {
            input.prop('checked', true);
            this.additional(inputId);
        }
    };

    /**
     * Show marker on map
     *
     * @param {string} locationId - Id of the marker
     */
    this.update = function (locationId) {
        if (vars.markers[locationId] && vars.map) {
            vars.markers[locationId].openPopup();
        }
        this.additional(locationId);
    };

    /**
     * Show pickup additional data if exists
     *
     * @param {string} elementId - Id of selected element
     */
    this.additional = function (elementId) {
        $('.pickup-additional-data').hide();
        $('#' + elementId + '_additional').show();
    };

    this.construct(options);
};
