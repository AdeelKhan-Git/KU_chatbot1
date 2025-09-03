const Loader = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex space-x-2 ml-6">
        <span className="w-10 h-10 bg-primary-300 rounded-full animate-bounce [animation-delay:0s]"></span>
        <span className="w-10 h-10 bg-accent-50 rounded-full animate-bounce [animation-delay:0.2s]"></span>
        <span className="w-10 h-10 bg-primary-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
      </div>
    </div>
  );
};

export default Loader;
