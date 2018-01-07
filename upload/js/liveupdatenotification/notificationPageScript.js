!function($,XenForo,LiveUpdate,_undefined){
	if (typeof Notification !== 'undefined' &&
		typeof SharedWorker !== 'undefined') {
		Notification.requestPermission();
		XenForo.getBoardTitle = function(){
			var dom = document.querySelector(".boardTitle");
			if(dom!=null){
				return dom.textContent;
			}else{
				return XenForo.baseUrl();
			}
		};
		LiveUpdate.latestUpdateStateSentToWorker = null;
		LiveUpdate.getLatestUpdateState = function(){
			var alerts = parseInt($('#AlertsMenu_Counter span.Total').text());
			var conversations = parseInt($('#ConversationsMenu_Counter span.Total').text());
			var date = LiveUpdate.lastAjaxCompleted;
			return {"alerts":alerts,"conversations":conversations,"updated":date};
		};
		LiveUpdate._notificationSharedWorker = new SharedWorker("js/liveupdatenotification/notificationSharedWorker.js");
		LiveUpdate._notificationSharedWorker.port.start();
		LiveUpdate.lastDesktopNotification = null;
		LiveUpdate.lastDesktopNotificationDate = 0;
		LiveUpdate.feedNotificationSharedWorker = function(){
			setTimeout(function(){LiveUpdate.feedNotificationSharedWorker();},500);
			var msg = LiveUpdate.getLatestUpdateState();
			msg['boardTitle'] = XenForo.getBoardTitle();
			if(msg['updated']!=LiveUpdate.latestUpdateStateSentToWorker){
				LiveUpdate.latestUpdateStateSentToWorker = msg['updated'];
				LiveUpdate._notificationSharedWorker.port.postMessage(msg);
			}
		};
		LiveUpdate._notificationSharedWorker.port.onmessage = function(e){
			//console.log(e.data);
			//console.log(e.data.type);
			var message = e.data;
			if(message.type=='addNotification'){
				var data = message.data
				var attentionPending = data[0]['alerts']+data[0]['conversations']
				if(data[1]['updated']==0) return;
				var alerts = data[0]['alerts']-data[1]['alerts'];
				var conversations = data[0]['conversations']-data[1]['conversations'];
				var diffTotal = Math.abs(alerts) + Math.abs(conversations);
				if(diffTotal==0 || attentionPending==0){
					return;
				}
				var plural = "";
				if(attentionPending>1){
					plural = "s";
				}
				var opt = {}
				opt['body'] = "You have "+attentionPending+" unread notification"+plural;
				var icon = null;
				try{
					icon=document.querySelector("head link[rel=apple-touch-icon]").href;
				}catch(e){try{
					icon=document.querySelector('head meta[property="og:image"]').content;
				}catch(e){}}
				if(icon!=null){
					//opt['icon'] = icon; //During tests, the full URL to the image was ignored or made the notification don't show up at all
				}
				if(LiveUpdate.lastDesktopNotification!==null){
					LiveUpdate.lastDesktopNotification.close();
				}
				var notif = new Notification(data[0]['boardTitle'],opt);
				//console.log(notif);
				LiveUpdate.lastDesktopNotification = notif;
				LiveUpdate.lastDesktopNotificationDate = message.data[0].updated
				LiveUpdate._notificationSharedWorker.port.postMessage({'type':'notificationFired'});
				//console.info('notification fired');
			}else
			if(message.type=='cancelNotification'){
				if(LiveUpdate.lastDesktopNotification!==null && LiveUpdate.lastDesktopNotificationDate < message.data){
					LiveUpdate.lastDesktopNotification.close();
					//console.info('notification closed');
				}
			}
		}
		setTimeout(LiveUpdate.feedNotificationSharedWorker, 250);
	}
	else{
		if (typeof Notification === 'undefined') {
			console.log("Your browser doesn't support the Notifications API.");
		}
		if (typeof SharedWorker === 'undefined') {
			console.log("Your browser doesn't support the Web Workers API.");
		}
		console.log("LiveUpdate won't send you notifications in a fancy way.");
	}
}(jQuery,XenForo,LiveUpdate);
