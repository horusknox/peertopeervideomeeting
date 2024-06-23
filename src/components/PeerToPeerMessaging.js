import React, { useState, useEffect } from 'react';
import Peer from 'peerjs';
import './PeerToPeerMessaging.css'; // Import CSS file for styling

const PeerToPeerMessaging = () => {
  const [partyAId, setPartyAId] = useState('');
  const [partyBId, setPartyBId] = useState('');
  const [incomingMessages, setIncomingMessages] = useState([]);
  const [outgoingMessages, setOutgoingMessages] = useState([]);
  const [recognition, setRecognition] = useState(null);
  const [peer, setPeer] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  useEffect(() => {
    let storedId = localStorage.getItem('peerId');
    if (!storedId) {
      storedId = generateRandomId();
      localStorage.setItem('peerId', storedId);
    }
    setPartyAId(storedId);
  }, []);

  useEffect(() => {
    if (partyAId) {
      const peerInstance = new Peer(partyAId);
      peerInstance.on('open', (id) => {
        console.log('Your ID:', id);
      });
      peerInstance.on('call', (call) => {
        call.answer(localStream);
        call.on('stream', (remoteStream) => {
          setRemoteStream(remoteStream);
        });
      });
      setPeer(peerInstance);
    }
  }, [partyAId, localStream]);

  const startVideoCall = () => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        const call = peer.call(partyBId, stream);
        call.on('stream', (remoteStream) => {
          setRemoteStream(remoteStream);
        });
      })
      .catch((error) => {
        console.error('Error accessing media devices.', error);
      });
  };

  const stopVideoCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
      });
      setLocalStream(null);
    }
    if (remoteStream) {
      setRemoteStream(null);
    }
  };

  const generateRandomId = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let id = '';
    for (let i = 0; i < 5; i++) {
      id += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return id;
  };

  const sendMessage = () => {
    if (peer && partyBId) {
      const messageInput = document.getElementById('message');
      const message = messageInput.value;
      const conn = peer.connect(partyBId);
      conn.on('open', () => {
        conn.send(message);
        setOutgoingMessages([...outgoingMessages, message]);
      });
      messageInput.value = '';
    }
  };
    
  //test
  useEffect(() => {
    if (peer) {
      peer.on('connection', (conn) => {
        conn.on('data', (data) => {
          setIncomingMessages([...incomingMessages, data]);
        });
      });
    }
  }, [peer, incomingMessages]);

  const startSpeechRecognition = () => {
    if (window.webkitSpeechRecognition) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const speechToText = event.results[0][0].transcript;
        document.getElementById('message').value = speechToText;
      };

      recognition.onend = () => {
        document.getElementById('startSpeechBtn').style.display = 'inline-block';
        document.getElementById('stopSpeechBtn').style.display = 'none';
      };

      recognition.start();
      document.getElementById('startSpeechBtn').style.display = 'none';
      document.getElementById('stopSpeechBtn').style.display = 'inline-block';
      setRecognition(recognition);
    } else {
      console.error('Speech recognition is not supported in this browser.');
    }
  };

  const stopSpeechRecognition = () => {
    if (recognition) {
      recognition.stop();
    }
  };

  const changeBackgroundColor = (message) => {
    const colorRegex = /#(?:[0-9a-fA-F]{3}){1,2}\b/;
    const match = message.match(colorRegex);
    if (match) {
      document.body.style.backgroundColor = match[0];
    }
  };

  return (
    <div id="container">
      <h1>Peer-to-Peer Messaging with Video using WebRTC</h1>
      <p>Your ID: <span id="partyAId">{partyAId}</span></p>
        <label htmlFor="partyBId">Other Party's ID:</label>
        <input type="text" id="partyBId" value={partyBId} onChange={(e) => setPartyBId(e.target.value)} />
      <div>
        <label htmlFor="message">Message:</label>
        <input type="text" id="message" placeholder="Speak your message" />
        <button id="startSpeechBtn" className="speech-btn" onClick={startSpeechRecognition}>Start Listening</button>
        <button id="stopSpeechBtn" className="speech-btn" style={{ display: 'none' }} onClick={stopSpeechRecognition}>Stop Listening</button>
        <button onClick={sendMessage}>Send</button>
      </div>
       <div>
       
        <button onClick={startVideoCall}>Start Video Call</button>
        <button onClick={stopVideoCall}>Stop Video Call</button>
      </div>
      <div>
        {localStream && (
          <div>
            <h2>Local Video</h2>
            <video id="localVideo" autoPlay playsInline ref={(video) => {
              if (video) {
                video.srcObject = localStream;
              }
            }} />
          </div>
        )}
        {remoteStream && (
          <div>
            <h2>Remote Video</h2>
            <video id="remoteVideo" autoPlay playsInline ref={(video) => {
              if (video) {
                video.srcObject = remoteStream;
              }
            }} />
          </div>
        )}
      </div>
      <div>
        <h2>Messages</h2>
        <div id="messages">
          <div>
            <h3>Incoming Messages</h3>
            <ul>
              {incomingMessages.map((message, index) => (
                <li key={index}><strong>From Party B:</strong> {message}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Outgoing Messages</h3>
            <ul>
              {outgoingMessages.map((message, index) => (
                <li key={index}><strong>To Party B:</strong> {message}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeerToPeerMessaging;
