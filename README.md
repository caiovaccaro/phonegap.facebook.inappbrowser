phonegap.facebook.inappbrowser
==============================

Currently under development.

FacebookInAppBrowser uses the InAppBrowser Phonegap plugin and localStorage. Does not require any SDK from Facebook or other libraries.

This repo is based on [this question and answer](http://stackoverflow.com/questions/16576977/is-there-any-facebook-plugin-for-phonegap-2-7-0) and on [this repo using ChildBrowser](https://github.com/purplecabbage/phonegap-plugins/tree/master/iPhone/ChildBrowser/FBConnectExample)

Until now "Login", "Logout" and "Invite(Request)" are available.

**FacebookInAppBrowser is under development.**

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
	};

FacebookInAppBrowser.login(loginSuccessCallback, loginUnknowErrorCallback);

// Invite friends
var inviteText = 'Get to know my app!',
	successCallback = function() {
		alert('Thanks! Your invite was sent.');
	},
	errorCallback = function() {
		alert("Sorry, we couldn't send your invitation. Try again?");
	};

FacebookInAppBrowser.invite(inviteText, successCallback, errorCallback);

// Logout
FacebookInAppBrowser.logout();
```