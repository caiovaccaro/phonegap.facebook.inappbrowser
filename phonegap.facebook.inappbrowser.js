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
           * Your Facebook App Secret
           * @type {String}
           */
          appSecret: '',

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
          permissions: ''
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
          if(typeof type !== 'undefined') {
            if((typeof test !== 'undefined' && test !== '') && typeof test === type) return true;
          } else {
            if(typeof test !== 'undefined' && test !== '') return true;
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
            if(!FacebookInAppBrowser.exists(type) || !FacebookInAppBrowser.exists(url) || !FacebookInAppBrowser.exists(callback)) {
              console.log('[FacebookInAppBrowser] type, url and callback parameters are necessary.');
              return false;
            }
            if(!FacebookInAppBrowser.exists(callback, 'function')) {
              console.log('[FacebookInAppBrowser] callback must be a function.');
              return false;
            }

            var request = new XMLHttpRequest();
            request.open(type, url, true);
            if(data) {
              request.setRequestHeader("Content-type","application/x-www-form-urlencoded");
              request.setRequestHeader("Content-length", data.length);
              request.setRequestHeader("Connection", "close");
              request.send(data);
            }
            request.onreadystatechange = function() {
                if (request.readyState == 4) {
                    if (request.status == 200 || request.status === 0) {
                        var data = request.responseText;
                        if(data) {
                          callback(data);
                        } else {
                          callback(false);
                        }
                    } else {
                      callback(false);
                    }
                }
            };
            request.send();
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
         *              userId: function() {}
         *          }
         */
        login: function(data) {

            if(!FacebookInAppBrowser.exists(this.settings.appId) || !FacebookInAppBrowser.exists(this.settings.redirectUrl)) {
              console.log('[FacebookInAppBrowser] You need to set up your app id and redirect url.');
              return false;
            }

            var authorize_url  = "https://m.facebook.com/dialog/oauth?";
                authorize_url += "client_id=" + this.settings.appId;
                authorize_url += "&redirect_uri=" + this.settings.redirectUrl;
                authorize_url += "&display=touch";
                authorize_url += "&response_type=token";
                authorize_url += "&type=user_agent";
                
                if(FacebookInAppBrowser.exists(this.settings.permissions)) {
                  authorize_url += "&scope=" + this.settings.permissions;
                }

            if(FacebookInAppBrowser.exists(data.send, 'function')) data.send();

            var faceView,
                callback = function(location) {
                  console.log("[FacebookInAppBrowser] Event 'loadstart': " + JSON.stringify(location));

                  if (location.url.indexOf("access_token") !== -1) {
                    // Success
                    var access_token = location.url.match(/access_token=(.*)$/)[1].split('&expires_in')[0];
                    console.log("[FacebookInAppBrowser] Logged in. Token: " + access_token);
                    window.localStorage.setItem('accessToken', access_token);
                    faceView.close();

                    if(FacebookInAppBrowser.exists(data.success, 'function')) {
                      setTimeout(function() {
                        data.success(access_token);
                      }, 0);
                    }

                  }

                  if (location.url.indexOf("error_reason=user_denied") !== -1) {
                    // User denied
                    userDenied = true;
                    if(FacebookInAppBrowser.exists(data.denied, 'function')) {
                      setTimeout(function() {
                        data.denied();
                      }, 0);
                    }
                    console.log('[FacebookInAppBrowser] User denied Facebook Login.');
                    faceView.close();
                  }
                },
                userDenied = false;

            // Thx to @jcoltrane
            faceView = window.open(authorize_url, '_blank', 'location=no,hidden=yes');
            faceView.addEventListener('loadstop', function(){
    faceView.show();    
      });

            faceView.addEventListener('loadstart', callback);
            faceView.addEventListener('exit', function() {

              if(window.localStorage.getItem('accessToken') === null && userDenied === false) {
                // InAppBrowser was closed and we don't have an app id
                if(FacebookInAppBrowser.exists(data.complete, 'function')) {
                  setTimeout(function() {
                    data.complete(false);
                  }, 0);
                }

              } else if(userDenied === false) {
                  if(FacebookInAppBrowser.exists(data.complete, 'function')) {
                      setTimeout(function() {
                        data.complete(window.localStorage.getItem('accessToken'));
                      }, 0);
                    }
              }

              if(window.localStorage.getItem('accessToken') !== null) {
                setTimeout(function() {
                  var userIdCallback = FacebookInAppBrowser.exists(data.userId, 'function') ? data.userId : undefined;
                  FacebookInAppBrowser.getInfo(userIdCallback);
                },0);
              }

              userDenied = false;
            });
        },
        
        graphApi: function(graphPath, afterCallback) {
          if(window.localStorage.getItem('accessToken') === null) {
            console.log('[FacebookInAppBrowser] No accessToken. Try login() first.');
            return false;
          }
          if(!FacebookInAppBrowser.exists(graphPath)) {
            console.log('[FacebookInAppBrowser] graphPath is a necessary parameter.');
            return false;
          }

          var get_url  = "https://graph.facebook.com"+ graphPath +"?access_token=" + window.localStorage.getItem('accessToken');
          console.log('[FacebookInAppBrowser] graphPath request url: ' + get_url);

          FacebookInAppBrowser.ajax('GET', get_url, function(data) {
            if(data) {
              var response = JSON.parse(data);
              if(FacebookInAppBrowser.exists(afterCallback, 'function')) {
                setTimeout(function() {
                  afterCallback(response);
                }, 0);
              }
            } else {
              if(FacebookInAppBrowser.exists(afterCallback, 'function')) {
                setTimeout(function() {
                  afterCallback(false);
                }, 0);
              }
            }
          });
        },
        
        /**
         * Get User Info
         * User needs to be logged in.
         * 
         * @param  {Function} afterCallback Success/Error callback
         */
        getInfo: function(afterCallback) {
          if(window.localStorage.getItem('accessToken') === null) {
            console.log('[FacebookInAppBrowser] No accessToken. Try login() first.');
            return false;
          }

          var get_url  = "https://graph.facebook.com/me?fields=email,name,gender&access_token=" + window.localStorage.getItem('accessToken');
          console.log('[FacebookInAppBrowser] getInfo request url: ' + get_url);

          FacebookInAppBrowser.ajax('GET', get_url, function(data) {
            if(data) {
              var response = JSON.parse(data);
              console.log("[FacebookInAppBrowser] User id: " + response.id);
              if(FacebookInAppBrowser.exists(response.id)) window.localStorage.setItem('uid', response.id);
              if(FacebookInAppBrowser.exists(afterCallback, 'function')) {
                setTimeout(function() {
                  afterCallback(response);
                }, 0);
              }
            } else {
              if(FacebookInAppBrowser.exists(afterCallback, 'function')) {
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
          if(window.localStorage.getItem('uid') === null) {
            console.log('[FacebookInAppBrowser] No user id. Try getInfo() first.');
            return false;
          }

          var get_url  = "https://graph.facebook.com/"+ window.localStorage.getItem('uid') +"/permissions?access_token=" + window.localStorage.getItem('accessToken'),
              permissions = null;

          console.log('[FacebookInAppBrowser] getPermissions request url: ' + get_url);

          FacebookInAppBrowser.ajax('GET', get_url, function(data) {
            if(data) {
              var response = JSON.parse(data);
              if(response.data[0]) permissions = response.data[0];
              console.log("[FacebookInAppBrowser] Permissions: " + JSON.stringify(permissions));
              if(FacebookInAppBrowser.exists(afterCallback, 'function')) {
                afterCallback(permissions);
              }
            } else {
              if(FacebookInAppBrowser.exists(afterCallback, 'function')) {
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
          if(!FacebookInAppBrowser.exists(data.name) ||
             !FacebookInAppBrowser.exists(data.link) ||
             !FacebookInAppBrowser.exists(data.description) ||
             !FacebookInAppBrowser.exists(data.picture) ||
             !FacebookInAppBrowser.exists(data.message)) {
            console.log('[FacebookInAppBrowser] name, link, description, picture and message are necessary.');
            return false;
          }
          if(!FacebookInAppBrowser.exists(FacebookInAppBrowser.settings.appId) || !FacebookInAppBrowser.exists(window.localStorage.getItem('accessToken')) || window.localStorage.getItem('accessToken') === null) {
            console.log('[FacebookInAppBrowser] You need to set your app id in FacebookInAppBrowser.settings.appId and have a accessToken (try login first)');
            return false;
          }

          var post_url = "https://graph.facebook.com/"+ window.localStorage.getItem('uid') +"/feed",
              post_data = 'app_id='+FacebookInAppBrowser.settings.appId+'&access_token='+window.localStorage.getItem('accessToken')+'&redirect_uri='+FacebookInAppBrowser.settings.redirectUrl+
                          '&name='+data.name+'&link='+data.link+'&description='+data.description+'&picture='+data.picture+'&message='+data.message;

          FacebookInAppBrowser.ajax('POST', post_url, function(data) {
            if(data) {
              var response = JSON.parse(data);
              if(response.id) {
                  if(FacebookInAppBrowser.exists(afterCallback, 'function')) {
                    afterCallback(response.id);
                  }
              } else {
                if(FacebookInAppBrowser.exists(afterCallback, 'function')) {
                  afterCallback(false);
                }
              }
            } else {
              if(FacebookInAppBrowser.exists(afterCallback, 'function')) {
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
            if(typeof inviteText === 'undefined') {
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

                   if(location.url == request_url) {
                      // Do nothing

                   } else if (location.url.indexOf("?request=") !== -1) {
                      // Success
                      faceView.close();

                      if(FacebookInAppBrowser.exists(afterCallback, 'function')) {
                        setTimeout(function() {
                          afterCallback(true);
                        }, 0);
                      }

                   } else if(location.url.indexOf('error_code=') !== -1) {
                      // Error
                      faceView.close();

                      if(FacebookInAppBrowser.exists(afterCallback, 'function')) {
                        setTimeout(function() {
                          afterCallback(false);
                        }, 0);
                      }

                   } else if(location.url === obj.settings.redirectUrl + '#_=_') {
                      // User clicked Cancel
                      face.close();

                   }

                };
            faceView = window.open(request_url, '_blank', 'location=no');
            faceView.addEventListener('loadstart', callback);
        },

        /**
         * Logout User
         * From Facebook and your app
         * 
         * @param  {Function} afterCallback Success/Error callback
         */
        logout: function(afterCallback) {
            var logout_url = encodeURI("https://www.facebook.com/logout.php?next="  + this.settings.redirectUrl + "&access_token=" + window.localStorage.getItem('accessToken'));

            var face = window.open(logout_url, '_blank', 'hidden=yes,location=no'),
                callback = function(location) {
                   console.log("[FacebookInAppBrowser] Event 'loadstart': " + JSON.stringify(location));

                   if(location.url == logout_url) {
                      // Do nothing

                   } else if(location.url ===  FacebookInAppBrowser.settings.redirectUrl + '#_=_' || location.url === FacebookInAppBrowser.settings.redirectUrl || location.url === FacebookInAppBrowser.settings.redirectUrl + '/') {
                      face.close();

                      if(FacebookInAppBrowser.exists(afterCallback, 'function')) {
                        setTimeout(function() {
                          afterCallback();
                        }, 0);
                      }
                   }
                };
            face.addEventListener('loadstart', callback);
        }
    };
    
}).call(this);
