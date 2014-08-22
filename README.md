phonegap.facebook.inappbrowser v 0.9
==============================

FacebookInAppBrowser uses the InAppBrowser Phonegap plugin and localStorage. Does not require any SDK from Facebook or other libraries.

This repo is based on [this question and answer](http://stackoverflow.com/questions/16576977/is-there-any-facebook-plugin-for-phonegap-2-7-0) and on [this repo using ChildBrowser](https://github.com/purplecabbage/phonegap-plugins/tree/master/iPhone/ChildBrowser/FBConnectExample)

Until now "Login", "Logout", "Invite(Request)", "post(/feed)", "getInfo(/me)", "getPermissions(/id/permissions)" and "Share" are available.

**Phonegap v2.8 up to 3.x**

Setup
-----

To use FacebookInAppBrowser you need to follow these steps:
- Enable InAppBrowser in your Phonegap application as described in ["InAppBrowser - Accessing the Feature"](http://docs.phonegap.com/en/3.3.0/cordova_inappbrowser_inappbrowser.md.html#InAppBrowser). Instructions are the same for 2.8 up to 3.x except for the command line interface. If you have 3.x you need to install the InAppBrowser plugin trough the command line.
- Enable Storage in your Phonegap application as described in ["Storage - Accessing the Feature"](http://docs.phonegap.com/en/3.3.0/cordova_storage_storage.md.html#Storage). If you have 3.x Storage is enabled by default.
- Download the 'phonegap.facebook.inappbrowser.js' file and place it inside your project (for example in www/js/)
- In your index.html place a script tag calling the javascript file:

```html
<script type="text/javascript" src="js/phonegap.facebook.inappbrowser.js"></script>
``` 
- You should have your main javascript file (also called in a script tag in your index.html). In it just configure and call FacebookInAppBrowser as the example below.


Basic example
-------------

```javascript
// Settings
FacebookInAppBrowser.settings.appId = '123456789';
FacebookInAppBrowser.settings.redirectUrl = 'http://example.com';
FacebookInAppBrowser.settings.permissions = 'email';

// Optional
FacebookInAppBrowser.settings.timeoutDuration = 7500;

// Login(accessToken will be stored trough localStorage in 'accessToken');
FacebookInAppBrowser.login({
	send: function() {
		console.log('login opened');
	},
	success: function(access_token) {
		console.log('done, access token: ' + access_token);
	},
	denied: function() {
		console.log('user denied');
	},
	timeout: function(){
	    console.log('a timeout has occurred, probably a bad internet connection');
	}
	complete: function(access_token) {
		console.log('window closed');
		if(access_token) {
			console.log(access_token);
		} else {
			console.log('no access token');
		}
	},
	userInfo: function(userInfo) {
		if(userInfo) {
			console.log(JSON.stringify(userInfo));
		} else {
			console.log('no user info');
		}
	}
});

// Invite friends
FacebookInAppBrowser.invite('Get to know my app!', function(response) {
	if(response) {
		alert('success');
	}
});

// Same logic of callbacks
FacebookInAppBrowser.getInfo(function(response) {
	if(response) {
		var name = response.name,
            id = response.id,
            gender = response.gender;
	            
        // check the response object to see all available data like email, first name, last name, etc
        console.log(JSON.stringify(response));
	}
});

FacebookInAppBrowser.getPermissions(function(permissions) {
	if(permissions) {
		console.log(permissions.publish_actions, permissions);
	}
});

FacebookInAppBrowser.post({name: 'My post',
			               link: 'http://frop.me',
			               message: 'Try this out',
			               picture: 'http://caiovaccaro.com.br/wp-content/uploads/2013/10/frop01.jpg',
			               description: 'Sent trough mobile app'}, function(response) {
			                   if(response) {
			                       console.log('post successful');
			                   }
			               });
// Share urls
FacebookInAppBrowser.share({
    href: 'https://developers.facebook.com/docs/',
}, function(response) {
    i (response) {
		alert('success');
	}
});

// Logout
FacebookInAppBrowser.logout(function() {
	alert('bye');
});
``` 
If you are using jQuery or similar you can use it like: 
```javascript
// callbacks as before
$('#login').click(function() {
	FacebookInAppBrowser.login(...);
});

$('#invite').click(function() {
	FacebookInAppBrowser.invite(...);
}):

$('#bye').click(function() {
	FacebookInAppBrowser.logout(...);
});
``` 

Thanks
------
Thanks to:  
- @ilyakar
- @jcoltrane
