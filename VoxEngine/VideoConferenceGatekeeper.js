/**
* Video Conference Gatekeeper
* Handle inbound calls and route them to the conference
*/
var call,
    conferenceId,
	conf;

/**
* Inbound call handler
*/
VoxEngine.addEventListener(AppEvents.CallAlerting, function (e) {
  	// Get conference id from headers
  	conferenceId = e.headers['X-Conference-Id'];
  	Logger.write('User '+e.callerid+' is joining conference '+conferenceId);  	
  
  	call = e.call;
  	/**
    * Play some audio till call connected event
    */
	call.startEarlyMedia();
  	call.startPlayback("http://cdn.voximplant.com/bb_remix.mp3", true);
  	/**
    * Add event listeners
    */
  	call.addEventListener(CallEvents.Connected, sdkCallConnected);
  	call.addEventListener(CallEvents.Disconnected, function (e) {
		VoxEngine.terminate();
	});
	call.addEventListener(CallEvents.Failed, function (e) {
		VoxEngine.terminate();
	});
  	call.addEventListener(CallEvents.MessageReceived, function(e) {
      	Logger.write("Message Received: "+e.text);
        try {
          var msg = JSON.parse(e.text);
        } catch(err) {
          Logger.write(err);
        }
      
      	if (msg.type == "ICE_FAILED") {
      		conf.sendMessage(e.text);	
        } else if (msg.type == "CALL_PARTICIPANT") {
          	conf.sendMessage(e.text);
        }
  	});
  	// Answer the call
  	call.answer();
});

/**
* Connected handler
*/
function sdkCallConnected(e) {
  	// Stop playing audio
  	call.stopPlayback();
  	Logger.write('Joining conference');
  	// Call conference with specified id
  	conf = VoxEngine.callConference('conf_'+conferenceId, call.callerid(), call.displayName(), {"X-ClientType": "web"});  
  	Logger.write('CallerID: '+call.callerid()+' DisplayName: '+call.displayName());
  	// Add event listeners
  	conf.addEventListener(CallEvents.Connected, function (e) {
      Logger.write("VideoConference Connected");
      VoxEngine.sendMediaBetween(conf, call);
    });  
  	conf.addEventListener(CallEvents.Disconnected, VoxEngine.terminate);
  	conf.addEventListener(CallEvents.Failed, VoxEngine.terminate);
    conf.addEventListener(CallEvents.MessageReceived, function(e) {
      call.sendMessage(e.text);
    });  
}