import React from 'react';

const ResourceCard = ({ resource, onClick }) => (
    <div 
        className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 p-6 rounded-2xl shadow-lg flex flex-col items-start hover:bg-gray-700/60 hover:border-purple-500 transition-all duration-300 cursor-pointer group"
        onClick={onClick}
    >
        <div className="text-4xl mb-4 transition-transform duration-300 group-hover:scale-110">{resource.icon}</div>
        <h3 className="text-xl font-bold text-white mb-2">{resource.title}</h3>
        <p className="text-gray-400 flex-grow">{resource.description}</p>
    </div>
);

export default ResourceCard;