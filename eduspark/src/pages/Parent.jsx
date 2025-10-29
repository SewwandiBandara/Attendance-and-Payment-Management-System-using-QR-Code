import React, { useState } from 'react';
import { FaRegCalendarAlt } from "react-icons/fa";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import { IoLogOutOutline } from "react-icons/io5";

const Parent = () => {
    const [selectedCard, setSelectedCard] = useState(null);
    const [activeCard, setActiveCard] = useState(null);
  
    const handleCardClick = (title) => {
      setSelectedCard(title);
      setActiveCard(title);
    };
  
    const renderContent = () => {
      switch(selectedCard) {
        case 'View Attendance':
          return <div>Attendance Records</div>;
        case 'View Payment':
          return <div>Payment History</div>;
        case 'Logout':
          return <div>Logout Confirmation</div>;
        default:
          return (
            <div className="text-gray-500 text-center mt-20">
              Select an option to view details
            </div>
          );
      }
    };
  
    return (
        <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-sky-400 text-white p-4 shadow-md">
          <h1 className="text-2xl font-bold">Parent Dashboard</h1>
        </header>

        <div className="flex">
          {/* Left Sidebar */}
          <div className="w-1/4 bg-indigo-100 min-h-screen p-4 border-r border-gray-200">
            {/* Welcome Section */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Welcome Parent!</h2>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="mb-2">
                  <label className="text-sm text-gray-600">Student ID:</label>
                  <p className="font-medium">#STU-1245</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Student Name:</label>
                  <p className="font-medium">John Doe</p>
                </div>
              </div>
            </div>
  
            {/* Navigation Cards */}
            <div className="space-y-4">
              <DashboardCard 
                title="View Attendance"
                icon={<FaRegCalendarAlt className="w-8 h-8"/>}
                color="purple"
                isActive={activeCard === 'View Attendance'}
                onClick={() => handleCardClick('View Attendance')}
              />
              <DashboardCard 
                title="View Payment"
                icon={<RiMoneyDollarCircleLine className="w-8 h-8"/>}
                color="green"
                isActive={activeCard === 'View Payment'}
                onClick={() => handleCardClick('View Payment')}
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
      purple: {
        border: 'border-purple-500',
        text: 'text-purple-500',
        bg: 'bg-purple-100'
      },
      green: {
        border: 'border-green-500',
        text: 'text-green-500',
        bg: 'bg-green-100'
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

export default Parent