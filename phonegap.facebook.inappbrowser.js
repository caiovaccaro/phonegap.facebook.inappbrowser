;(function() {

    FacebookInAppBrowser = {

        /**
         * Basic Configuration
         * @type {Object}
         */
        settings: {

            /**
             * Your Facebook App Id
             * @type {String}
             */
            appId: '',

            /**
             * Redirect URL for "inside" script
             * identification. Can be your main URL
             * @type {String}
             */
            redirectUrl: '',

            /**
             * Which permissions you will request
             * from your user. Facebook default is 'email'.
             *
             * Reference: https://developers.facebook.com/docs/reference/login/
             *
             * Separate by comma and no spaces.
             * @example 'email,publish_actions'
             *
             * @type {String}
             */
            permissions: '',

            /**
             * Timeout duration, usually occurs when there is a bad internet connection
             */
            timeoutDuration: 7500
        },

        /**
         * Inner function
         * Tests if parameter exists and
         * if it is of the type given.
         * @param  {Variable} test    Variable you want to test
         * @param  {String}   type    @example 'function'
         * @return {Boolean}
         */
        exists: function(test, type) {
            if (typeof type !== 'undefined') {
                if ((typeof test !== 'undefined' && test !== '') && typeof test === type) return true;
            } else {
                if (typeof test !== 'undefined' && test !== '') return true;
            }
            return false;
        },

        /**
         * Inner AJAX handler.
         * @param  {String}   type     GET or POST
         * @param  {String}   url      Request URL
         * @param  {Function} callback Success/Error callback
         * @param  {Object}   data     Data to send
         */
        ajax: function(type, url, callback, data) {
            if (!FacebookInAppBrowser.exists(type) || !FacebookInAppBrowser.exists(url) || !FacebookInAppBrowser.exists(callback)) {
                console.log('[FacebookInAppBrowser] type, url and callback parameters are necessary.');
                return false;
            }
            if (!FacebookInAppBrowser.exists(callback, 'function')) {
                console.log('[FacebookInAppBrowser] callback must be a function.');
                return false;
            }

            var request = new XMLHttpRequest();
            request.open(type, url, true);
            if (data) {
                request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                request.setRequestHeader("Content-length", data.length);
                request.setRequestHeader("Connection", "close");
            }
            request.onreadystatechange = function() {
                if (request.readyState == 4) {
                    if (request.status == 200 || request.status === 0) {
                        var data = request.responseText;
                        if (data) {
                            callback(data);
                        } else {
                            callback(false);
                        }
                    } else {
                        callback(false);
                    }
                }
            };
            if (data) {
                request.send(data);
            } else {
                request.send();
            }
        },

        /**
         * Open and handle Facebook Login.
         *
         * Callbacks for:
         * # Send (open InAppBrowser)
         * # Success
         * # User denied
         * # Complete regardless of result
         * # When User Id is received
         *
         * @param  {Object}
         *          data {
         *              send: function() {},
         *              success: function() {},
         *              denied: function() {},
         *              complete: function() {},
         *              userInfo: function() {},
         *              error: functon() {}
         *          }
         */
        login: function(data) {

            if (!FacebookInAppBrowser.exists(this.settings.appId) || !FacebookInAppBrowser.exists(this.settings.redirectUrl)) {
                console.log('[FacebookInAppBrowser] You need to set up your app id and redirect url.');
                return false;
            }

            var authorize_url  = "https://m.facebook.com/dialog/oauth?";
            authorize_url += "client_id=" + this.settings.appId;
            authorize_url += "&redirect_uri=" + this.settings.redirectUrl;
            authorize_url += "&display=touch";
            authorize_url += "&response_type=token";
            authorize_url += "&type=user_agent";

            if (FacebookInAppBrowser.exists(this.settings.permissions)) {
                authorize_url += "&scope=" + this.settings.permissions;
            }

            if (FacebookInAppBrowser.exists(data.send, 'function')) data.send();

            var faceView,
                userDenied = false;

            // Open the url command
            faceView = window.open(authorize_url, '_blank', 'location=no,hidden=yes');

            // On timeout
            var timeoutOccurred = false;
            var timeout = setTimeout(function(){

                timeoutOccurred = true;

                if (FacebookInAppBrowser.exists(data.timeout, 'function')) {
                    setTimeout(function() {
                        data.timeout();
                    }, 0);
                }

            }, this.settings.timeoutDuration);

            // On loadStart
            faceView.addEventListener('loadstart', function(location) {
                console.log("[FacebookInAppBrowser] Event 'loadstart': " + JSON.stringify(location));

                // Success
                if (location.url.indexOf("access_token") !== -1) {
                    var access_token = location.url.match(/access_token=(.*)$/)[1].split('&expires_in')[0];
                    console.log("[FacebookInAppBrowser] Logged in. Token: " + access_token);
                    window.localStorage.setItem('facebookAccessToken', access_token);
                    faceView.close();

                    if (FacebookInAppBrowser.exists(data.success, 'function')) {
                        setTimeout(function() {
                            data.success(access_token);
                        }, 0);
                    }

                }

                // User denied
                if (location.url.indexOf("error_reason=user_denied") !== -1) {
                    userDenied = true;
                    if (FacebookInAppBrowser.exists(data.denied, 'function')) {
                        setTimeout(function() {
                            data.denied();
                        }, 0);
                    }
                    console.log('[FacebookInAppBrowser] User denied Facebook Login.');
                    faceView.close();
                }
            });

            // On finished loading
            faceView.addEventListener('loadstop', function(){
                if (timeoutOccurred == true) return;

                clearTimeout(timeout); // Clear the onTimeout function
                faceView.show();
            });

            // On exit
            faceView.addEventListener('exit', function() {

                if (window.localStorage.getItem('facebookAccessToken') === null && userDenied === false) {
                    // InAppBrowser was closed and we don't have an app id
                    if (FacebookInAppBrowser.exists(data.complete, 'function')) {
                        setTimeout(function() {
                            data.complete(false);
                        }, 0);
                    }

                } else if (userDenied === false) {
                    if (FacebookInAppBrowser.exists(data.complete, 'function')) {
                        setTimeout(function() {
                            data.complete(window.localStorage.getItem('facebookAccessToken'));
                        }, 0);
                    }
                }

                if (window.localStorage.getItem('facebookAccessToken') !== null) {
                    setTimeout(function() {
                        var userInfoCallback = FacebookInAppBrowser.exists(data.userInfo, 'function') ? data.userInfo : undefined;
                        FacebookInAppBrowser.getInfo(userInfoCallback);
                    },0);
                }

                userDenied = false;
                clearTimeout(timeout); // Clear the onTimeout function
            });
        },

        /**
         * Get User Info
         * User needs to be logged in.
         *
         * @param  {Function} afterCallback Success/Error callback
         */
        getInfo: function(afterCallback) {
            if (window.localStorage.getItem('facebookAccessToken') === null) {
                console.log('[FacebookInAppBrowser] No facebookAccessToken. Try login() first.');
                return false;
            }

            var get_url  = "https://graph.facebook.com/me?access_token=" + window.localStorage.getItem('facebookAccessToken');
            console.log('[FacebookInAppBrowser] getInfo request url: ' + get_url);

            FacebookInAppBrowser.ajax('GET', get_url, function(data) {
                if (data) {
                    var response = JSON.parse(data);
                    console.log("[FacebookInAppBrowser] User id: " + response.id);
                    if (FacebookInAppBrowser.exists(response.id)) window.localStorage.setItem('uid', response.id);
                    if (FacebookInAppBrowser.exists(afterCallback, 'function')) {
                        setTimeout(function() {
                            afterCallback(response);
                        }, 0);
                    }
                } else {
                    if (FacebookInAppBrowser.exists(afterCallback, 'function')) {
                        setTimeout(function() {
                            afterCallback(false);
                        }, 0);
                    }
                }
            });
        },

        /**
         * Get permissions that user has or not given
         * Needs to be logged in and have User Id
         *
         * @param  {Function} afterCallback Success/Error callback
         */
        getPermissions: function(afterCallback) {
            if (window.localStorage.getItem('uid') === null) {
                console.log('[FacebookInAppBrowser] No user id. Try getInfo() first.');
                return false;
            }

            var get_url  = "https://graph.facebook.com/"+ window.localStorage.getItem('uid') +"/permissions?access_token=" + window.localStorage.getItem('facebookAccessToken'),
                permissions = null;

            console.log('[FacebookInAppBrowser] getPermissions request url: ' + get_url);

            FacebookInAppBrowser.ajax('GET', get_url, function(data) {
                if (data) {
                    var response = JSON.parse(data);
                    if (response.data[0]) permissions = response.data[0];
                    console.log("[FacebookInAppBrowser] Permissions: " + JSON.stringify(permissions));
                    if (FacebookInAppBrowser.exists(afterCallback, 'function')) {
                        afterCallback(permissions);
                    }
                } else {
                    if (FacebookInAppBrowser.exists(afterCallback, 'function')) {
                        afterCallback(false);
                    }
                }
            });
        },

        /**
         * Post to User Wall
         * Needs to be logged in.
         *
         * @param  {Object} data              name, link, description, picture, message
         * @param  {Function} afterCallback   Success/Error callback
         */
        post: function(data, afterCallback) {
            if (!FacebookInAppBrowser.exists(data.name) ||
                !FacebookInAppBrowser.exists(data.link) ||
                !FacebookInAppBrowser.exists(data.description) ||
                !FacebookInAppBrowser.exists(data.picture) ||
                !FacebookInAppBrowser.exists(data.message)) {
                console.log('[FacebookInAppBrowser] name, link, description, picture and message are necessary.');
                return false;
            }
            if (!FacebookInAppBrowser.exists(FacebookInAppBrowser.settings.appId) || !FacebookInAppBrowser.exists(window.localStorage.getItem('facebookAccessToken')) || window.localStorage.getItem('facebookAccessToken') === null) {
                console.log('[FacebookInAppBrowser] You need to set your app id in FacebookInAppBrowser.settings.appId and have a facebookAccessToken (try login first)');
                return false;
            }

            var post_url = "https://graph.facebook.com/"+ window.localStorage.getItem('uid') +"/feed",
                post_data = 'app_id='+encodeURIComponent(FacebookInAppBrowser.settings.appId)+'&access_token='+encodeURIComponent(window.localStorage.getItem('facebookAccessToken'))+'&redirect_uri='+encodeURIComponent(FacebookInAppBrowser.settings.redirectUrl)+
                    '&name='+encodeURIComponent(data.name)+'&link='+encodeURIComponent(data.link)+'&description='+encodeURIComponent(data.description)+'&picture='+encodeURIComponent(data.picture)+'&message='+encodeURIComponent(data.message);

            FacebookInAppBrowser.ajax('POST', post_url, function(data) {
                if (data) {
                    var response = JSON.parse(data);
                    if (response.id) {
                        if (FacebookInAppBrowser.exists(afterCallback, 'function')) {
                            afterCallback(response.id);
                        }
                    } else {
                        if (FacebookInAppBrowser.exists(afterCallback, 'function')) {
                            afterCallback(false);
                        }
                    }
                } else {
                    if (FacebookInAppBrowser.exists(afterCallback, 'function')) {
                        afterCallback(false);
                    }
                }
            }, post_data);
        },

        /**
         * Open Invitation Box
         * @param  {String} inviteText
         * @param  {Function} afterCallback Success/Error callback
         */
        invite: function(inviteText, afterCallback) {
            if (typeof inviteText === 'undefined') {
                console.log('[FacebookInAppBrowser] inviteText is a required parameter.');
                return false;
            }

            var obj = this;

            var request_url  = "https://m.facebook.com/dialog/apprequests?";
            request_url += "app_id=" + this.settings.appId;
            request_url += "&redirect_uri=" + this.settings.redirectUrl;
            request_url += "&display=touch";
            request_url += "&message=" + inviteText;

            request_url = encodeURI(request_url);

            console.log('[FacebookInAppBrowser] Invite, URL: ' + request_url);

            var faceView,
                callback = function(location) {
                    console.log("[FacebookInAppBrowser] Event 'loadstart': " + JSON.stringify(location));

                    if (location.url == request_url) {
                        // Do nothing

                    } else if (location.url.indexOf("?request=") !== -1) {
                        // Success
                        faceView.close();

                        if (FacebookInAppBrowser.exists(afterCallback, 'function')) {
                            setTimeout(function() {
                                afterCallback(true);
                            }, 0);
                        }

                    } else if (location.url.indexOf('error_code=') !== -1) {
                        // Error
                        faceView.close();

                        if (FacebookInAppBrowser.exists(afterCallback, 'function')) {
                            setTimeout(function() {
                                afterCallback(false);
                            }, 0);
                        }

                    } else if (location.url === obj.settings.redirectUrl + '#_=_') {
                        // User clicked Cancel
                        faceView.close();
                    }

                };
            faceView = window.open(request_url, '_blank', 'location=no');
            faceView.addEventListener('loadstart', callback);
        },

        /**
         * Open Share dialog
         *
         * Let you use the Share Dialog https://developers.facebook.com/docs/sharing/reference/share-dialog
         *
         * @param  {Object}   data either with "href" key or "action_type", "action_properties" keys
         * @param  {Function} afterCallback Success/Error callback, will receive false on error, true or the created object_id on success
         */
        share: function(data, afterCallback) {
            var obj = this;
            var i;

            var request_url  = "https://m.facebook.com/dialog/";
            if (FacebookInAppBrowser.exists(data.href)) {
                request_url += 'share?';
            } else {
                request_url += 'share_open_graph?';
            }
            request_url += "app_id=" + this.settings.appId;
            request_url += "&redirect_uri=" + this.settings.redirectUrl;
            request_url += "&display=touch";

            var fields = ['href', 'action_type', 'action_properties'];
            for (i = 0; i < fields.length; i += 1) {
                if (FacebookInAppBrowser.exists(data[fields[i]])) {
                    request_url += '&' + fields[i] + '=' + data[fields[i]];
                }
            }

            request_url = encodeURI(request_url);

            console.log('[FacebookInAppBrowser] Share dialog, URL: ' + request_url);

            var faceView,
                seen_submit = false,
                callback = function(location) {
                    console.log("[FacebookInAppBrowser] Event 'loadstart': " + JSON.stringify(location));

                    if (location.url == request_url) {
                        // Do nothing

                    } else if (location.url.indexOf('dialog/share/submit') !== -1) {
                        seen_submit = true;

                    } else if (location.url.indexOf('error_code=') !== -1) {
                        // Error
                        faceView.close();

                        if (FacebookInAppBrowser.exists(afterCallback, 'function')) {
                            setTimeout(function() {
                                afterCallback(false);
                            }, 0);
                        }

                    } else if (location.url.indexOf('?post_id=') !== -1
                        || location.url.indexOf('?object_id=') !== -1) { // according to the docs, the parameter should be called object_id, however facebook uses post_id too
                        // Success
                        faceView.close();

                        var object_id = location.url.match(/(post|object)_id=([^#]+)/)[2];

                        if (FacebookInAppBrowser.exists(afterCallback, 'function')) {
                            setTimeout(function() {
                                afterCallback(object_id);
                            }, 0);
                        }

                    } else if (location.url === obj.settings.redirectUrl + '#_=_'
                        || location.url === obj.settings.redirectUrl + '?#_=_') { // facebook sometimes adds ? even though no query params added

                            faceView.close();

                            // Probably success, object_id not always returned
                            var success = seen_submit ? true : false;
                            if (FacebookInAppBrowser.exists(afterCallback, 'function')) {
                                setTimeout(function() {
                                    afterCallback(success);
                                }, 0);
                            }
                        }
                };

            faceView = window.open(request_url, '_blank', 'location=no');
            faceView.addEventListener('loadstart', callback);
            faceView.addEventListener('loadstop', function(){
                faceView.show();
            });
        },

        /**
         * Logout User
         * From Facebook and your app
         *
         * @param  {Function} afterCallback Success/Error callback
         */
        logout: function(afterCallback) {
            var logout_url = encodeURI("https://www.facebook.com/logout.php?next="  + this.settings.redirectUrl + "&access_token=" + window.localStorage.getItem('facebookAccessToken'));

            var faceView = window.open(logout_url, '_blank', 'hidden=yes,location=no'),
                callback = function(location) {
                    console.log("[FacebookInAppBrowser] Event 'loadstart': " + JSON.stringify(location));

                    if (location.url == logout_url) {
                        // Do nothing

                    } else if (location.url ===  FacebookInAppBrowser.settings.redirectUrl + '#_=_' || location.url === FacebookInAppBrowser.settings.redirectUrl || location.url === FacebookInAppBrowser.settings.redirectUrl + '/') {
                        faceView.close();

                        if (FacebookInAppBrowser.exists(afterCallback, 'function')) {
                            setTimeout(function() {
                                afterCallback();
                            }, 0);
                        }
                    }
                };
            faceView.addEventListener('loadstart', callback);
        }
    };
}).call(this);
