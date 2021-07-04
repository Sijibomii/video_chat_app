/**
 * Create a Node.js HTTPS server. It listens in the IP and port given in the
 * configuration file and reuses the Express application as request listener.
 */
import  https from 'https';
import Config from './config'
import { expressApp } from './express';
let httpsServer: any;
const  runHttpsServer=async()=>{
   console.log('running an HTTPS server...');
 
   // HTTPS server for the protoo WebSocket server.
  //  const tls ={
  //    cert : fs.readFileSync(Config.https.tls.cert),
  //    key  : fs.readFileSync(Config.https.tls.key)
  //  };
 
   httpsServer = https.createServer(expressApp);
 
   await new Promise((resolve) =>{
     httpsServer.listen(
       Number(Config.https.listenPort), Config.https.listenIp, resolve);
   });
 } 
 export { httpsServer, runHttpsServer};