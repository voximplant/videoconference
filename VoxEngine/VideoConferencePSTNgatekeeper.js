var pin = "", call;

VoxEngine.addEventListener(AppEvents.CallAlerting, function (e) {
	call = e.call;
	e.call.addEventListener(CallEvents.Connected, handleCallConnected);
	e.call.addEventListener(CallEvents.Disconnected, handleCallDisconnected);
	e.call.answer();
});

function handleCallConnected(e) {
	e.call.say("Hello, please enter your conference pin using keypad and press pound key to join the conference.", Language.UK_ENGLISH_FEMALE);
	e.call.addEventListener(CallEvents.ToneReceived, function (e) {
		e.call.stopPlayback();		
		if (e.tone == "#") {
			// Try to call conference according the specified pin
          	var conf = VoxEngine.callConference('conf_'+pin, e.call.callerid(), e.call.displayName(), {"X-ClientType": "pstn_inbound"});
          	conf.addEventListener(CallEvents.Connected, handleConfConnected);
          	conf.addEventListener(CallEvents.Failed, handleConfFailed);
		} else {
			pin += e.tone;
		}
	});
	e.call.handleTones(true);
}

function handleConfConnected(e) {
	VoxEngine.sendMediaBetween(e.call, call);
}

function handleConfFailed(e) {
  	VoxEngine.terminate();
}

function handleCallDisconnected(e) {
	VoxEngine.terminate();
}