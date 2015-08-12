var gcm 		= require('node-gcm');
var forEach		= require('async-foreach').forEach;

/*--GCM--*/
var sender = new gcm.Sender('AIzaSyDY-HnR2DOqLQ32kV33TP-jySpxB67Rlyk');
/*--GCM--*/

function sendNotification(message, title, gcmIds){
	console.log("Enviando mensaje:" + message);
	console.log("Titulo:" + title);
	console.log("gcmIds:" + gcmIds);
	
	var message = new gcm.Message({
	    timeToLive: 3,
	    data: {
	    	message: message,
			title: title
	    }
	});
	
	/**
	 * Parameters: message-literal, registrationIds-array, No. of retries, callback-function
	 */
	sender.send(message, gcmIds, 4, function (error, data) {
		if(error){
			console.log("Error: " + error);
		}
		else{
			console.log("Resultado Mensaje: " + JSON.stringify(data));			
		}
	});
}

function Notification(){
	this.sendNotificationByCondominium = function(condominiums, message, title, mongooseModel) {
		var gcmIds = [];
		
		for(var i = 0; i < condominiums.length; i++){
			mongooseModel.findById(condominiums[i])
			.select('pisos lotes')
			.populate([{path: 'pisos.deptos.propietarios.idUsuario'}, {path: 'lotes.propietarios.idUsuario'}])
			.exec(function(err, data){
				if(err){
					console.log("Error: " + err);
				}
				else{
					if(data.pisos != ''){
						data.pisos.forEach(function(piso, posP){
							piso.deptos.forEach(function(dpto, posDpto){
								dpto.propietarios.forEach(function(prop, posProp){
									gcmIds.push(prop.idUsuario.gcmId);
								});
							});
						});
					}
					else{
						data.lotes.forEach(function(lote, posL){
							lote.propietarios.forEach(function(prop, posProp){
								gcmIds.push(prop.idUsuario.gcmId);
							});
						});
					}
				}
				
				condominiums.forEach(function(consortium, posC){
					sendNotification(message, title, gcmIds);
				});
			});
		}
	},
	this.sendNotificationByUser = function(idUsers, message, title, mongooseModel){
		for(var i = 0; i < idUsers.length; i++){
			mongooseModel.findById(idUsers[i])
			.select('gcmId esAdministrador')
			.exec(function(err, data){
				if(err){
					console.log("Error: " + err);
				}
				else{
					if(!data.esAdministrador){
						sendNotification(message, title, data.gcmId);						
					}
				}
			});
		}
	}
};

module.exports = Notification;