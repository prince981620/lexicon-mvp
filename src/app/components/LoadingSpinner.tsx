const LoadingSpinner = () => (
  <div className="flex items-center space-x-2">
    <div className="spinner">
      <div className="double-bounce1"></div>
      <div className="double-bounce2"></div>
    </div>
    <span className="text-sm text-gray-500">Generating response...</span>
  </div>
);

export default LoadingSpinner; 