var NodeHelper = require('node_helper');
var request = require('request');

module.exports = NodeHelper.create({

    start: function() {
        console.log('Starting node_helper for module [' + this.name + ']');
    },

    socketNotificationReceived: function(notification, payload) {

        if (notification === 'MMM_HUE_LIGHTS_GET') {

            var bridgeIp = payload.bridgeIp;
            var user = payload.user;

            var url = 'http://' + bridgeIp + '/api/' + user;
            var self = this;

            request(url, {method: 'GET'}, function(err, res, body) {

                if ((err) || (res.statusCode !== 200)) {
                    self.sendSocketNotification('MMM_HUE_LIGHTS_DATA_ERROR', 'Hue API Error: ' + err);
                } else {
                    if (body === {}) {
                        self.sendSocketNotification('MMM_HUE_LIGHTS_DATA_ERROR', 'Hue API Error: No Hue data was received.');
                    } else {
                        var data = JSON.parse(body);
                        self.sendSocketNotification('MMM_HUE_LIGHTS_DATA', data);
                    }
                }

            });

        }
    }

});