var NodeHelper = require('node_helper');
var axios = require('axios').default;

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

            axios.get(url)
                .then(function (res) {
                    if (res.status !== 200) {
                        self.sendSocketNotification('MMM_HUE_LIGHTS_DATA_ERROR', 'Hue API Error: ' + res.status);
                    } else {
                        if (res.data === {}) {
                            self.sendSocketNotification('MMM_HUE_LIGHTS_DATA_ERROR', 'Hue API Error: No Hue data was received.');
                        } else {
                            self.sendSocketNotification('MMM_HUE_LIGHTS_DATA', res.data);
                        }
                    }
                })
                .catch(function (err) {
                    self.sendSocketNotification('MMM_HUE_LIGHTS_DATA_ERROR', 'Hue API Error: ' + err);
                });

        }
    }

});