const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-6 mt-16">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
        © {new Date().getFullYear()} PropEase. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
