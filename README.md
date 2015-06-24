# videoconference

This code demonstrates video conference for multiple users. Deploy instructions:

* Register or login at https://manage.voximplant.com/
* Create a new application and name it "videoconf".
* Rent a conference phone number from "phone numbers" menu.
* Add "VideoConferenceP2P" scenario with source code from `VideoConferenceP2P.js`
* Add "VideoConferenceGatekeeper" scenario with source code from `VideoConferenceGatekeeper.js`
* Add "VideoConferencePSTNgatekeeper" scenario with source code from `VideoConferencePSTNgatekeeper.js`
* Add "VideoConference", scenario with source code from `VideoConference.js`, change `account_name` and `api_key` to values specified in your `voximplant` account.
* Add rule to application with `name` set to "InboundFromPSTN", `pattern` set to conference phone number and `scenario` set to "VideoConferencePSTNgatekeeper"
* Add rule to application with `name` set to "InboundCall", `pattern` set to "joinconf" and `scenario` set to "VideoConferenceGatekeeper"
* Add rule to application with `name` set to "Fwd", `pattern` set to "conf_[A-Za-z0-9]+" and `scenario` set to "VideoConference"
* Add rule to application with `name` set to "P2P", `pattern` set to ".*" and `scenario` set to "VideoConferenceP2P"
* Modify `auth.php` and set `API_KEY` and `ACCOUNT_NAME` to values specified in your `voximplant` account.
* Host `auth.php` and `index.html` on some web server. Each user that navigates `index.html` will be able to select a user name and join a conference.
