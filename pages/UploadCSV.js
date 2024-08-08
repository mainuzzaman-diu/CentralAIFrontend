import React, { useState } from 'react';
import axios from 'axios';

const UploadCSV = () => {
  const [file, setFile] = useState(null);
  const [collectionName, setCollectionName] = useState('');
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setIsUploaded(false); // Reset upload state when file changes
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

    setIsUploading(true);
    setIsUploaded(false);
    setMessage('');

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
        setIsUploaded(true);
      } else {
        setMessage('Error: ' + response.data.error);
      }
    } catch (error) {
      setMessage('An error occurred: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Daffodil Central AI(Train your AI)</h1>
      {/* <h6 className='mb-4'>Upload CSV file</h6> */}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="file" className="form-label">Select CSV file:</label>
          <input type="file" id="file" accept=".csv" onChange={handleFileChange} className="form-control" />
        </div>
        <div className="mb-3">
          <label htmlFor="collectionName" className="form-label">Collection Name:</label>
          <input
            type="text"
            id="collectionName"
            value={collectionName}
            onChange={handleCollectionNameChange}
            className="form-control"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isUploading || isUploaded}>
          {isUploading ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              {' Uploading...'}
            </>
          ) : isUploaded ? 'Uploaded' : 'Upload'}
        </button>
      </form>
      {message && <div className="alert alert-info mt-3">{message}</div>}
    </div>
  );
};

export default UploadCSV;


// import React, { useState } from 'react';
// import axios from 'axios';

// const UploadCSV = () => {
//   const [file, setFile] = useState(null);
//   const [collectionName, setCollectionName] = useState('');
//   const [message, setMessage] = useState('');

//   const handleFileChange = (event) => {
//     setFile(event.target.files[0]);
//   };

//   const handleCollectionNameChange = (event) => {
//     setCollectionName(event.target.value);
//   };

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     if (!file) {
//       setMessage('Please select a CSV file.');
//       return;
//     }
//     if (!collectionName) {
//       setMessage('Please provide a collection name.');
//       return;
//     }

//     const formData = new FormData();
//     formData.append('file', file);
//     formData.append('collection_name', collectionName);

//     try {
//       const response = await axios.post('http://192.168.150.141:5000/upload_csv', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });

//       if (response.status === 200) {
//         setMessage('Collection created and embeddings inserted successfully!');
//       } else {
//         setMessage('Error: ' + response.data.error);
//       }
//     } catch (error) {
//       setMessage('An error occurred: ' + error.message);
//     }
//   };

//   return (
//     <div className="container mt-5">
//       <h1 className="mb-4">Upload CSV</h1>
//       <form onSubmit={handleSubmit}>
//         <div className="mb-3">
//           <label htmlFor="file" className="form-label">Select CSV file:</label>
//           <input type="file" id="file" accept=".csv" onChange={handleFileChange} className="form-control" />
//         </div>
//         <div className="mb-3">
//           <label htmlFor="collectionName" className="form-label">Collection Name:</label>
//           <input
//             type="text"
//             id="collectionName"
//             value={collectionName}
//             onChange={handleCollectionNameChange}
//             className="form-control"
//           />
//         </div>
//         <button type="submit" className="btn btn-primary">Upload</button>
//       </form>
//       {message && <div className="alert alert-info mt-3">{message}</div>}
//     </div>
//   );
// };

// export default UploadCSV;
