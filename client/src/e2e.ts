/**
 * Insertable streams.
 *
 * https://github.com/webrtc/samples/blob/gh-pages/src/content/insertable-streams/endtoend-encryption/js/main.js
 */ 
 let e2eSupported:any = undefined;
 let worker: Worker | undefined = undefined;
 declare global{
   interface RTCRtpSender{
    createEncodedStreams: any
   }
 }
 export function isSupported()
 {
   if (e2eSupported === undefined)
   {
     if (RTCRtpSender.prototype.createEncodedStreams)
     {
       try
       {
         const stream = new ReadableStream();
 
         window.postMessage(stream, '*', [ stream as unknown as Transferable //did this to kill the error
        ]);
         worker = new Worker('/resources/js/e2e-worker.js', { name: 'e2e worker' });
 
         console.log('isSupported() | supported');
 
         e2eSupported = true;
       }
       catch (error)
       {
         console.log(`isSupported() | not supported: ${error}`);
 
         e2eSupported = false;
       }
     }
     else
     {
       console.log('isSupported() | not supported');
 
       e2eSupported = false;
     }
   }
 
   return e2eSupported;
 }
 
 export function setCryptoKey(operation: string, key: any, useCryptoOffset: boolean)
 {
   console.log(
     'setCryptoKey() [operation:%o, useCryptoOffset:%o]',
     operation, useCryptoOffset);
 
   assertSupported();
 
   worker!.postMessage(
     {
       operation        : operation,
       currentCryptoKey : key,
       useCryptoOffset  : useCryptoOffset
     });
 }
 
 export function setupSenderTransform(sender: { createEncodedStreams: () => any; })
 {
   console.log('setupSenderTransform()');
 
   assertSupported();
 
   const senderStreams = sender.createEncodedStreams();
   const readableStream = senderStreams.readable || senderStreams.readableStream;
   const writableStream = senderStreams.writable || senderStreams.writableStream;
 
   worker!.postMessage(
     {
       operation : 'encode',
       readableStream,
       writableStream
     },
     [ readableStream, writableStream ]
   );
 }
 
 export function setupReceiverTransform(receiver: { createEncodedStreams: () => any; })
 {
   console.log('setupReceiverTransform()');
 
   assertSupported();
 
   const receiverStreams = receiver.createEncodedStreams();
   const readableStream = receiverStreams.readable || receiverStreams.readableStream;
   const writableStream = receiverStreams.writable || receiverStreams.writableStream;
 
   worker!.postMessage(
     {
       operation : 'decode',
       readableStream,
       writableStream
     },
     [ readableStream, writableStream ]
   );
 }
 
 function assertSupported()
 {
   if (e2eSupported === false)
     throw new Error('e2e not supported');
   else if (e2eSupported === undefined)
     throw new Error('e2e not initialized, must call isSupported() first');
 }
 