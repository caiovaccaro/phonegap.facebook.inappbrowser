;(function() {

    FacebookInAppBrowser = {

        settings: {
          appId: '',
          redirectUrl: '',
          permissions: ''
        }

        , login: function(successCallback, finalCallback, userIdCallback) {

            if(this.settings.appId === '' || this.settings.redirectUrl === '') {
              console.log('[FacebookInAppBrowser] You need to set up your app id and redirect url.');
              return false;
            }

            var authorize_url  = "https://m.facebook.com/dialog/oauth?";
                authorize_url += "client_id=" + this.settings.appId;
                authorize_url += "&redirect_uri=" + this.settings.redirectUrl;
                authorize_url += "&display=touch";
                authorize_url += "&response_type=token";
                authorize_url += "&type=user_agent";
                
                if(this.settings.permissions !== '') {
                  authorize_url += "&scope=" + this.settings.permissions;
                }

            var faceView,
                callback = function(location) {
                  console.log("[FacebookInAppBrowser] Event 'loadstart': " + JSON.stringify(location));

                  if (location.url.indexOf("access_token") !== -1) {
                    // Success
                    var access_token = location.url.match(/access_token=(.*)$/)[1].split('&expires_in')[0];
                    console.log("[FacebookInAppBrowser] Logged in. Token: " + access_token);
                    window.localStorage.setItem('accessToken', access_token);
                    faceView.close();

                    if(typeof successCallback !== 'undefined' && typeof successCallback === 'function') {
                      setTimeout(function() {
                        successCallback();
                      }, 0);
                    }

                  }

                  if (location.url.indexOf("error_reason=user_denied") !== -1) {
                    // User denied
                    userDenied = true;
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
                if(typeof finalCallback !== 'undefined' && typeof finalCallback === 'function') {
                  setTimeout(function() {
                    finalCallback();
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

          var face = window.open(get_url, '_blank', 'hidden=yes,location=no'),
              callback = function(location) {
                 console.log("[FacebookInAppBrowser] Event 'loadstop': " + JSON.stringify(location));

                 if(location.url == get_url) {

                    face.executeScript({
                      code: "(function() { return JSON.parse('{'+document.body.textContent.match(/\{([^)]+)\}/)[1] +'}'); })();"
                    }, function(response) {
                      console.log(response);
                      console.log("[FacebookInAppBrowser] User id: " + response[0].id);
                      if(typeof response[0].id !== 'undefined') window.localStorage.setItem('uid', response[0].id);
                      face.close();
                      if(typeof afterCallback !== 'undefined' && typeof afterCallback === 'function') {
                        setTimeout(function() {
                          afterCallback(response);
                        }, 0);
                      }
                    });

                  } else if(location.url !== 'about:blank') {
                    if(typeof afterCallback !== 'undefined' && typeof afterCallback === 'function') {
                      setTimeout(function() {
                        afterCallback(false);
                      }, 0);
                    }
                    face.close();
                  }
              };

          face.addEventListener('loadstop', callback);
        }

        , getPermissions: function(afterCallback) {
          if(window.localStorage.getItem('uid') === null) {
            console.log('[FacebookInAppBrowser] No user id. Try getInfo() first.');
            return false;
          }

          var get_url  = "https://graph.facebook.com/"+ window.localStorage.getItem('uid') +"/permissions?access_token=" + window.localStorage.getItem('accessToken'),
              permissions = null;

          console.log('[FacebookInAppBrowser] getPermissions request url: ' + get_url);

          var face = window.open(get_url, '_blank', 'hidden=yes,location=no'),
              callback = function(location) {
                 console.log("[FacebookInAppBrowser] Event 'loadstop': " + JSON.stringify(location));

                 if(location.url == get_url) {

                    face.executeScript({
                      code: "(function() { return JSON.parse('{'+document.body.textContent.match(/\{([^)]+)\}/)[1] +'}'); })();"
                    }, function(response) {
                      if(response[0].data[0]) permissions = response[0].data[0];
                      console.log("[FacebookInAppBrowser] Permissions: " + JSON.stringify(permissions));
                      face.close();
                      if(typeof afterCallback !== 'undefined' && typeof afterCallback === 'function') {
                        setTimeout(function() {
                          afterCallback(permissions);
                        }, 0);
                      }
                    });

                  } else if(location.url !== 'about:blank') {
                    if(typeof afterCallback !== 'undefined' && typeof afterCallback === 'function') {
                      setTimeout(function() {
                        afterCallback(false);
                      }, 0);
                    }
                    face.close();
                  }
              };

          face.addEventListener('loadstop', callback);
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