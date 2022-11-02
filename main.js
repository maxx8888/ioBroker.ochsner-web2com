/* eslint-disable indent */
"use strict";

/*
 * Created with @iobroker/create-adapter v2.2.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
//const { TIMEOUT } = require("dns");
//const adapterName = require("./package.json").name.split(".").pop();

// Load your modules here, e.g.:
const { exec } = require("child_process");
//const { stringify } = require("querystring");

let intervalMainLoop;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

class OchsnerWeb2com extends utils.Adapter {

	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "ochsner-web2com",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));

		//};
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize your adapter here
		this.log.info("Current server ip address: " + this.config.serverIP);

		// Reset the connection indicator during startup
		this.setState("info.connection", true, true);

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		//this.log.info("config option1: " + this.config.option1);
		//this.log.info("config option2: " + this.config.option2);

		/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables

		await this.setObjectNotExistsAsync("testVariable", {
			type: "state",
			common: {
				name: "testVariable",
				type: "boolean",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		*/

		// In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
		//this.subscribeStates("testVariable");

		this.subscribeStates("OID.*");
		// You can also add a subscription for multiple states. The following line watches all states starting with "lights."
		// this.subscribeStates("lights.*");
		// Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
		// this.subscribeStates("*");

		/*
			setState examples
			you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		*/
		// the variable testVariable is set to true as command (ack=false)
		//await this.setStateAsync("testVariable", true);

		// same thing, but the value is flagged "ack"
		// ack should be always set to true if the value is received from or acknowledged from the target system
		//await this.setStateAsync("testVariable", { val: true, ack: true });

		// same thing, but the state is deleted after 30s (getState will return null afterwards)
		//await this.setStateAsync("testVariable", { val: true, ack: true, expire: 30 });

		// examples for the checkPassword/checkGroup functions
		let result = await this.checkPasswordAsync("admin", "iobroker");
		this.log.info("check user admin pw iobroker: " + result);

		result = await this.checkGroupAsync("admin", "admin");
		this.log.info("check group user admin group admin: " + result);

		this.myMainLoop();

	}

	myMainLoop(counter=0){

		const oids = this.config.OIDs;

		if(oids) {this.GetData(oids[counter].oid, oids[counter].name);}

		if(counter < oids.length)
		{
			counter++;
		}
		else
		{
			counter = 0;
		}

		intervalMainLoop = wait(this.config.interval).then(() => this.myMainLoop(counter)).catch(() => {this.myMainLoop(0);});
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			// clearTimeout(timeout1);
			// clearTimeout(timeout2);
			// ...
			// clearInterval(interval1);
			if(intervalMainLoop) {clearTimeout(intervalMainLoop);}
			callback();
		} catch (e) {
			callback();
		}
	}

	// If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
	// You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
	// /**
	//  * Is called if a subscribed object changes
	//  * @param {string} id
	//  * @param {ioBroker.Object | null | undefined} obj
	//  */
	// onObjectChange(id, obj) {
	// 	if (obj) {
	// 		// The object was changed
	// 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
	// 	} else {
	// 		// The object was deleted
	// 		this.log.info(`object ${id} deleted`);
	// 	}
	// }

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
			if(id.includes(".OID."))
			{
				console.log("Change: inside startwidth");
				const oids = this.config.OIDs;
				const states = this.config.States;

				for(let i=0; i < oids.length; i++)
				{
					console.log("Change: " + id);

					if(id.endsWith(oids[i].oid) && oids[i].isState)
					{
						let bFound = false;
						for(let j=0; j < states.length; j++)
						{
							if(states[j].stateID == oids[i].stateID && state.val == states[j].stateValue)
							{
								this.setObjectNotExists("States." + oids[i].oid, {
									type: "state",
									common: {
										name: "States." + oids[i].name,
										type: "string",
										role: "value",
										read: true,
										write: false,
									},
									native: {},
								});
								this.setState("States." + oids[i].oid, { val: states[j].stateText, ack: true });
								bFound = true;
							}
						}

						if(bFound == false)
						{
							this.setObjectNotExists("States." + oids[i].oid, {
								type: "state",
								common: {
									name: "States." + oids[i].name,
									type: "string",
									role: "value",
									read: true,
									write: false,
								},
								native: {},
							});
							this.setState("States." + oids[i].oid, { val: "unknown", ack: true });
						}
					}
				}
			}
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	// If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.messagebox" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	// onMessage(obj) {
	// 	if (typeof obj === "object" && obj.message) {
	// 		if (obj.command === "send") {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info("send command");

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
	// 		}
	// 	}
	// }

	GetData(oid, _name = "")
	{
		let data =  "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
			data += "<SOAP-ENV:Envelope xmlns:SOAP-ENV=\"http://schemas.xmlsoap.org/soap/envelope/\" ";
			data += "xmlns:SOAP-ENC=\"http://schemas.xmlsoap.org/soap/encoding/\" ";
			data += "xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" ";
			data += "xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" ";
			data += "xmlns:ns=\"http://ws01.lom.ch/soap/\">";
			data += "<SOAP-ENV:Body><ns:getDpRequest><ref><oid>"+ oid +"</oid><prop/></ref>";
			data += "<startIndex>0</startIndex><count>-1</count></ns:getDpRequest></SOAP-ENV:Body></SOAP-ENV:Envelope>";

		let	cmd  =  " 'http://" + this.config.serverIP + "/ws' "; 						//concat Server Address
			cmd  += "--digest "; 														//digest Authentication.... so far curl the only thing found working well
			cmd  += "-u " + this.config.username + ":" + this.config.password + " "; 	//concat Username and Password
			cmd  += "-H 'Content-Type: text/xml; charset=utf-8' "; 						//Header
			cmd  += "-H 'Accept: text/xml' ";											//Header
			cmd  += "-H 'Cache-Control: no-cache' ";									//Header
			cmd  += "-H 'Pragma: no-cache' ";											//Header
			cmd  += "-H 'SOAPAction:http://ws01.lom.ch/soap/listDP' ";					//Header
			cmd  += "-H 'Content-length: " + data.length + "' -d ";						//Header

		exec("curl" + cmd + "'" + data +"'",(error,stdout,stderr) => {

			this.log.info("error: " + error);
			this.log.info("response: " + stdout);
			this.log.info("stderr: " + stderr);

			if(String(error).includes("curl: not found"))
			{
				this.log.error("Curl not installed. Please use apt-get install curl on console");
				return;
			}
			else if(error != null)
			{
				this.log.error("Curl returned Error. Please check Error details");
			}

			const _value = this.getValue(stdout,"value");
			this.log.info("Value: " + _value);

			const outputvalue = parseFloat(_value);

			if(!isNaN(outputvalue))
			{
				this.setObjectNotExists("OID." + oid, {
					type: "state",
					common: {
						name: _name,
						type: "number",
						role: "value",
						read: true,
						write: false,
					},
					native: {},
				});

				this.setState("OID." + oid, { val: outputvalue, ack: true });
			}
			else
			{
				this.setState("info.connection", false, true);
			}
		});
	}

	getValue(_input,_name)
	{
		let input = "";
		let start = "";
		let end = "";
		input = _input;
		start = "<" + _name + ">";
		end = "</" + _name + ">";

		let startpos = input.indexOf(start);

		if(startpos == -1)
			return "";

		if(input.indexOf(end) == -1)
			return "";

		startpos = startpos + start.length;
		return input.substring(startpos,input.indexOf(end));
	}

}

if (require.main !== module) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new OchsnerWeb2com(options);
} else {
	// otherwise start the instance directly
	new OchsnerWeb2com();
}


