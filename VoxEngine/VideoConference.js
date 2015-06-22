/**
* Require Conference module to get conferencing functionality
*/
require(Modules.Conference);

var videoconf,
	pstnconf,
	calls = [],
	pstnCalls = [],
	clientType,
    /**
    * HTTP API Access Info for user auto delete
    */
	apiURL = "https://api.voximplant.com/platform_api",
	account_name = "your_voximplant_account_name",
	api_key = "your_voximplant_api_key";

// Add event handler for session start event
VoxEngine.addEventListener(AppEvents.Started, handleConferenceStarted);

function handleConferenceStarted(e) {
    // Create 2 conferences right after session to manage audio in the right way
	videoconf = VoxEngine.createConference();
	pstnconf = VoxEngine.createConference();
}

/**
* Handle inbound call
*/
VoxEngine.addEventListener(AppEvents.CallAlerting, function (e) {
  	// get caller's client type
  	clientType = e.headers["X-ClientType"];
 	// Add event handlers depending on the client type	
	if (clientType == "web") {
		e.call.addEventListener(CallEvents.Connected, handleParticipantConnected);
		e.call.addEventListener(CallEvents.Disconnected, handleParticipantDisconnected);
	} else {
      	pstnCalls.push(e.call);
		e.call.addEventListener(CallEvents.Connected, handlePSTNParticipantConnected);
		e.call.addEventListener(CallEvents.Disconnected, handlePSTNParticipantDisconnected);
	}
	e.call.addEventListener(CallEvents.Failed, handleConnectionFailed);
	e.call.addEventListener(CallEvents.MessageReceived, handleMessageReceived);
  	// Answer the call
  	e.call.answer();
});

/**
* Message handler
*/
function handleMessageReceived(e) {
	Logger.write("Message Recevied: " + e.text);
	try {
		var msg = JSON.parse(e.text);
	} catch (err) {
		Logger.write(err);
	}
	
	if (msg.type == "ICE_FAILED") {
		// P2P call failed because of ICE problems - sending notification to retry
		var caller = msg.caller.substr(0, msg.caller.indexOf('@'));
		caller = caller.replace("sip:", "");
		Logger.write("Sending notification to " + caller);
		var call = getCallById(caller);
		if (call != null) call.sendMessage(JSON.stringify({
			type: "ICE_FAILED",
			callee: msg.callee,
          	displayName: msg.displayName
		}));
	} else if (msg.type == "CALL_PARTICIPANT") {
		// Conference participant decided to add PSTN participant (outbound call)
		for (var k = 0; k < calls.length; k++) calls[k].sendMessage(e.text);
		Logger.write("Calling participant with number " + msg.number);
		var call = VoxEngine.callPSTN(msg.number);
		pstnCalls.push(call);
		call.addEventListener(CallEvents.Connected, handleOutboundCallConnected);
		call.addEventListener(CallEvents.Disconnected, handleOutboundCallDisconnected);
		call.addEventListener(CallEvents.Failed, handleOutboundCallFailed);
	}
}

/**
* PSTN participant connected
*/
function handleOutboundCallConnected(e) {
	e.call.say("You have joined a conference", Language.UK_ENGLISH_FEMALE);
	e.call.addEventListener(CallEvents.PlaybackFinished, function (e) {
		for (var k = 0; k < calls.length; k++) calls[k].sendMessage(JSON.stringify({
			type: "CALL_PARTICIPANT_CONNECTED",
			number: e.call.number()
		}));
      	VoxEngine.sendMediaBetween(e.call, pstnconf);
      	e.call.sendMediaTo(videoconf);
	});
} 

/**
* PSTN participant disconnected
*/
function handleOutboundCallDisconnected(e) {
	Logger.write("PSTN participant disconnected " + e.call.number());
  	removePSTNparticipant(e.call);
	for (var k = 0; k < calls.length; k++) calls[k].sendMessage(JSON.stringify({
		type: "CALL_PARTICIPANT_DISCONNECTED",
		number: e.call.number()
	}));
}

