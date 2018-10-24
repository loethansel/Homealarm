var b = require("bonescript"); 
var fs = require("fs");
var SerialPort = require("serialport").SerialPort  
//var serialPort = new SerialPort("/dev/ttyO1", {
//     baudrate: 115200,  dataBits: 8,  parity: 'none',  stopBits: 1, flowControl: false, xon : false, rtscts:false, xoff:false, xany:false, buffersize:0
//});
var serialPort = new SerialPort("/dev/ttyUSB0", {
     baudrate: 115200,  dataBits: 8,  parity: 'none',  stopBits: 1, flowControl: false, xon : false, rtscts:false, xoff:false, xany:false, buffersize:0
});  

var wachschutznumberdata = fs.readFileSync('wachschutznumber.txt');  
var homenumberdata       = fs.readFileSync('homenumber.txt');  
var homenumberstring;
var wachschutznumberstring;
var guthabenstring = '*100#'; 
var maxcnt  = 30;
var inputPin = 'P9_12'; 
var gsmpower = 'P9_23';
var delcmd   = 'DEL ALL';
var gsmcmd   = 'GSM';

b.pinMode(gsmpower,'out');
b.pinMode(inputPin, b.INPUT);
b.attachInterrupt(inputPin, setAlarm, b.CHANGE); 

serialPort.on('open', function () {    
    console.log('Serial communication open'); 
    b.digitalWrite(gsmpower,1); 
    homenumberstring        = homenumberdata.toString(); 
    wachschutznumberstring  = wachschutznumberdata.toString(); 
    console.log("File Read Number1  :" + homenumberstring); 
    console.log("File Read Number2  :" + wachschutznumberstring); 
//    b.digitalWrite(gsmpower,1); 
    // erstmal die Bitrate scannen lassen
    serialPort.write("AT\r"); serialPort.write("AT\r"); serialPort.write("AT\r");
    serialPort.write("AT\r"); serialPort.write("AT\r"); serialPort.write("AT\r"); 
    // alles aus Werkseinstellung zurücksetzen
//    serialPort.write("AT&F\r"); 

    // Rufnummer nicht unterdrücken
//    serialPort.write("AT+CLIP=1\r");
    // Modem in den SMS-Textmode versetzen, also nicht PDU
//    serialPort.write("AT+CMGF=?\r");
    // get current configuration
    serialPort.write("AT&V\r"); 
    // alle Nachrichten löschen
//    serialPort.write("AT+QMGDA=\""+delcmd+"\"\r");

    // jede sekunde
//       serialPort.write("ATD"+guthabenstring+"\r");  
//    serialPort.write("AT+CSCS=\"UCS2\"\r");
//    serialPort.write("AT+CUSD=1,\"*100#\",1\r");
//    serialPort.write("AT+CUSD=1,\"AA180C3602\",15\r"); 
//    setInterval(gsm_getguthaben_call,10000); 
    // gsm_message_call(); 
});

// RX-Routine
serialPort.on('data', function(data) {     
    console.log("Received data: " + data);    
});


function gsm_message_call() {
       serialPort.write("ATD"+homenumberstring+";\r");     
       console.log('Call has been sent');
}

function gsm_getguthaben_call() {
       serialPort.write("ATD"+guthabenstring+";\r");     
       console.log('Get Gutaben');
}


function setAlarm(x) {
var outstring; 

   if(x.value) {
      outstring = "High";      
   }      
   else { 
      outstring = "Low";     
      // Signalstärke anfragen
      // serialPort.write("AT+CSQ\r");
      // ...noch auf die Antwort warten 
      // Alarmmeldung absetzen
      gsm_message_sending("Alarm",homenumberstring);  
   }      
   console.log("IO has changed to: "+outstring); 
}


function gsm_message_sending(message, phone_no) {  
//var i;
    setTimeout(function(){
        serialPort.write('AT+CMGF=1\r'); 
        setTimeout(function(){
            serialPort.write('AT+CMGS=\"015112702601\"\r');
            setTimeout(function(){
                serialPort.write('test sms\r');
                setTimeout(function(){
                    serialPort.write('\x1A');
                }, 100);
            }, 100);
         }, 100);
     }, 100);





// alt reinkopiert
//    serialPort.write("AT+CMGF=1\r");
//    serialPort.write("AT+CMGS=\""+phone_no+"\"\r");  
//    for(i=0;i<0xFFFF;i++);;
//    serialPort.write(message); 
//    serialPort.write('\x1A');    
//    serialPort.write(Buffer([0x1A]));  
//    serialPort.write("^z"); 
//    console.log('Message has been sent');   
// ende alt reinkopiert


   // set Modem to Textmode
   //serialPort.write("AT+CMGF=1\r");
   // Zeichensatz einstellen 8-Bit 160 Zeichen pro Nachricht
   //   serialPort.write("AT+CSCS=\"GSM\"\r"); 
   // send receivenumber
   //serialPort.write("AT+CMGS=\""+phone_no+"\"\r");  
   // Send Message
   //serialPort.write(message); 
   // send Ctrl+Z
   //serialPort.write(Buffer([0x1A]));
   //console.log('Message has been sent');
}