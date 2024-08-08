'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
// import './styles.css';

const DCL = () => {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState([]);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedHistory = JSON.parse(localStorage.getItem('chatHistory3')) || [];
    setHistory(storedHistory);
  }, []);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSendMessage = async () => {
    if (!query) return;
    setLoading(true);
    const chat_type = "DCL";
    const data = {
      query,
      collection_name: 'dclfirst',
      column_names: ['Product Name', 'Price', 'Product Details', 'Product URL'],
      history,
      chat_type,
    };

    try {
      const res = await axios.post('http://192.168.150.141:5000/ask', data);
      let newResponse = res.data.answer;

      // Process the response to format it
      newResponse = formatResponse(newResponse);

      const updatedHistory = [...history, { question: query, answer: newResponse }];
      setHistory(updatedHistory);
      localStorage.setItem('chatHistory3', JSON.stringify(updatedHistory));
      setResponse(newResponse);
      setQuery('');
    } catch (error) {
      console.error('Error fetching response:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetHistory = () => {
    setHistory([]);
    localStorage.removeItem('chatHistory3');
  };

  // Function to format the response text
  const formatResponse = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    text = text.replace(urlRegex, (url) => {
      // Strip trailing punctuation
      let cleanUrl = url.replace(/[)\].,!?"]+$/, '');
      return `<a href="${cleanUrl}" target="_blank">${cleanUrl}</a>`;
    });

    // Add formatting for titles and other elements if needed
    text = text.replace(/Title: (.+)/g, '<strong>$1</strong>');
    text = text.replace(/Price: (.+)/g, '<p><strong>Price:</strong> $1</p>');
    text = text.replace(/Instructor: (.+)/g, '<p><strong>Instructor:</strong> $1</p>');
    text = text.replace(/What You'll Learn:/g, '<p><strong>What You\'ll Learn:</strong></p>');

    return text;
  };

  // Handle pressing the Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="container mt-5 chat-container">
      <h1 className="mb-4">DCL AI Assistant</h1>
      <div className="card chat-card">
        <div className="card-body d-flex flex-column">
          <div className="chat-history mb-3 flex-grow-1">
            {history.map((chat, index) => (
              <div key={index} className="mb-2">
                <div><strong>User:</strong> {chat.question}</div>
                <div className="assistant-response" dangerouslySetInnerHTML={{ __html: chat.answer }}></div>
              </div>
            ))}
          </div>
          <div className="input-group mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Type your question..."
              value={query}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <button className="btn btn-primary" onClick={handleSendMessage} disabled={loading}>
              {loading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : (
                'Send'
              )}
            </button>
          </div>
          <div className="reset-button-container">
            <button className="btn btn-danger reset-button" onClick={handleResetHistory}>
              Reset History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DCL;


// 'use client';

// import { useState, useEffect } from 'react';
// import axios from 'axios';
// // import './Chat.css'; // Import the CSS file for styles

// const Chat = () => {
//   const [query, setQuery] = useState('');
//   const [history, setHistory] = useState([]);
//   const [response, setResponse] = useState('');

//   useEffect(() => {
//     const storedHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
//     setHistory(storedHistory);
//   }, []);

//   const handleInputChange = (e) => {
//     setQuery(e.target.value);
//   };

//   const handleSendMessage = async () => {
//     if (!query) return;

//     const data = {
//       query,
//       collection_name: 'iousecond',
//       column_names: ['Title', 'Price', 'what_you_learn', 'Slug', 'instructor'],
//       history,
//     };

//     try {
//       const res = await axios.post('http://192.168.150.141:5000/ask', data);
//       let newResponse = res.data.answer;

//       // Process the response to format it
//       newResponse = formatResponse(newResponse);

//       const updatedHistory = [...history, { question: query, answer: newResponse }];
//       setHistory(updatedHistory);
//       localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
//       setResponse(newResponse);
//       setQuery('');
//     } catch (error) {
//       console.error('Error fetching response:', error);
//     }
//   };

//   const handleResetHistory = () => {
//     setHistory([]);
//     localStorage.removeItem('chatHistory');
//   };

//   // Function to format the response text
//   const formatResponse = (text) => {
//     // Replace URLs with clickable links
//     const urlRegex = /(https?:\/\/[^\s]+)/g;
//     text = text.replace(urlRegex, (url) => `<a href="${url}" target="_blank">${url}</a>`);

//     // Add formatting for titles and other elements if needed
//     text = text.replace(/Title: (.+)/g, '<strong>$1</strong>');
//     text = text.replace(/Price: (.+)/g, '<p><strong>Price:</strong> $1</p>');
//     text = text.replace(/Instructor: (.+)/g, '<p><strong>Instructor:</strong> $1</p>');
//     text = text.replace(/What You'll Learn:/g, '<p><strong>What You\'ll Learn:</strong></p>');

//     return text;
//   };

//   return (
//     <div className="container mt-5">
//       <h1 className="mb-4">IOU AI Assistant</h1>
//       <div className="card">
//         <div className="card-body">
//           <div className="mb-3">
//             {history.map((chat, index) => (
//               <div key={index} className="mb-2">
//                 <div><strong>User:</strong> {chat.question}</div>
//                 <div className="assistant-response" dangerouslySetInnerHTML={{ __html: chat.answer }}></div>
//               </div>
//             ))}
//           </div>
//           <div className="input-group mb-3">
//             <input
//               type="text"
//               className="form-control"
//               placeholder="Type your question..."
//               value={query}
//               onChange={handleInputChange}
//             />
//             <button className="btn btn-primary" onClick={handleSendMessage}>
//               Send
//             </button>
//           </div>
//           <button className="btn btn-danger" onClick={handleResetHistory}>
//             Reset History
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Chat;



// 'use client';

// import { useState, useEffect } from 'react';
// import axios from 'axios';

// const Chat = () => {
//   const [query, setQuery] = useState('');
//   const [history, setHistory] = useState([]);
//   const [response, setResponse] = useState('');

//   useEffect(() => {
//     const storedHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
//     setHistory(storedHistory);
//   }, []);

//   const handleInputChange = (e) => {
//     setQuery(e.target.value);
//   };

//   const handleSendMessage = async () => {
//     if (!query) return;

//     const data = {
//       query,
//       collection_name: 'IOUCoursesFinal',
//       column_names: ['Title', 'Price', 'what_you_learn', 'Slug', 'instructor'],
//       history,
//     };

//     try {
//       const res = await axios.post('http://192.168.150.141:5000/ask', data);
//       const newResponse = res.data.answer;

//       const updatedHistory = [...history, { question: query, answer: newResponse }];
//       setHistory(updatedHistory);
//       localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
//       setResponse(newResponse);
//       setQuery('');
//     } catch (error) {
//       console.error('Error fetching response:', error);
//     }
//   };

//   const handleResetHistory = () => {
//     setHistory([]);
//     localStorage.removeItem('chatHistory');
//   };

//   return (
//     <div className="container mt-5">
//       <h1 className="mb-4">IOU AI Assistant</h1>
//       <div className="card">
//         <div className="card-body">
//           <div className="mb-3">
//             {history.map((chat, index) => (
//               <div key={index} className="mb-2">
//                 <div><strong>User:</strong> {chat.question}</div>
//                 <div><strong>Assistant:</strong> {chat.answer}</div>
//               </div>
//             ))}
//           </div>
//           <div className="input-group mb-3">
//             <input
//               type="text"
//               className="form-control"
//               placeholder="Type your question..."
//               value={query}
//               onChange={handleInputChange}
//             />
//             <button className="btn btn-primary" onClick={handleSendMessage}>
//               Send
//             </button>
//           </div>
//           <button className="btn btn-danger" onClick={handleResetHistory}>
//             Reset History
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Chat;

