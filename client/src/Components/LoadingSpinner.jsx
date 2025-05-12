import { useEffect } from 'react';

const LoadingSpinner = () => {
  return (
    <div className="loading-container">
      <div className="spinner">
        <div className="bounce1"></div>
        <div className="bounce2"></div>
        <div className="bounce3"></div>
      </div>
      {/* <p className="loading-text">Loading product details...</p> */}
      
      <style>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
        }
        
        .spinner {
          margin: 40px auto;
          width: 70px;
          text-align: center;
        }
        
        .spinner > div {
          width: 18px;
          height: 18px;
          background-color: #333;
          border-radius: 100%;
          display: inline-block;
          margin: 0 3px;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        
        .spinner .bounce1 {
          animation-delay: -0.32s;
          background-color:rgb(0, 0, 0);
        }
        
        .spinner .bounce2 {
          animation-delay: -0.16s;
          background-color:rgb(0, 0, 0);
        }
        
        .spinner .bounce3 {
          background-color:rgb(0, 0, 0);
        }
        
        .loading-text {
          font-size: 1.2rem;
          color: #666;
          margin-top: 1rem;
          font-family: 'Roboto Flex', sans-serif;
        }
        
        @keyframes bounce {
          0%, 80%, 100% { 
            transform: scale(0);
          } 40% { 
            transform: scale(1.0);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;