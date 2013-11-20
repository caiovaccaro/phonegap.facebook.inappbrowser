phonegap.facebook.inappbrowser
==============================

Currently under development.

FacebookInAppBrowser uses the InAppBrowser Phonegap plugin and localStorage. Does not require any SDK from Facebook or other libraries.

This repo is based on [this question and answer](http://stackoverflow.com/questions/16576977/is-there-any-facebook-plugin-for-phonegap-2-7-0) and on [this repo using ChildBrowser](https://github.com/purplecabbage/phonegap-plugins/tree/master/iPhone/ChildBrowser/FBConnectExample)

Until now "Login", "Logout", "Invite(Request)" "getInfo(/me)" and "getPermissions(/id/permissions)" are available.

**FacebookInAppBrowser is under development.**  
**Phonegap v2.8 up to 3.0**

Setup
-----

To use FacebookInAppBrowser you need to follow these steps:
- Enable InAppBrowser in your Phonegap application as described in ["InAppBrowser - Accessing the Feature"](http://docs.phonegap.com/en/3.0.0/cordova_inappbrowser_inappbrowser.md.html#InAppBrowser). Instructions are the same for 2.8 up to 3.0 except for the command line interface. If you have 3.0 you need to install the InAppBrowser plugin trough the command line.
- Enable Storage in your Phonegap application as described in ["Storage - Accessing the Feature"](http://docs.phonegap.com/en/3.0.0/cordova_storage_storage.md.html#Storage). If you have 3.0 Storage is enabled by default.
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

// Login(accessToken will be stored trough localStorage in 'accessToken');
var loginSuccessCallback = function() {
		alert('Login successful');
		console.log(window.localStorage.getItem('accessToken'));
	},
	loginUnknowErrorCallback = function() {
		alert('Do you want to try again?');
	},
	userIdCallback = function() {
		// after the login is finished the getInfo() function is called in order to store the user id
		// if you want to do something with the user id right after we have it, use this third callback
		console.log(window.localStorage.getItem('uid'));
	};

FacebookInAppBrowser.login(loginSuccessCallback, loginUnknowErrorCallback, userIdCallback);

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
        console.log(response);
	}
});

FacebookInAppBrowser.getPermissions(function(permissions) {
	if(permissions) {
		console.log(permissions.publish_actions, permissions);
	}
});

FacebookInAppBrowser.post(function({name: 'My post',
									link: 'http://...',
									message: 'Try this out',
									picture: 'http://...',
									description: 'Sent trough mobile app'}, function(response) {
										if(response) {
											console.log('post successful');
										}
									}));

// Logout
FacebookInAppBrowser.logout(function() {
	alert('bye');
});
``` 
If you are using jQuery or similar you can use it like: 
```javascript
// callbacks already defined
$('#login').click(function() {
	FacebookInAppBrowser.login(loginSuccessCallback, loginUnknowErrorCallback, userIdCallback);
});

$('#invite').click(function() {
	FacebookInAppBrowser.invite(inviteText, callback);
}):

$('#bye').click(function() {
	FacebookInAppBrowser.logout(callback);
});
``` 
