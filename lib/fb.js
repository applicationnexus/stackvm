// Wrap around the encoder and rfb events so that multiple dnode clients can
// manage events without interference.

var EventEmitter = require('events').EventEmitter;

exports.FB = FB;
FB.prototype = new EventEmitter;
function FB (params) {
    var self = this;
    var encoder = params.encoder;
    var rfb = params.rfb;
    var baseURIs = params.baseURIs || {};
    
    var listeners = {};
    var events = 'error png copyRect desktopSize'.split(/\s+/);
    events.forEach(function (ev) {
        listeners[ev] = function () {
            var args = [ev].concat([].slice.call(arguments));
            self.emit.apply(self,args);
        }
    });
    
    var attached = false;
    
    self.attach = function () {
        if (attached == false) {
            events.forEach(function (key) {
                encoder.addListener(key, listeners[key]);
            });
            attached = true;
        }
    };
    
    self.detach = function () {
        if (attached == true) {
            events.forEach(function (key) {
                encoder.removeListener(key, listeners[key]);
            });
            attached = false;
        }
    };
    
    // Poll the rfb's dimensions.
    // The callback returns a hash with width and height.
    self.dimensions = function (cb) {
        cb(rfb.fbDims());
    };
    
    self.requestRedrawScreen = rfb.requestRedrawScreen;
    
    self.inputEnabled = 'inputEnabled' in params
        ? params.inputEnabled : true;
    
    'sendKeyDown sendKeyUp sendPointer'.split(/\s+/).forEach(function (method) {
        self[method] = function () {
            var args = [].slice.call(arguments);
            if (self.inputEnabled) {
                rfb[method].apply(rfb,args);
            }
            else {
                self.emit('error', 'input not enabled');
            }
        };
    });
    
    // render a screenshot and return the uri to the callback
    self.screenshot = function (cb) {
        encoder.onceListener('png', function () {
            // ...
            cb(baseURIs.screenshot + '/' + 'not-implemented');
        });
        rfb.requestRedrawScreen();
    };
    
    var screencastFunc = null;
    self.startScreencast = function (name) {
        screencastFunc = function () {
            // ...
        };
        encoder.addListener('png', screencastFunc);
    };
    
    self.stopScreencast = function (cb) {
        encoder.removeListener('png', screencastFunc);
        cb(baseURIs.screencast + '/' + 'not-implemented');
    };
}
