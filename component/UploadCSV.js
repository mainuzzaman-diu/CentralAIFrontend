import React, { useState } from 'react';
import axios from 'axios';

const UploadCSV = () => {
  const [file, setFile] = useState(null);
  const [collectionName, setCollectionName] = useState('');
  const [message, setMessage] = useState('');

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleCollectionNameChange = (event) => {
    setCollectionName(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setMessage('Please select a CSV file.');
      return;
    }
    if (!collectionName) {
      setMessage('Please provide a collection name.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('collection_name', collectionName);

    try {
      const response = await axios.post('http://192.168.150.141:5000/upload_csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        setMessage('Collection created and embeddings inserted successfully!');
      } else {
        setMessage('Error: ' + response.data.error);
      }
    } catch (error) {
      setMessage('An error occurred: ' + error.message);
    }
  };

  return (
    <div>
      <h1>Upload CSV</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="file">Select CSV file:</label>
          <input type="file" id="file" accept=".csv" onChange={handleFileChange} />
        </div>
        <div>
          <label htmlFor="collectionName">Collection Name:</label>
          <input
            type="text"
            id="collectionName"
            value={collectionName}
            onChange={handleCollectionNameChange}
          />
        </div>
        <button type="submit">Upload</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default UploadCSV;