/**
* Call to PSTN participant failed
*/
function handleOutboundCallFailed(e) {
	Logger.write("Call to PSTN participant " + e.call.number() + " failed");
  	removePSTNparticipant(e.call);
	for (var k = 0; k < calls.length; k++) calls[k].sendMessage(JSON.stringify({
		type: "CALL_PARTICIPANT_FAILED",
		number: e.call.number()
	}));
}

function removePSTNparticipant(call) {
  	for (var i = 0; i < pstnCalls.length; i++) {
        if (pstnCalls[i].number() == call.number()) {
            Logger.write("Caller with number " + call.number() + " disconnected");
            pstnCalls.splice(i, 1);
        }
    }
}

function handleConnectionFailed(e) {
	Logger.write("Participant couldn't join the conference");
}

function participantExists(callerid) {
	for (var i = 0; i < calls.length; i++) {
		if (calls[i].callerid() == callerid) return true;
	}
	return false;
}

function getCallById(callerid) {
	for (var i = 0; i < calls.length; i++) {
		if (calls[i].callerid() == callerid) return calls[i];
	}
	return null;
}

/**
* Web client connected
*/
function handleParticipantConnected(e) {
	if (!participantExists(e.call.callerid())) calls.push(e.call);
	e.call.say("You have joined the conference.", Language.UK_ENGLISH_FEMALE);
	e.call.addEventListener(CallEvents.PlaybackFinished, function (e) {
      	videoconf.sendMediaTo(e.call);
      	e.call.sendMediaTo(pstnconf);
		sendCallsInfo();
	});
}

function sendCallsInfo() {
  	var info = {
        peers: [],
        pstnCalls: []
    };
    for (var k = 0; k < calls.length; k++) {
        info.peers.push({
            callerid: calls[k].callerid(),
            displayName: calls[k].displayName()
        });
    }
    for (k = 0; k < pstnCalls.length; k++) {
        info.pstnCalls.push({
            callerid: pstnCalls[k].number()
        });
    }
    for (var k = 0; k < calls.length; k++) {
        calls[k].sendMessage(JSON.stringify(info));          	
    }
}

/**
* Inbound PSTN call connected
*/
function handlePSTNParticipantConnected(e) {
	e.call.say("You have joined the conference .", Language.UK_ENGLISH_FEMALE);
	e.call.addEventListener(CallEvents.PlaybackFinished, function (e) {
		VoxEngine.sendMediaBetween(e.call, pstnconf);
      	e.call.sendMediaTo(videoconf);
      	for (var k = 0; k < calls.length; k++) calls[k].sendMessage(JSON.stringify({
			type: "CALL_PARTICIPANT_CONNECTED",
			number: e.call.callerid(),
          	inbound: true
		}));
	});
}

/**
* Web client disconnected
*/
function handleParticipantDisconnected(e) {
	Logger.write("Disconnected:");
	for (var i = 0; i < calls.length; i++) {
		if (calls[i].callerid() == e.call.callerid()) {
          	/**
            * Make HTTP request to delete user via HTTP API
            */
			var url = apiURL + "/DelUser/?account_name=" + account_name +
				"&api_key=" + api_key +
				"&user_name=" + e.call.callerid();
			Net.httpRequest(url, function (res) {
				Logger.write("HttpRequest result: " + res.text);
			});
			Logger.write("Caller with id " + e.call.callerid() + " disconnected");
			calls.splice(i, 1);
		}
	}
	if (calls.length == 0) VoxEngine.terminate();
}

function handlePSTNParticipantDisconnected(e) {
  	removePSTNparticipant(e.call);
	for (var k = 0; k < calls.length; k++) calls[k].sendMessage(JSON.stringify({
		type: "CALL_PARTICIPANT_DISCONNECTED",
		number: e.call.callerid()
	}));
}