var b = require("bonescript"); 
var fs = require("fs");
var SerialPort = require("serialport").SerialPort  
var serialPort = new SerialPort("/dev/ttyUSB0", {
     baudrate: 115200,  dataBits: 8,  parity: 'none',  stopBits: 1, flowControl: false, xon : false, rtscts:false, xoff:false, xany:false, buffersize:0
});

var timer0 = 0;
var numberdata     = fs.readFileSync('number.txt');
var intervalldata  = fs.readFileSync('intervall.txt');
var onoffdata      = fs.readFileSync('onoff.txt');
var homenumberdata = fs.readFileSync('homenumber.txt');
var numberstring;
var intervallstring;
var onoffstring;
var homenumberstring;
var indx;
var indx2;
var indata;
var msgcnt  = 0;
var maxcnt  = 30;
var msgread = 0;
var i;
var hstr;


function deleteSMS() {
var i;
    serialPort.write("AT+CMGF=1\r");  
    for(i=0;i<maxcnt;i++) serialPort.write("AT+CMGD=" + i.toString() + "\r"); 
}

serialPort.on('open', function () {    
    console.log('Serial communication open'); 
    numberstring     = numberdata.toString(); 
    intervallstring  = intervalldata.toString(); 
    onoffstring      = onoffdata.toString(); 
    homenumberstring = homenumberdata.toString(); 
    console.log("File Read Number   :" + numberstring); 
    console.log("File Read Intervall:" + intervallstring); 
    console.log("File Read Activity :" + onoffstring); 
    console.log("File Read Homenum. :" + homenumberstring); 
    // Delete All Messages
    deleteSMS(); 
    // alle "intervallstring" Minuten anrufen *60000 => 1ne Minute
    setInterval(gsm_message_call,parseInt(intervallstring)*60000); 
    // alle 10 Sekunden sie SMS checken
    // Die KonfigSMS muss so aufgebaut sein: MSGID1234,01759944339,4,1
    setInterval(gsm_message_reading,5000);
});

// RX-Routine
serialPort.on('data', function(data) {     
    console.log("Received data: " + data); 
    indata = data.toString();
    // Antwort auf Anfrage Anzahl der Nachrichten  
    indx = indata.indexOf("+CPMS:");
    if(indx != -1) {
        // Maximaler SMS Speicherplatz 
        maxcnt = parseInt(indata.substr(indata.indexOf(",")+1,3));       
        // aktuell belegter SMS Speicherplatz
        msgcnt = parseInt(indata.substr(indx+6,3));    
    }    
    // Antwort auf das Lesekommando 
    indx = indata.indexOf("+CMGR:");
    if(indx != -1) {
       indx = indata.indexOf("MSGID:1234,");
       if(indx != -1) {
          // neue Telefonnummer rauspulen  
          hstr            = indata.substr(indx+11,indata.length);
          indx            = hstr.indexOf(","); 
          numberstring    = hstr.substr(0,indx);
          // Intervall rauspulen
          hstr            = hstr.substr(indx+1,indata.length);
          intervallstring = hstr.substr(0,1); 
          // OnOffData rauspulen
          hstr            = hstr.substr(2,indata.length);
          onoffstring     = hstr.substr(0,1);
          // in die Dateien schreiben
          fs.writeFileSync('number.txt',numberstring);
          fs.writeFileSync('intervall.txt',intervallstring);
          fs.writeFileSync('onoff.txt',onoffstring);
          // SMS zurücksenden!
          gsm_message_sending("MSGID:1234"+","+numberstring+","+intervallstring+","+onoffstring,homenumberstring);    
       }
       else {
          indx = indata.indexOf("\",\"");
          hstr = indata.substr(indx+3,indata.length);
          gsm_message_sending("UNKNOWN: "+hstr,homenumberstring);
       }      
       // kompletten Nachrichtenspeicher löschen, wenn Nachricht gelesen
       setTimeout(function() { deleteSMS() } ,500); 
       console.log('Received'); 
    }    
});


function gsm_message_call() {
    if(onoffstring=="1") {
       serialPort.write("ATD"+numberstring+";\r");   
       console.log('Call has been sent');
    }
    else {
       console.log('Call function is standby');
    }
}

function gsm_message_reading() {    
    // in den Textmode versetzen 
    serialPort.write("AT+CMGF=1\r");
    // Anzahl der Nachrichten lesen
    serialPort.write("AT+CPMS=\"SM\"\r");
    // Wenn Nachrichten vorhanden, dann die erste Nachricht lesen
    if(msgcnt>0) { serialPort.write("AT+CMGR=0\r") }
    console.log('Reading Message'); 
}


function gsm_message_sending(message, phone_no) {  
//    setTimeout(function(){
//        serialPort.write("AT+CMGF=1\r")
//        setTimeout(function(){
//            serialPort.write("AT+CMGS=\""+phone_no+"\"\r")
//            setTimeout(function(){
//                serialPort.write(message+"\r")
//                setTimeout(function(){
//                    serialPort.write("\x1A")
//                }, 100);
//            }, 100);
//         }, 100);
//     }, 100);
    serialPort.write("AT+CMGF=1\r");
    serialPort.write("AT+CMGS=\""+phone_no+"\"\r");  
    serialPort.write(message); 
    serialPort.write(Buffer([0x1A]));  
    serialPort.write("^z"); 
    console.log('Message has been sent');
}