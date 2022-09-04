const { exec } = require("child_process");
const { waitForDebugger } = require("inspector");

class DataManager
{
	constructor(_adapter) {
		this.adapter = _adapter;
		//this.adapter.log.info("test");
		this.GetData("123");
	}

	GetData(oid)
	{
		//await wait(4000);
		//this.adapter.log.info("Test2");
		exec("curl 'http://192.168.123.32/ws' --digest -u USER:123 -H 'Content-Type: text/xml; charset=utf-8' -H 'Accept: text/xml' -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' -H 'SOAPAction:http://ws01.lom.ch/soap/listDP' -H 'Content-length: 479' -d '<?xml version=\"1.0\" encoding=\"UTF-8\"?><SOAP-ENV:Envelope xmlns:SOAP-ENV=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:SOAP-ENC=\"http://schemas.xmlsoap.org/soap/encoding/\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:ns=\"http://ws01.lom.ch/soap/\"><SOAP-ENV:Body><ns:getDpRequest><ref><oid>1/3/4/119/1</oid><prop/></ref><startIndex>0</startIndex><count>-1</count></ns:getDpRequest></SOAP-ENV:Body></SOAP-ENV:Envelope>",this.callback);
	}

	callback(_error, _response, _body)
	{
		let response =  "";
		response = _response;

		//this.adapter.log.info("testest");
		//this.adapter.log.info(_error);
		//this.adapter.log.info(_response);
		//this.adapter.log.info(_body);
		("sehe ich das? " + response);
		//const value = this.getValue(response,"value");
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

module.exports = DataManager;