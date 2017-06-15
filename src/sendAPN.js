'use strict';

var apn = require('apn');

var method = 'apn';

module.exports = function (regIds, data, settings) {
    if (data.silent) {
        var notification = {
          contentAvailable: 1,
          payload: data.custom || {},
          topic: data.topic,
        };
    } else {
      var notification = {
        retryLimit: data.retries || -1,
        expiry: data.expiry || (data.timeToLive || 28 * 86400) + Math.floor(Date.now() / 1000),
        priority: data.priority === 'normal' ? 5 : 10,
        encoding: data.encoding,
        payload: data.custom || {},
        badge: data.badge,
        topic: data.topic,
        category: data.category || data.clickAction,
        contentAvailable: data.contentAvailable,
        mdm: data.mdm,
        urlArgs: data.urlArgs,
        truncateAtWordEnd: data.truncateAtWordEnd,
        collapseId: data.collapseKey,
        mutableContent: data.mutableContent || 0,
        sound: data.sound || 'ping.aiff',
        alert: data.alert || {
          title: data.title,
          body: data.body,
          'title-loc-key': data.titleLocKey,
          'title-loc-args': data.titleLocArgs,
          'loc-key': data.locKey,
          'loc-args': data.bodyLocArgs,
          'launch-image': data.launchImage,
          action: data.action,
        },
      };
    }

    var message = new apn.Notification(notification);

    console.log(message);

    var connection = new apn.Provider(settings.apn);

    return connection.send(message, regIds).then(function (response) {
        var resumed = {
            method: method,
            success: 0,
            failure: 0,
            message: []
        };
        (response.sent || []).forEach(function (token) {
            resumed.success += 1;
            resumed.message.push({
                regId: token,
                error: null
            });
        });
        (response.failed || []).forEach(function (failure) {
            resumed.failure += 1;
            if (failure.error) {
                // A transport-level error occurred (e.g. network problem)
                resumed.message.push({
                    regId: failure.device,
                    error: failure.error
                });
            } else {
                // `failure.status` is the HTTP status code
                // `failure.response` is the JSON payload
                resumed.message.push({
                    regId: failure.device,
                    error: new Error(failure.response.reason || failure.response)
                });
            }
        });
        return resumed;
    });
};