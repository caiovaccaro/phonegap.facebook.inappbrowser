FacebookInAppBrowser = {

    settings: {
      appId: '',
      redirectUrl: '',
      permissions: ''
    }

    , login: function(successCallback, finalCallback) {

        if(this.settings.appId === '' || this.settings.redirectUrl === '') {
          throw new Error('[FacebookInAppBrowser] You need to set up your app id and redirect url.');
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
                  successCallback();
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
              finalCallback();
            }

          }

          userDenied = false;

        });

    }

    , invite: function(inviteText, filters, successCallback, errorCallback) {

        if(typeof inviteText === 'undefined') {
          throw new Error('[FacebookInAppBrowser] inviteText is a required parameter.');
        }

        var request_url  = "https://m.facebook.com/dialog/apprequests?";
            request_url += "app_id=" + this.settings.appId;
            request_url += "&redirect_uri=" + this.settings.redirectUrl;
            request_url += "&display=touch";
            request_url += "&message=" + inviteText;
            
            if(typeof filters !== 'undefined') {
              request_url += "&filters=" + filters;
            }

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

                  if(typeof successCallback !== 'undefined' && typeof successCallback === 'function') {
                    successCallback();
                  }

               } else if(location.url.indexOf('error_code=') !== -1) {
                  // Error
                  faceView.close();

                  if(typeof errorCallback !== 'undefined' && typeof errorCallback === 'function') {
                    errorCallback();
                  }

               }

            };

        faceView = window.open(request_url, '_blank', 'location=no');
        faceView.addEventListener('loadstart', callback);

    }

};