'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
// import './styles.css';

const Chat2 = () => {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState([]);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedHistory = JSON.parse(localStorage.getItem('chatHistoryd')) || [];
    setHistory(storedHistory);
  }, []);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSendMessage = async () => {
    if (!query) return;
    setLoading(true);
    const chat_type = "DIU";
    const data = {
      query,
      collection_name: 'diusecond',
      column_names: ['Question', 'Answer', 'URL', 'Other Info'],
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
      localStorage.setItem('chatHistoryd', JSON.stringify(updatedHistory));
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
    localStorage.removeItem('chatHistoryd');
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
      <h1 className="mb-4">DIU AI Assistant</h1>
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

export default Chat2;


// 'use client';

// import { useState, useEffect } from 'react';
// import axios from 'axios';

// const Chat2 = () => {
//   const [query, setQuery] = useState('');
//   const [history, setHistory] = useState([]);
//   const [response, setResponse] = useState('');
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const storedHistory = JSON.parse(localStorage.getItem('chatHistoryd')) || [];
//     setHistory(storedHistory);
//   }, []);

//   const handleInputChange = (e) => {
//     setQuery(e.target.value);
//   };

//   const handleSendMessage = async () => {
//     if (!query) return;
//     setLoading(true);
//     const chat_type = "DIU";
//     const data = {
//       query,
//       collection_name: 'diusecond',
//       column_names: ['Question', 'Answer', 'URL', 'Other Info'],
//       history,
//       chat_type,
//     };

//     try {
//       const res = await axios.post('http://192.168.150.141:5000/ask', data);
//       let newResponse = res.data.answer;

//       // Process the response to format it
//       newResponse = formatResponse(newResponse);

//       const updatedHistory = [...history, { question: query, answer: newResponse }];
//       setHistory(updatedHistory);
//       localStorage.setItem('chatHistoryd', JSON.stringify(updatedHistory));
//       setResponse(newResponse);
//       setQuery('');
//     } catch (error) {
//       console.error('Error fetching response:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleResetHistory = () => {
//     setHistory([]);
//     localStorage.removeItem('chatHistoryd');
//   };

//   // Function to format the response text
//   const formatResponse = (text) => {
//     //     const urlRegex = /(https?:\/\/[^\s]+)/g;
//     //     text = text.replace(urlRegex, (url) => {
//     //       // Strip trailing punctuation
//     //       let cleanUrl = url.replace(/[)\].,!?"]+$/, '');
//     //       return `<a href="${cleanUrl}" target="_blank">${cleanUrl}</a>`;
//     //     });
//     const urlRegex = /(https?:\/\/[^\s]+)/g;
//     text = text.replace(urlRegex, (url) => {
//       // Strip trailing punctuation
//       let cleanUrl = url.replace(/[)\].,!?"]+$/, '');
//       return `<a href="${cleanUrl}" target="_blank">${cleanUrl}</a>`;
//     });

//     // Add formatting for titles and other elements if needed
//     text = text.replace(/Title: (.+)/g, '<strong>$1</strong>');
//     text = text.replace(/Price: (.+)/g, '<p><strong>Price:</strong> $1</p>');
//     text = text.replace(/Instructor: (.+)/g, '<p><strong>Instructor:</strong> $1</p>');
//     text = text.replace(/What You'll Learn:/g, '<p><strong>What You\'ll Learn:</strong></p>');

//     return text;
//   };

//   // Handle pressing the Enter key
//   const handleKeyPress = (e) => {
//     if (e.key === 'Enter') {
//       handleSendMessage();
//     }
//   };

//   return (
//     <div className="container mt-5 chat-container">
//       <h1 className="mb-4">DIU AI Assistant</h1>
//       <div className="card chat-card">
//         <div className="card-body d-flex flex-column">
//           <div className="chat-history mb-3 flex-grow-1">
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
//               onKeyPress={handleKeyPress}
//               disabled={loading}
//             />
//             <button className="btn btn-primary" onClick={handleSendMessage} disabled={loading}>
//               {loading ? (
//                 <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
//               ) : (
//                 'Send'
//               )}
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

// export default Chat2;
