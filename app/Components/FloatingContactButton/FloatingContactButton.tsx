import Link from 'next/link';
import { FaEnvelope } from 'react-icons/fa';

const FloatingContactButton = () => {
  return (
    <Link href="/#contact">
      <div className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg cursor-pointer transition duration-300">
        <FaEnvelope size={24} />
      </div>
    </Link>
  );
};

export default FloatingContactButton;
