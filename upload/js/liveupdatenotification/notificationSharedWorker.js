latest = {'updated':0};
lastPortNotif = null;
self.addEventListener("connect", function (event_setup) {
	var port = event_setup.ports[0];
	port.addEventListener('message', function(event_message) {
		var data = event_message.data;
		if(typeof(data.updated)!=='undefined'){
			if(data.updated>latest.updated){
				//data is newer than latest in this scope
				port.postMessage({'type':'addNotification','data':[data,latest]});
				latest = data;
			}
		}else if(typeof(data.type)!=='undefined' && data.type == 'notificationFired'){
			//let's cancel previous notification
			if(lastPortNotif!==null){
				lastPortNotif.postMessage({'type':'cancelNotification','data':latest.updated});
			}
			//store the port
			lastPortNotif=port;
		}
	}, false);
	port.start();
}, false);
