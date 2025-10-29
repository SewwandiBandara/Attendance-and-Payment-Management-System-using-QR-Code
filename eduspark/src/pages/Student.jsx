import React, { useState } from 'react';
import { HiOutlineUserAdd } from "react-icons/hi";
import { FaRegCalendarAlt } from "react-icons/fa";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import { IoLogOutOutline } from "react-icons/io5";

const Student = () => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [activeCard, setActiveCard] = useState(null);

  const handleCardClick = (title) => {
    setSelectedCard(title);
    setActiveCard(title);
  };

  const renderContent = () => {
    switch(selectedCard) {
      case 'Classes':
        return <div>Vision Assistance Details</div>;
      case 'Payment':
        return <div>Payment History</div>;
      case 'Attendance':
        return <div>Attendance Records</div>;
      case 'Logout':
        return <div>Logout Confirmation</div>;
      default:
        return <div className="text-gray-500 text-center mt-20">Select a menu item to begin</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-sky-400 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">Student Dashboard</h1>
      </header>

      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-1/4 bg-indigo-100 min-h-screen p-4 border-r border-gray-200">
          {/* Welcome Section */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Welcome John Doe!</h2>
            <p className="text-gray-600 text-sm">View your student information</p>
          </div>

          {/* Navigation Cards */}
          <div className="space-y-4">
            <DashboardCard
              title="Classes"
              icon={<HiOutlineUserAdd className="w-8 h-8"/>}
              color="blue"
              isActive={activeCard === 'Classes'}
              onClick={() => handleCardClick('Classes')}
            />
            <DashboardCard 
              title="Payment"
              icon={<FaRegCalendarAlt className="w-8 h-8"/>}
              color="green"
              isActive={activeCard === 'Payment'}
              onClick={() => handleCardClick('Payment')}
            />
            <DashboardCard 
              title="Attendance"
              icon={<RiMoneyDollarCircleLine className="w-8 h-8"/>}
              color="purple"
              isActive={activeCard === 'Attendance'}
              onClick={() => handleCardClick('Attendance')}
            />
            <DashboardCard 
              title="Logout"
              icon={<IoLogOutOutline className="w-8 h-8"/>}
              color="pink"
              isActive={activeCard === 'Logout'}
              onClick={() => handleCardClick('Logout')}
            />
          </div>
        </div>

        {/* Right Content Area */}
        <div className="w-3/4 p-8 min-h-screen bg-white">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// Dashboard Card Component
const DashboardCard = ({ title, icon, color, isActive, onClick }) => {
  const colorVariants = {
    green: {
      border: 'border-green-500',
      text: 'text-green-500',
      bg: 'bg-green-100'
    },
    blue: {
      border: 'border-blue-500',
      text: 'text-blue-500',
      bg: 'bg-blue-100'
    },
    purple: {
      border: 'border-purple-500',
      text: 'text-purple-500',
      bg: 'bg-purple-100'
    },
    pink: {
      border: 'border-pink-500',
      text: 'text-pink-500',
      bg: 'bg-pink-100'
    }
  };

  return (
    <div 
      className={`flex items-center p-4 rounded-lg cursor-pointer transition-all
        ${isActive ? `${colorVariants[color].bg} border-l-4 ${colorVariants[color].border}` : 'hover:bg-gray-50'}`}
      onClick={onClick}
    >
      <div className={`w-8 h-8 mr-3 ${isActive ? colorVariants[color].text : 'text-gray-600'}`}>
        {icon}
      </div>
      <span className={`font-medium ${isActive ? 'text-gray-800' : 'text-gray-700'}`}>
        {title}
      </span>
    </div>
  );
};

export default Student;