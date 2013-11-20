;(function() {

    FacebookInAppBrowser = {

        settings: {
          appId: '',
          redirectUrl: '',
          permissions: ''
        }

        , exists: function(test, type) {
          if(typeof type !== 'undefined') {
            if((typeof test !== 'undefined' && test !== '') && typeof test === type) return true;
          } else {
            if(typeof test !== 'undefined' && test !== '') return true;
          }
          return false;
        }

        , ajax: function(type, url, callback, data) {
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
        }

        // , login: function(successCallback, finalCallback, userIdCallback) {
        /**
         * [login description]
         * @param  {Object} data {
         *                         send: function() {},
         *                         success: function() {},
         *                         denied: function() {},
         *                         complete: function() {},
         *                         userId: function() {}
         *                       }
         * @return {[type]}      [description]
         */
        , login: function(data) {

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

                    if(FacebookInAppBrowser.exists(data.sucess, 'function')) {
                      setTimeout(function() {
                        data.sucess(access_token);
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

            faceView = window.open(authorize_url, '_blank', 'location=no');
            faceView.addEventListener('loadstart', callback);
            faceView.addEventListener('exit', function() {

              if(window.localStorage.getItem('accessToken') === null && userDenied === false) {
                // InAppBrowser was closed and we don't have an app id
                if(FacebookInAppBrowser.exists(data.complete, 'function')) {
                  setTimeout(function() {
                    data.complete(false);
                  }, 0);
                }

              }

              if(window.localStorage.getItem('accessToken') !== null) {
                setTimeout(function() {
                  FacebookInAppBrowser.getInfo(userIdCallback);
                },0);
              }

              userDenied = false;

            });

        }

        , getInfo: function(afterCallback) {
          if(window.localStorage.getItem('accessToken') === null) {
            console.log('[FacebookInAppBrowser] No accessToken. Try login() first.');
            return false;
          }

          var get_url  = "https://graph.facebook.com/me?access_token=" + window.localStorage.getItem('accessToken');
          console.log('[FacebookInAppBrowser] getInfo request url: ' + get_url);

          FacebookInAppBrowser.ajax('GET', get_url, function(data) {
            if(data) {
              var response = JSON.parse(data);
              console.log(response);
              console.log("[FacebookInAppBrowser] User id: " + response[0].id);
              if(typeof response[0].id !== 'undefined') window.localStorage.setItem('uid', response[0].id);
              if(typeof afterCallback !== 'undefined' && typeof afterCallback === 'function') {
                setTimeout(function() {
                  afterCallback(response);
                }, 0);
              }
            } else {
              if(typeof afterCallback !== 'undefined' && typeof afterCallback === 'function') {
                setTimeout(function() {
                  afterCallback(false);
                }, 0);
              }
            }
          });
        }

        , getPermissions: function(afterCallback) {
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
              if(response[0].data[0]) permissions = response[0].data[0];
              console.log("[FacebookInAppBrowser] Permissions: " + JSON.stringify(permissions));
              if(typeof afterCallback !== 'undefined' && typeof afterCallback === 'function') {
                afterCallback(permissions);
              }
            } else {
              if(typeof afterCallback !== 'undefined' && typeof afterCallback === 'function') {
                afterCallback(false);
              }
            }
          });
        }

        , post: function(data, afterCallback) {
          if(typeof data.name === 'undefined' ||
             typeof data.link === 'undefined' ||
             typeof data.description === 'undefined' ||
             typeof data.picture === 'undefined' ||
             typeof data.message === 'undefined') {
            console.log('[FacebookInAppBrowser] name, link, description, picture and message are necessary.');
            return false;
          }
          if(typeof FacebookInAppBrowser.settings.appId === 'undefined' || typeof window.localStorage.getItem('accessToken') === 'undefined' || window.localStorage.getItem('accessToken') === null) {
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
                  if(typeof afterCallback !== 'undefined' && typeof afterCallback === 'function') {
                    afterCallback(response.id);
                  }
              } else {
                if(typeof afterCallback !== 'undefined' && typeof afterCallback === 'function') {
                  afterCallback(false);
                }
              }
            } else {
              if(typeof afterCallback !== 'undefined' && typeof afterCallback === 'function') {
                afterCallback(false);
              }
            }
          }, post_data);
        }

        , invite: function(inviteText, afterCallback) {

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

                      if(typeof afterCallback !== 'undefined' && typeof afterCallback === 'function') {
                        setTimeout(function() {
                          afterCallback(true);
                        }, 0);
                      }

                   } else if(location.url.indexOf('error_code=') !== -1) {
                      // Error
                      faceView.close();

                      if(typeof afterCallback !== 'undefined' && typeof afterCallback === 'function') {
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

        }

        , logout: function(afterCallback) {

            var logout_url = encodeURI("https://www.facebook.com/logout.php?next="  + this.settings.redirectUrl + "&access_token=" + window.localStorage.getItem('accessToken'));

            var face = window.open(logout_url, '_blank', 'hidden=yes,location=no'),
                callback = function(location) {
                   console.log("[FacebookInAppBrowser] Event 'loadstart': " + JSON.stringify(location));

                   if(location.url == logout_url) {

                      // Do nothing

                   } else if(location.url ===  FacebookInAppBrowser.settings.redirectUrl + '#_=_' || location.url === FacebookInAppBrowser.settings.redirectUrl) {
                      
                      face.close();

                      if(typeof afterCallback !== 'undefined' && typeof afterCallback === 'function') {

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